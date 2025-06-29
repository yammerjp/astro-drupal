# Astro + Drupal Headless CMS

AstroプロジェクトにDrupal Headless CMSを統合した開発環境です。

## 概要

- **Astro**: フロントエンドフレームワーク（SSR対応）
- **Drupal**: Headless CMSとして使用
- **Docker Compose**: 開発環境の構築

## 必要な環境

- Docker Desktop
- Docker Compose
- Node.js (Astro用)
- (オプション) S3互換ストレージ（MinIO、AWS S3など）

## セットアップ

### 1. 環境変数の設定

```bash
# .envファイルを作成（.env.exampleをコピー）
cp .env.example .env
# 必要に応じて編集（ドメイン名、S3設定など）
```

主要な環境変数:
- `DOMAIN_SUFFIX`: サブドメインルーティング用のドメイン（例: `example.com`）
- `S3_*`: S3/MinIO設定（ファイルストレージ用）

### 2. 開発環境の起動

```bash
docker compose up -d
```

### 3. データベースの初期化（初回のみ）

初回起動後、データベースを初期化する必要があります：

```bash
# Drupalのインストールが完了するまで待つ（約45秒）
sleep 45

# データベース初期化スクリプトを実行
docker compose exec drupal /scripts/init-database.sh
```

このスクリプトは以下を実行します：
- 必要なモジュールの有効化（JSON API, Admin Toolbar, S3FS）
- Gin管理画面テーマの設定
- S3FS設定（環境変数から自動設定）

### 4. アクセスURL

サブドメインベースのアクセス（DOMAIN_SUFFIX環境変数で設定）:
- **Astro**: http://astro.{DOMAIN_SUFFIX}/
- **Drupal**: http://drupal.{DOMAIN_SUFFIX}/
- **MinIO Console**: http://minio.{DOMAIN_SUFFIX}/ (開発環境のみ)
- **Blob Storage**: http://blob.{DOMAIN_SUFFIX}/ (MinIO S3 API)

## ファイルストレージ（S3/MinIO）

### 開発環境でのMinIO使用

開発環境では自動的にMinIOが起動し、S3互換ストレージとして機能します。

```bash
# MinIO管理画面にアクセス
# URL: http://minio.{DOMAIN_SUFFIX}/
# デフォルトログイン: minioadmin / minioadmin
```

### 本番環境でのS3設定

本番環境では実際のAWS S3や他のS3互換サービスを使用できます：

```bash
# .env.productionで設定
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=your-bucket-name
S3_HOSTNAME=s3.amazonaws.com
S3_USE_HTTPS=true
S3_USE_PATH_STYLE=false
```

## 開発ワークフロー

### 1. Drupalでコンテンツ管理

1. 管理画面にログイン: http://localhost:8081/user/login
2. コンテンツタイプの作成
3. コンテンツの投稿
4. JSON APIで確認: http://localhost:8081/jsonapi

### 2. 設定の変更とエクスポート

```bash
# 設定をエクスポート
docker compose exec drupal drush config:export --destination=/config/sync

# エクスポートされた設定を確認
ls -la config/sync/
```

### 3. Kubernetes ConfigMapの生成

```bash
# ConfigMapを生成（デフォルト設定）
./scripts/generate-configmap.sh

# カスタム設定で生成
./scripts/generate-configmap.sh ./config drupal-config.yaml my-drupal-config production
```

生成されたConfigMapは他のリポジトリでKubernetesにデプロイする際に使用します。

## API エンドポイント

### JSON API

- **全コンテンツタイプ**: `http://localhost:8081/jsonapi`
- **ノード一覧**: `http://localhost:8081/jsonapi/node/article`
- **特定のノード**: `http://localhost:8081/jsonapi/node/article/{uuid}`

### CORS設定

開発環境では全てのオリジンからのアクセスを許可しています。本番環境では適切に制限してください。

## コンテンツ管理

### サンプルコンテンツの管理

```bash
# コンテンツ構造のセットアップ（フィールド、タクソノミー）
./bin/content-management.sh setup

# サンプルコンテンツの挿入
./bin/content-management.sh insert
```

### Drushコマンド

```bash
# キャッシュクリア
docker compose exec drupal drush cr

# 設定のインポート
docker compose exec drupal drush config:import --source=/config/sync

# モジュールの有効化
docker compose exec drupal drush en module_name

# データベースのバックアップ
docker compose exec drupal drush sql:dump > backup.sql
```

## トラブルシューティング

### Drupalが起動しない場合

```bash
# ログを確認
docker compose logs drupal

# コンテナを再起動
docker compose restart drupal
```

### 設定がインポートできない場合

```bash
# キャッシュをクリア
docker compose exec drupal drush cr

# 設定の差分を確認
docker compose exec drupal drush config:status
```

## 本番環境へのデプロイ

### Docker Composeを使用した本番環境

```bash
docker compose -f compose.production.yaml up -d
```

### 個別のDockerイメージビルド

1. Drupalイメージ
```bash
docker build -f drupal/Dockerfile.production -t your-registry/drupal:latest ./drupal
```

2. Astroイメージ
```bash
docker build -f astro/Dockerfile.production -t your-registry/astro:latest ./astro
```

### Kubernetes ConfigMapの適用
```bash
kubectl apply -f drupal-configmap.yaml
```

### Kubernetesマニフェストでの使用例
```yaml
volumes:
  - name: drupal-config
    configMap:
      name: drupal-config
volumeMounts:
  - name: drupal-config
    mountPath: /config/sync
    subPath: sync
  - name: drupal-config
    mountPath: /bitnami/drupal/sites/default/settings.local.php
    subPath: settings.local.php
```

## ディレクトリ構造

```
.
├── astro/                    # Astroアプリケーション
│   ├── src/                  # ソースコード
│   ├── public/               # 静的ファイル
│   ├── Dockerfile            # 開発用
│   ├── Dockerfile.production # 本番用
│   ├── package.json
│   ├── tsconfig.json
│   └── astro.config.mjs
├── drupal/                   # Drupal関連
│   ├── scripts/              # 管理スクリプト
│   │   ├── init-database.sh  # DB初期化スクリプト
│   │   ├── setup-content.sh  # コンテンツ構造設定
│   │   ├── insert-sample-content.sh  # サンプル挿入
│   │   └── create-articles.php  # 記事作成PHP
│   ├── Dockerfile            # 開発用
│   └── Dockerfile.production # 本番用
├── nginx/                    # リバースプロキシ設定
│   └── nginx.conf.template   # envsubstテンプレート
├── bin/                      # ユーティリティ
│   └── content-management.sh
├── compose.yaml              # 開発環境
├── compose.production.yaml   # 本番環境
└── .env.example              # 環境変数サンプル
```