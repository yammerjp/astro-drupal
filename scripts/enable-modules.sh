#!/bin/bash
set -e

cd /opt/bitnami/drupal

echo "Installing required modules..."

# First, install the modules via composer (cors is not needed for Drupal 10)
composer require drupal/admin_toolbar drupal/gin drupal/gin_toolbar --no-interaction

echo "Enabling required modules..."

# JSON API is included in Drupal core, just enable it
vendor/bin/drush en -y jsonapi

# CORS is built into Drupal 10 core, no need to enable separately

# Enable admin toolbar first
vendor/bin/drush en -y admin_toolbar admin_toolbar_tools

# Enable Gin theme and gin_toolbar
vendor/bin/drush theme:install gin -y || echo "Gin theme installation failed"
vendor/bin/drush en -y gin gin_toolbar || echo "Module enable failed"

# Set Gin as admin theme
vendor/bin/drush config-set system.theme admin gin -y
vendor/bin/drush config-set node.settings use_admin_theme 1 -y

# Include local settings if not already included
echo "Configuring settings.local.php..."
if ! grep -q "settings.local.php" sites/default/settings.php; then
  echo "" >> sites/default/settings.php
  echo "// Include local settings" >> sites/default/settings.php
  echo "if (file_exists(\$app_root . '/' . \$site_path . '/settings.local.php')) {" >> sites/default/settings.php
  echo "  include \$app_root . '/' . \$site_path . '/settings.local.php';" >> sites/default/settings.php
  echo "}" >> sites/default/settings.php
fi

# Copy local settings files if they exist
if [ -f /config/settings.local.php ]; then
  cp /config/settings.local.php sites/default/
fi
if [ -f /config/cors.settings.php ]; then
  cp /config/cors.settings.php sites/default/
fi

# Clear cache
vendor/bin/drush cr

echo "Modules enabled successfully!"