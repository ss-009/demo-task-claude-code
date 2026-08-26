# 課題要件

出典: [`課題+開発_2412.pdf`](./課題+開発_2412.pdf)

## 課題概要

特定の画像ファイルへの Path を与えると、AI で分析し、その画像が所属する Class を返却する API があるとする。

このAPIに対してリクエストを投げ、レスポンスをDBに保存する処理を作成する。

ただし、実際に動作するAPIは存在しないため、APIの仕様からレスポンスを想定し、保存処理を作成する。

> ※ 必要であれば mock-up を作成し、その mock-up も一緒に提出する。

## 条件

- Python、Java、JavaScript、PHP のいずれかの言語でフレームワークを利用すること。
- UI の作成は任意。

## API仕様(想定・モック対象)

- URLベース: `http://example.com/`
- リクエスト: `POST`

### リクエストパラメータ

| パラメータ | 型 | 説明 | 例 |
| --- | --- | --- | --- |
| `image_path` | String | 画像ファイルPath | `/image/d03f1d36ca69348c51aa/c413eac329e1c0d03/test.jpg` |

### レスポンス(JSON)

**Success(リクエスト成功)**

```json
{
  "success": true,
  "message": "success",
  "estimated_data": {
    "class": 3,
    "confidence": 0.8683
  }
}
```

**Failure(リクエスト失敗)**

```json
{
  "success": false,
  "message": "Error:E50012",
  "estimated_data": {}
}
```

## データベース

レスポンスを保存するテーブル。以下はPDF記載のMySQL用CREATE文(利用するRDBに合わせて変更可)。

```sql
CREATE TABLE `ai_analysis_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) DEFAULT NULL,
  `success` tinyint(1) NOT NULL,
  `message` varchar(255) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `confidence` decimal(5,4) DEFAULT NULL,
  `request_timestamp` datetime(6) DEFAULT NULL,
  `response_timestamp` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

### カラム対応メモ

| カラム | 由来 |
| --- | --- |
| `image_path` | リクエストパラメータをそのまま保存 |
| `success` | レスポンスの `success` |
| `message` | レスポンスの `message` |
| `class` | `estimated_data.class`(失敗時は NULL) |
| `confidence` | `estimated_data.confidence`(失敗時は NULL) |
| `request_timestamp` | 外部APIへリクエストを送信した時刻 |
| `response_timestamp` | 外部APIからレスポンスを受信した時刻 |

## 本実装での方針

- 言語/フレームワーク: **TypeScript + NestJS**
- DB: **MySQL**(CREATE文に準拠) + **Prisma ORM**
- 外部AI分析APIは実在しないため、仕様通りのレスポンスを返す **モックAPIサーバー**(`mock-ai-api/`)を別プロセスとして用意し、実際にHTTP経由で呼び出す。
- 保存処理は Controller → Service → Repository の層構成とし、外部API呼び出しは専用クライアント層に分離する。
- 任意項目のUIとして、画像Pathを送信するフォームと分析ログ一覧を表示する簡易画面を用意する。
- 詳細な設計・規約は [`../CLAUDE.md`](../CLAUDE.md) を参照。
