<?php
use Drupal\node\Entity\Node;
use Drupal\taxonomy\Entity\Term;
use Drupal\file\Entity\File;

/**
 * Create sample articles with Japanese content
 */

// Get taxonomy terms
$terms = \Drupal::entityTypeManager()
  ->getStorage('taxonomy_term')
  ->loadByProperties(['vid' => 'tags']);

$term_ids = array_keys($terms);

// Sample articles data
$articles = [
  [
    'title' => 'Astro と Drupal で作るヘッドレスCMSの構築方法',
    'body' => '<p>この記事では、Astroフレームワークを使用してDrupalをヘッドレスCMSとして活用する方法について解説します。</p>
<h2>なぜAstroとDrupalなのか？</h2>
<p>Astroは高速な静的サイト生成とサーバーサイドレンダリングをサポートし、Drupalは強力なコンテンツ管理機能を提供します。この組み合わせにより、開発者にとって使いやすく、編集者にとって管理しやすいウェブサイトを構築できます。</p>
<h2>主な利点</h2>
<ul>
<li>高速なページロード</li>
<li>優れたSEO対応</li>
<li>柔軟なコンテンツ管理</li>
<li>スケーラブルなアーキテクチャ</li>
</ul>',
    'summary' => 'AstroとDrupalを組み合わせて、モダンなヘッドレスCMSアーキテクチャを構築する方法を解説します。',
    'tags' => ['Astro', 'Drupal', 'Web Development', 'Tutorial'],
    'status' => 1,
  ],
  [
    'title' => 'JSON APIを使ったコンテンツの取得方法',
    'body' => '<p>DrupalのJSON APIモジュールを使用して、RESTful APIでコンテンツを取得する方法を詳しく見ていきましょう。</p>
<h2>基本的なエンドポイント</h2>
<p>JSON APIは以下のようなエンドポイントを提供します：</p>
<pre><code>GET /jsonapi/node/article
GET /jsonapi/node/article/{uuid}
GET /jsonapi/node/article?filter[status]=1</code></pre>
<h2>フィルタリングとソート</h2>
<p>クエリパラメータを使用して、結果をフィルタリングしたりソートしたりできます。</p>',
    'summary' => 'DrupalのJSON APIモジュールを使って、効率的にコンテンツを取得する方法を学びます。',
    'tags' => ['Drupal', 'Web Development', 'Tutorial'],
    'status' => 1,
  ],
  [
    'title' => 'Docker環境でのDrupal開発のベストプラクティス',
    'body' => '<p>Docker環境でDrupalを開発する際のベストプラクティスをご紹介します。</p>
<h2>環境の一貫性</h2>
<p>Dockerを使用することで、開発環境と本番環境の差異を最小限に抑えることができます。</p>
<h2>推奨される構成</h2>
<ul>
<li>Docker Composeを使用したマルチコンテナ構成</li>
<li>環境変数による設定管理</li>
<li>ボリュームマウントによる開発効率の向上</li>
<li>ヘルスチェックの実装</li>
</ul>
<h2>パフォーマンスの最適化</h2>
<p>開発環境でのパフォーマンスを向上させるために、適切なキャッシュ設定とボリューム設定が重要です。</p>',
    'summary' => 'Docker環境でDrupalを効率的に開発するためのベストプラクティスとヒントを紹介します。',
    'tags' => ['Drupal', 'Technology', 'Tutorial'],
    'status' => 1,
  ],
  [
    'title' => '最新のWeb開発トレンド2025',
    'body' => '<p>2025年のWeb開発における最新トレンドを見ていきましょう。</p>
<h2>主なトレンド</h2>
<ol>
<li><strong>エッジコンピューティング</strong>: より高速なレスポンスタイムを実現</li>
<li><strong>AIの統合</strong>: 開発プロセスへのAIの深い統合</li>
<li><strong>WebAssembly</strong>: ブラウザでのネイティブに近いパフォーマンス</li>
<li><strong>ヘッドレスCMS</strong>: より柔軟なコンテンツ配信</li>
</ol>
<h2>これからの展望</h2>
<p>これらのトレンドは、より良いユーザー体験と開発者体験の両方を提供することを目指しています。</p>',
    'summary' => '2025年のWeb開発業界における最新トレンドと今後の展望について解説します。',
    'tags' => ['Technology', 'Web Development', 'News'],
    'status' => 1,
  ],
  [
    'title' => 'Drupalのセキュリティベストプラクティス',
    'body' => '<p>Drupalサイトを安全に保つためのセキュリティベストプラクティスを確認しましょう。</p>
<h2>基本的なセキュリティ対策</h2>
<ul>
<li>定期的なセキュリティアップデートの適用</li>
<li>強固なパスワードポリシーの実施</li>
<li>不要なモジュールの無効化</li>
<li>適切な権限設定</li>
</ul>
<h2>高度なセキュリティ対策</h2>
<p>さらなるセキュリティ向上のために：</p>
<ul>
<li>Web Application Firewall (WAF)の導入</li>
<li>定期的なセキュリティ監査</li>
<li>バックアップとリカバリー計画</li>
</ul>',
    'summary' => 'Drupalサイトのセキュリティを強化するための実践的なガイドラインを提供します。',
    'tags' => ['Drupal', 'Technology'],
    'status' => 1,
  ],
];

// Create articles
foreach ($articles as $index => $article_data) {
  try {
    // Get tag term IDs
    $tag_ids = [];
    foreach ($article_data['tags'] as $tag_name) {
      foreach ($terms as $term) {
        if ($term->getName() === $tag_name) {
          $tag_ids[] = $term->id();
          break;
        }
      }
    }

    // Create the node
    $node = Node::create([
      'type' => 'article',
      'title' => $article_data['title'],
      'body' => [
        'value' => $article_data['body'],
        'format' => 'full_html',
      ],
      'field_summary' => [
        'value' => $article_data['summary'],
        'format' => 'plain_text',
      ],
      'field_tags' => $tag_ids,
      'uid' => 1,
      'status' => $article_data['status'],
      'created' => time() - (86400 * (count($articles) - $index)), // Stagger creation dates
      'changed' => time() - (86400 * (count($articles) - $index)),
    ]);

    $node->save();
    echo "Created article: " . $article_data['title'] . " (ID: " . $node->id() . ")\n";
    
  } catch (\Exception $e) {
    echo "Error creating article '" . $article_data['title'] . "': " . $e->getMessage() . "\n";
  }
}

// Create a sample page
try {
  $page = Node::create([
    'type' => 'page',
    'title' => 'About Us',
    'body' => [
      'value' => '<p>私たちについてのページです。</p><p>このサイトはAstroとDrupalを使用して構築されています。</p>',
      'format' => 'full_html',
    ],
    'uid' => 1,
    'status' => 1,
  ]);
  $page->save();
  echo "Created page: About Us (ID: " . $page->id() . ")\n";
} catch (\Exception $e) {
  echo "Error creating page: " . $e->getMessage() . "\n";
}

echo "Sample content creation completed!\n";