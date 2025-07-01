#!/bin/bash

# Export Drupal configuration (content structure)
# This exports content types, fields, vocabularies, views, etc.

echo "Exporting Drupal configuration..."

# Create config directory if it doesn't exist
mkdir -p /tmp/config/sync

# Export all configuration
drush config:export --destination=/tmp/config/sync -y

# Check if export was successful
if [ $? -eq 0 ]; then
    echo "Configuration exported successfully to /tmp/config/sync"
    
    # List exported files
    echo ""
    echo "Exported configuration files:"
    find /tmp/config/sync -name "*.yml" -type f | sort
else
    echo "Error: Configuration export failed"
    exit 1
fi