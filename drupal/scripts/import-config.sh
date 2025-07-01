#!/bin/bash

# Import Drupal configuration (content structure)
# This imports content types, fields, vocabularies, views, etc.

echo "Importing Drupal configuration..."

# Check if config directory exists
if [ ! -d "/tmp/config/sync" ]; then
    echo "Error: Configuration directory /tmp/config/sync does not exist"
    exit 1
fi

# Check if there are any config files
if [ -z "$(ls -A /tmp/config/sync/*.yml 2>/dev/null)" ]; then
    echo "Error: No configuration files found in /tmp/config/sync"
    exit 1
fi

# Import configuration
echo "Importing configuration from /tmp/config/sync..."
drush config:import --source=/tmp/config/sync -y

# Check if import was successful
if [ $? -eq 0 ]; then
    echo "Configuration imported successfully"
    
    # Clear cache to apply changes
    echo "Clearing cache..."
    drush cr
    
    echo "Configuration import completed"
else
    echo "Error: Configuration import failed"
    exit 1
fi