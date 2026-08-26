# demo-task-claude-code

課題[demo-task](https://github.com/ss-009/demo-task)をclaude codeで改善したもの。

画像Pathを受け取り、外部のAI画像分析API(実在しないためモックで代替)へリクエストを送信し、
そのレスポンス(分類結果)をMySQLへ保存するAPIサーバー。

- 課題要件: [`docs/requirements.md`](docs/requirements.md)
- 実装方針・設計: [`CLAUDE.md`](CLAUDE.md)

## 構成

| ディレクトリ | 役割 |
| --- | --- |
| `server/` | メインAPI(NestJS + Prisma + MySQL)。簡易UIも同梱 |
| `mock-ai-api/` | 外部AI分析APIのモックサーバー(Express) |

## セットアップ(Docker Compose)

```bash
# ルートディレクトリで .env 作成(MySQLの認証情報)
cp .env.example .env

# mysql / mock-ai-api / server をまとめて起動
docker compose up -d --build

# 動作確認
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"image_path": "/image/d03f1d36ca69348c51aa/c413eac329e1c0d03/test.jpg"}'

# 分析ログ一覧
curl http://localhost:3000/analysis-logs

# 簡易UI
open http://localhost:3000/
```

サーバー起動時に `prisma migrate deploy` が自動実行され、`ai_analysis_log` テーブルが作成される。

停止する場合:

```bash
docker compose down
```

## ローカル開発(Docker不使用でアプリだけ実行する場合)

MySQLだけDockerで立てて、`server` / `mock-ai-api` はローカルで実行する場合:

```bash
docker compose up -d mysql

cd mock-ai-api
npm install
npm run dev          # http://localhost:4000

# 別ターミナル
cd server
npm install
cp .env.example .env # DATABASE_URL / AI_API_BASE_URL を必要に応じて調整
npx prisma migrate dev
npm run start:dev    # http://localhost:3000
```

## API

### `POST /analyze`

外部AI分析APIへ `image_path` を渡してリクエストし、レスポンスを `ai_analysis_log` に保存したうえで
外部API仕様と同じ形状(`success` / `message` / `estimated_data`)で返却する。

```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"image_path": "/image/test.jpg"}'
```

外部APIとの疎通自体に失敗した場合(タイムアウト等)は `502` を返すが、その場合も失敗内容はDBへ記録される。

### `GET /analysis-logs?page=1&limit=20`

保存済みの分析ログを新しい順に一覧取得する(簡易UI用)。

## mock-ai-api の動作確認用トリガー

`image_path` に以下の文字列を含めることで、`mock-ai-api` の応答を固定できる。

| 含める文字列 | 挙動 |
| --- | --- |
| `trigger-failure` | 常に `success: false`(`Error:E50012`)を返す |
| `trigger-servererror` | HTTP 500を返す(疎通エラーのシミュレート) |
| `trigger-timeout` | 10秒応答を遅延させる |
| 上記以外 | pathのハッシュ値から決定的な `class` / `confidence` を返す(約10%の確率でランダムに失敗) |

## テスト

```bash
cd server
npm run lint
npm test          # unit test
npm run test:e2e  # e2e test (要: mysqlコンテナ起動 + demo_task_test DB)
```

`test:e2e` 実行前に、`docker compose up -d mysql` でMySQLを起動しておくこと(`demo_task_test` データベースは
`pretest:e2e` スクリプトが `prisma migrate deploy` で自動的にマイグレーションを適用する。データベース自体が
存在しない場合は事前に作成しておくこと)。
