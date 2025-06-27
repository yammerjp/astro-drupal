#!/bin/bash
set -e

cd /opt/bitnami/drupal

echo "WARNING: This will delete all content in your Drupal site!"
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

echo "Resetting content..."

# Delete all nodes (articles and pages)
vendor/bin/drush sql:query "DELETE FROM node__body WHERE bundle IN ('article', 'page');"
vendor/bin/drush sql:query "DELETE FROM node__field_summary WHERE bundle = 'article';"
vendor/bin/drush sql:query "DELETE FROM node__field_featured_image WHERE bundle = 'article';"
vendor/bin/drush sql:query "DELETE FROM node__field_tags WHERE bundle = 'article';"
vendor/bin/drush sql:query "DELETE FROM node_revision__body WHERE bundle IN ('article', 'page');"
vendor/bin/drush sql:query "DELETE FROM node_revision__field_summary WHERE bundle = 'article';"
vendor/bin/drush sql:query "DELETE FROM node_revision__field_featured_image WHERE bundle = 'article';"
vendor/bin/drush sql:query "DELETE FROM node_revision__field_tags WHERE bundle = 'article';"
vendor/bin/drush sql:query "DELETE FROM node_field_data WHERE type IN ('article', 'page');"
vendor/bin/drush sql:query "DELETE FROM node_field_revision WHERE type IN ('article', 'page');"
vendor/bin/drush sql:query "DELETE FROM node_revision WHERE type IN ('article', 'page');"
vendor/bin/drush sql:query "DELETE FROM node WHERE type IN ('article', 'page');"

# Delete all taxonomy terms in tags vocabulary
vendor/bin/drush sql:query "DELETE FROM taxonomy_term__parent WHERE bundle = 'tags';"
vendor/bin/drush sql:query "DELETE FROM taxonomy_term_field_data WHERE vid = 'tags';"
vendor/bin/drush sql:query "DELETE FROM taxonomy_term_data WHERE vid = 'tags';"

# Clear caches
vendor/bin/drush cr

echo "Content reset complete!"