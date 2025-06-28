#!/bin/bash
# This script runs automatically on container startup
# It's placed in Bitnami's init directory

# Check if modules are already enabled
if [ ! -f /bitnami/drupal/.modules_enabled ]; then
  echo "First time setup: Enabling required modules..."
  
  cd /opt/bitnami/drupal
  
  # Enable core modules
  vendor/bin/drush en -y jsonapi
  
  # Enable contrib modules
  vendor/bin/drush en -y admin_toolbar admin_toolbar_tools
  
  # Enable and set Gin theme
  vendor/bin/drush theme:install gin -y
  vendor/bin/drush config-set system.theme admin gin -y
  vendor/bin/drush config-set node.settings use_admin_theme 1 -y
  
  # Clear cache
  vendor/bin/drush cr
  
  # Mark as completed
  touch /bitnami/drupal/.modules_enabled
  
  echo "Modules enabled successfully!"
fi