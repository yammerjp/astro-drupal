#!/bin/bash
set -e

# Main content management script
COMMAND=${1:-help}

case $COMMAND in
  setup)
    echo "Setting up content structure..."
    docker exec astro-drupal-drupal-1 /scripts/setup-content.sh
    ;;
  
  insert)
    echo "Inserting sample content..."
    docker exec astro-drupal-drupal-1 /scripts/insert-sample-content.sh
    ;;
  
  reset)
    echo "Resetting all content..."
    docker exec astro-drupal-drupal-1 /scripts/reset-content.sh
    ;;
  
  export)
    echo "Exporting content..."
    docker exec astro-drupal-drupal-1 /scripts/export-content.sh
    ;;
  
  refresh)
    echo "Performing full content refresh (reset + setup + insert)..."
    docker exec astro-drupal-drupal-1 /scripts/reset-content.sh
    docker exec astro-drupal-drupal-1 /scripts/setup-content.sh
    docker exec astro-drupal-drupal-1 /scripts/insert-sample-content.sh
    ;;
  
  help|*)
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup    - Set up content structure (fields, vocabularies)"
    echo "  insert   - Insert sample content"
    echo "  reset    - Delete all content (WARNING: destructive)"
    echo "  export   - Export content to JSON files"
    echo "  refresh  - Full refresh (reset + setup + insert)"
    echo "  help     - Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 refresh    # Reset and recreate all sample content"
    ;;
esac