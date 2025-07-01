# yrush データフォーマット仕様

## エクスポート形式（JSON）

### 全体構造

```json
{
  "metadata": {
    "exportedAt": "2025-07-01T15:21:19.226Z",
    "sourceUrl": "http://localhost:8081",
    "exportMethod": "json_api"
  },
  "taxonomyTerms": [...],
  "nodes": [...]
}
```

### metadata（メタデータ）

| フィールド | 型 | 説明 |
|----------|---|------|
| exportedAt | string (ISO 8601) | エクスポート実行日時 |
| sourceUrl | string | エクスポート元のDrupal URL |
| exportMethod | string | エクスポート方法（常に "json_api"） |

### taxonomyTerms（タクソノミー用語）

```json
{
  "tid": 7,
  "vid": "422ba851-5927-421f-a728-1b2eda53d54a",
  "name": "Astro",
  "description": "",
  "weight": 0,
  "parent": "0"
}
```

| フィールド | 型 | 説明 |
|----------|---|------|
| tid | number | タクソノミー用語ID |
| vid | string | ボキャブラリID（UUID形式） |
| name | string | 用語名 |
| description | string | 説明（空の場合も含む） |
| weight | number | 表示順序の重み |
| parent | string | 親用語ID（"0" = ルート） |

### nodes（ノード/コンテンツ）

```json
{
  "nid": 7,
  "type": "article",
  "title": "記事タイトル",
  "status": 1,
  "created": 1750860366,
  "changed": 1750860366,
  "body": {
    "value": "<p>HTMLコンテンツ</p>",
    "format": "full_html",
    "processed": "<p>処理済みHTML</p>",
    "summary": ""
  },
  "fields": {
    "field_summary": [...],
    "field_tags": [...]
  }
}
```

| フィールド | 型 | 説明 |
|----------|---|------|
| nid | number | ノードID |
| type | string | コンテンツタイプ（"article", "page"など） |
| title | string | タイトル |
| status | number | 公開状態（1=公開, 0=非公開） |
| created | number | 作成日時（Unix timestamp） |
| changed | number | 更新日時（Unix timestamp） |
| body | object | 本文（オプション） |
| fields | object | カスタムフィールド（オプション） |

#### body構造

| フィールド | 型 | 説明 |
|----------|---|------|
| value | string | 生のHTMLコンテンツ |
| format | string | テキストフォーマット（"full_html", "plain_text"など） |
| processed | string | 処理済みHTML（エクスポート時のみ） |
| summary | string | 要約テキスト |

#### カスタムフィールド例

**field_summary（テキストフィールド）**
```json
"field_summary": [
  {
    "value": {
      "value": "要約テキスト",
      "format": "plain_text",
      "processed": "<p>要約テキスト</p>\n"
    },
    "format": "plain_text"
  }
]
```

**field_tags（エンティティ参照）**
```json
"field_tags": [
  {
    "target_id": 7
  },
  {
    "target_id": 8
  }
]
```

## インポート時の注意点

### ID マッピング

- エクスポート時の `tid` や `nid` は、インポート先では新しいIDに置き換えられます
- `field_tags` などの参照関係は自動的に新しいIDにマッピングされます

### 必須フィールド

**タクソノミー用語**
- name
- vid（インポート先に同じボキャブラリが存在する必要があります）

**ノード**
- title
- type（インポート先に同じコンテンツタイプが存在する必要があります）

### 制限事項

1. **ファイル/画像**: 現在のバージョンでは、ファイルや画像の実体はエクスポートされません（参照のみ）
2. **ユーザー情報**: ノードの作成者情報はエクスポートされません
3. **リビジョン**: リビジョン履歴はエクスポートされません
4. **階層構造**: タクソノミーの階層構造（parent）は現在サポートされていません

## 使用例

### エクスポート
```bash
yrush export -u https://example.com -o content.json
```

### インポート
```bash
yrush import -u https://other-example.com -U admin -P password -i content.json
```

### プログラマティック使用

```typescript
import { DrupalExporter } from 'yrush';

const exporter = new DrupalExporter({
  baseUrl: 'https://example.com'
});

const data = await exporter.export();
console.log(`Exported ${data.nodes.length} nodes`);
```