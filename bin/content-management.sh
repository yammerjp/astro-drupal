#!/bin/bash
set -e

# Main content management script
COMMAND=${1:-help}

case $COMMAND in
  setup)
    echo "Setting up content structure..."
    docker compose exec drupal /scripts/setup-content.sh
    ;;
  
  insert)
    echo "Inserting sample content..."
    docker compose exec drupal /scripts/insert-sample-content.sh
    ;;
  
  help|*)
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup    - Set up content structure (fields, vocabularies)"
    echo "  insert   - Insert sample content"
    echo "  help     - Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 setup     # Set up content structure"
    echo "  $0 insert    # Insert sample content"
    ;;
esac