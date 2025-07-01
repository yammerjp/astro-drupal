#!/bin/bash

# Reset all content in Drupal (delete all nodes and taxonomy terms)
# WARNING: This will delete all content data!

echo "WARNING: This will delete ALL content from your Drupal site!"
echo "This includes all nodes (articles, pages) and taxonomy terms."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

echo ""
echo "Starting content reset..."

# Delete all nodes
echo "Deleting all nodes..."
drush sql:query "DELETE FROM node"
drush sql:query "DELETE FROM node_revision"
drush sql:query "DELETE FROM node_field_data"
drush sql:query "DELETE FROM node_field_revision"
drush sql:query "DELETE FROM node_revision__body"
drush sql:query "DELETE FROM node__body"
drush sql:query "DELETE FROM node__field_summary"
drush sql:query "DELETE FROM node_revision__field_summary"
drush sql:query "DELETE FROM node__field_featured_image"
drush sql:query "DELETE FROM node_revision__field_featured_image"
drush sql:query "DELETE FROM node__field_tags"
drush sql:query "DELETE FROM node_revision__field_tags"

# Delete all taxonomy terms
echo "Deleting all taxonomy terms..."
drush sql:query "DELETE FROM taxonomy_term_data"
drush sql:query "DELETE FROM taxonomy_term_field_data"
drush sql:query "DELETE FROM taxonomy_term_revision"
drush sql:query "DELETE FROM taxonomy_term_field_revision"
drush sql:query "DELETE FROM taxonomy_term__parent"
drush sql:query "DELETE FROM taxonomy_term_revision__parent"

# Clear cache
echo "Clearing cache..."
drush cr

echo ""
echo "Content reset completed. All nodes and taxonomy terms have been deleted."
echo "The content structure (content types, fields, vocabularies) remains intact."