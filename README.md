# Astro + Drupal Headless CMS

AstroプロジェクトにDrupal Headless CMSを統合した開発環境です。

## 概要

- **Astro**: フロントエンドフレームワーク（SSR対応）
- **Drupal**: Headless CMSとして使用
- **Docker Compose**: 開発環境の構築
- **Kubernetes**: 本番環境へのデプロイ（ConfigMap生成）

## 必要な環境

- Docker Desktop
- Docker Compose
- Node.js (Astro用)

## セットアップ

### 1. 環境変数の設定

```bash
cp .env.example .env
```

必要に応じて`.env`ファイルの値を変更してください。

### 2. 開発環境の起動

```bash
docker-compose up -d
```

初回起動時は以下の処理が自動的に実行されます：
- Drupalのインストール
- 必要なモジュールの有効化（JSON API, CORS, Gin theme）
- 管理画面テーマの設定
- Astroの依存関係インストール

### 3. アクセスURL

- **Astro開発サーバー**: http://localhost:4321
- **Drupal管理画面**: http://localhost:8081
- **Drupal JSON API**: http://localhost:8081/jsonapi

## 開発ワークフロー

### 1. Drupalでコンテンツ管理

1. 管理画面にログイン: http://localhost:8081/user/login
2. コンテンツタイプの作成
3. コンテンツの投稿
4. JSON APIで確認: http://localhost:8081/jsonapi

### 2. 設定の変更とエクスポート

```bash
# 設定をエクスポート
docker-compose exec drupal drush config:export --destination=/config/sync

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
./scripts/content-management.sh setup

# サンプルコンテンツの挿入
./scripts/content-management.sh insert

# すべてのコンテンツをリセット（削除）
./scripts/content-management.sh reset

# コンテンツをJSONにエクスポート
./scripts/content-management.sh export

# 完全リフレッシュ（リセット→セットアップ→挿入）
./scripts/content-management.sh refresh
```

### Drushコマンド

```bash
# キャッシュクリア
docker-compose exec drupal drush cr

# 設定のインポート
docker-compose exec drupal drush config:import --source=/config/sync

# モジュールの有効化
docker-compose exec drupal drush en module_name

# データベースのバックアップ
docker-compose exec drupal drush sql:dump > backup.sql
```

## トラブルシューティング

### Drupalが起動しない場合

```bash
# ログを確認
docker-compose logs drupal

# コンテナを再起動
docker-compose restart drupal
```

### 設定がインポートできない場合

```bash
# キャッシュをクリア
docker-compose exec drupal drush cr

# 設定の差分を確認
docker-compose exec drupal drush config:status
```

## 本番環境へのデプロイ

### Docker Composeを使用した本番環境

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 個別のDockerイメージビルド

1. Drupalイメージ
```bash
docker build -t your-registry/drupal:latest .
```

2. Astroイメージ
```bash
docker build -f Dockerfile.astro.prod -t your-registry/astro:latest .
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
├── src/                    # Astroプロジェクト
├── docker-compose.yml      # 開発環境設定
├── Dockerfile             # 本番用イメージ
├── Dockerfile.dev         # 開発用イメージ
├── config/                # Drupal設定
│   └── sync/             # エクスポートされた設定
├── scripts/               # ユーティリティスクリプト
│   ├── docker-entrypoint.sh
│   ├── enable-modules.sh
│   └── generate-configmap.sh
└── .env.example           # 環境変数サンプル
```