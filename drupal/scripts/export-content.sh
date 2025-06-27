#!/bin/bash
set -e

cd /opt/bitnami/drupal

OUTPUT_DIR="/config/content-export"
mkdir -p $OUTPUT_DIR

echo "Exporting content..."

# Export all articles to JSON
vendor/bin/drush sql:query "
SELECT 
  n.nid,
  n.uuid,
  nfd.title,
  nfd.created,
  nfd.changed,
  nfd.status,
  b.body_value as body,
  b.body_format,
  s.field_summary_value as summary,
  GROUP_CONCAT(t.name SEPARATOR '|') as tags
FROM node n
INNER JOIN node_field_data nfd ON n.nid = nfd.nid
LEFT JOIN node__body b ON n.nid = b.entity_id AND b.bundle = 'article'
LEFT JOIN node__field_summary s ON n.nid = s.entity_id AND s.bundle = 'article'
LEFT JOIN node__field_tags ft ON n.nid = ft.entity_id AND ft.bundle = 'article'
LEFT JOIN taxonomy_term_field_data t ON ft.field_tags_target_id = t.tid
WHERE n.type = 'article'
GROUP BY n.nid
ORDER BY nfd.created DESC
" --format=json > $OUTPUT_DIR/articles.json

# Export taxonomy terms
vendor/bin/drush sql:query "
SELECT tid, uuid, name, description__value as description
FROM taxonomy_term_field_data
WHERE vid = 'tags'
ORDER BY name
" --format=json > $OUTPUT_DIR/tags.json

# Export configuration
vendor/bin/drush config:export --destination=$OUTPUT_DIR/config

echo "Content exported to $OUTPUT_DIR"
echo "Files created:"
ls -la $OUTPUT_DIR/