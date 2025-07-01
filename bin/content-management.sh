#!/bin/bash
set -e

# Simplified content management script
COMMAND=${1:-help}
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

case $COMMAND in
  setup)
    echo "Setting up content structure..."
    docker compose exec drupal /scripts/setup-content.sh
    ;;
  
  insert)
    echo "Inserting sample content..."
    docker compose exec drupal /scripts/insert-sample-content.sh
    ;;
  
  reset)
    echo "Resetting all content..."
    docker compose exec drupal /scripts/reset-content.sh
    ;;
  
  export)
    echo "Exporting content data via JSON API..."
    node "$PROJECT_ROOT/bin/export-content.js"
    ;;
  
  import)
    echo "Importing content data via JSON API..."
    shift
    node "$PROJECT_ROOT/bin/import-content.js" "$@"
    ;;
  
  export-config)
    echo "Exporting Drupal configuration..."
    docker compose exec drupal /scripts/export-config.sh
    # Copy config files to host
    rm -rf "$PROJECT_ROOT/config/sync"
    mkdir -p "$PROJECT_ROOT/config"
    docker compose cp drupal:/tmp/config/sync "$PROJECT_ROOT/config/"
    echo "Configuration exported to: $PROJECT_ROOT/config/sync"
    ;;
  
  import-config)
    echo "Importing Drupal configuration..."
    # Copy config files from host to container
    docker compose exec drupal mkdir -p /tmp/config
    docker compose cp "$PROJECT_ROOT/config/sync" drupal:/tmp/config/
    docker compose exec drupal /scripts/import-config.sh
    ;;
  
  refresh)
    echo "Refreshing content (reset + insert)..."
    docker compose exec drupal /scripts/reset-content.sh
    echo ""
    docker compose exec drupal /scripts/insert-sample-content.sh
    ;;
  
  help|*)
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup         - Set up content structure (fields, vocabularies)"
    echo "  insert        - Insert sample content"
    echo "  reset         - Delete all content"
    echo "  export        - Export content via JSON API"
    echo "  import [file] - Import content via JSON API"
    echo "  export-config - Export Drupal configuration"
    echo "  import-config - Import Drupal configuration"
    echo "  refresh       - Reset and insert fresh content"
    echo "  help          - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup                    # Set up content structure"
    echo "  $0 export                   # Export content to JSON"
    echo "  $0 import                   # Import from latest export"
    echo "  $0 import path/to/file.json # Import specific file"
    ;;
esac