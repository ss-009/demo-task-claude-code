import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT ?? 4000);
const NUM_CLASSES = 10;
const RANDOM_FAILURE_RATE = 0.1;

interface AnalyzeRequestBody {
  image_path?: unknown;
}

type AnalyzeResponse =
  | { success: true; message: "success"; estimated_data: { class: number; confidence: number } }
  | { success: false; message: string; estimated_data: Record<string, never> };

/**
 * image_path のハッシュから疑似的な class/confidence を決定する。
 * 同じ path なら常に同じ結果を返すため、動作確認やテストが再現しやすい。
 */
function pseudoRandomFromPath(path: string): { class: number; confidence: number } {
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    hash = (hash * 31 + path.charCodeAt(i)) >>> 0;
  }
  const cls = hash % NUM_CLASSES;
  const confidence = 0.5 + ((hash >>> 8) % 5000) / 10000; // 0.5000 - 0.9999
  return { class: cls, confidence: Math.round(confidence * 10000) / 10000 };
}

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

app.post("/", async (req: Request<unknown, unknown, AnalyzeRequestBody>, res: Response) => {
  // trigger-timeout でクライアントが先に切断した場合など、書き込み時に
  // ソケットが既に閉じているケースを想定したセーフティネット。
  res.on("error", (err) => {
    console.error("Response stream error:", err.message);
  });

  const imagePath = req.body?.image_path;

  // 課題PDFの仕様通り、パラメータ不正もHTTP 200 + success:false で返す。
  // ステータスコードは疎通エラー(タイムアウト・5xx等)の判定にのみ使うため、
  // ドメインレベルのエラーとレイヤーを混同しないようにする。
  if (typeof imagePath !== "string" || imagePath.trim() === "") {
    return res.status(200).json({
      success: false,
      message: "Error:E40001",
      estimated_data: {},
    });
  }

  // 動作確認・テスト用のトリガー文字列。image_path に含めることで挙動を固定できる。
  if (imagePath.includes("trigger-failure")) {
    return res.status(200).json({
      success: false,
      message: "Error:E50012",
      estimated_data: {},
    });
  }

  if (imagePath.includes("trigger-servererror")) {
    return res.status(500).send("Internal Server Error");
  }

  if (imagePath.includes("trigger-timeout")) {
    // 呼び出し元(server)のaxiosタイムアウト(既定5秒)より長く待つことで、
    // タイムアウトを実際に再現する。その間にクライアントが切断した場合に備え、
    // 書き込み前にコネクションの生死を確認する。
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    if (res.writableEnded || res.destroyed) {
      return;
    }
  }

  if (Math.random() < RANDOM_FAILURE_RATE) {
    return res.status(200).json({
      success: false,
      message: "Error:E50012",
      estimated_data: {},
    });
  }

  const { class: estimatedClass, confidence } = pseudoRandomFromPath(imagePath);
  return res.status(200).json({
    success: true,
    message: "success",
    estimated_data: { class: estimatedClass, confidence },
  });
});

app.listen(PORT, () => {
  console.log(`mock-ai-api listening on port ${PORT}`);
});
