# CLAUDE.md

このリポジトリで作業する Claude Code 向けのガイド。

## プロジェクト概要

画像Pathを受け取り、外部のAI画像分析APIへリクエストを送信し、そのレスポンス(分類結果)をDBへ保存するAPIサーバー。
課題の詳細仕様は [`docs/requirements.md`](docs/requirements.md) を参照。

外部AI分析APIは実在しないため、`mock-ai-api/` に仕様通りのレスポンスを返すモックサーバーを実装し、
`server/` の本体アプリが実際にHTTP経由でこれを呼び出す構成になっている。

## リポジトリ構成

```
.
├── docs/requirements.md   # 課題要件のMarkdown化
├── server/                # メインAPI (NestJS)
│   ├── prisma/            # schema.prisma & migrations
│   ├── src/
│   │   ├── analysis/      # controller / service / repository / dto (中心機能)
│   │   ├── ai-client/     # 外部AI分析APIへのHTTPクライアント
│   │   └── prisma/        # PrismaService (DIコンテナへの登録)
│   ├── public/            # 簡易UI (静的ファイル。index.html / app.js / style.css)
│   └── test/              # e2e テスト(unitテストは各モジュールと同階層に *.spec.ts で配置)
├── mock-ai-api/           # 外部AI分析APIのモックサーバー (Express)
├── docker-entrypoint-initdb.d/init.sh  # MySQL初期化(テスト用DB作成・権限付与)
└── docker-compose.yml     # mysql + server + mock-ai-api
```

## 技術スタック

- TypeScript / NestJS
- MySQL + Prisma ORM
- Jest(unit / e2e)
- Docker Compose(ローカル実行)

## アーキテクチャ方針

- レイヤ構成は Controller → Service → Repository。Repository が Prisma を直接扱い、Service はビジネスロジック(外部API呼び出し+保存)を担う。
- 外部AI分析APIの呼び出しは `ai-client` モジュールに分離し、Service からは抽象化されたインターフェース越しに利用する。
- リクエスト送信時刻・レスポンス受信時刻(`request_timestamp` / `response_timestamp`)は `ai-client` 側で計測し、Service に渡す。
- 外部APIが失敗レスポンス(`success: false`)を返した場合も例外にせず、そのままDBへ記録する(仕様上の正常系)。外部API自体への疎通エラー(タイムアウト等)は明確に区別してハンドリングする。
- DTOバリデーションは `class-validator` を用い、Controller層で行う。

## よく使うコマンド

`server/` ディレクトリ内で実行:

```bash
npm run start:dev       # 開発サーバー起動
npm run build           # ビルド
npm run test            # unitテスト
npm run test:e2e        # e2eテスト
npx prisma migrate dev  # マイグレーション適用
```

`mock-ai-api/` ディレクトリ内で実行:

```bash
npm run dev             # モックサーバー起動
```

ルートディレクトリ:

```bash
docker compose up -d    # mysql + server + mock-ai-api を一括起動
```

## 規約・注意事項

- コミット/PR前に `npm run test` と `npm run lint` を通すこと(`server/`)。
- `.env` はコミットしない。`.env.example` を更新すること。
- 兄弟ディレクトリ `../demo-task`(旧・Claude Code不使用の自前実装)は参照専用。変更しない。
