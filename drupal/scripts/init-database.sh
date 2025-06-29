#!/bin/bash
# Initialize Drupal database with required modules and configurations
# This script should be run manually after setting up a new database

set -e

echo "=== Drupal Database Initialization Script ==="
echo "This script will initialize a fresh Drupal database with required modules and configurations."
echo ""

# Change to Drupal directory
cd /opt/bitnami/drupal

echo "Enabling core modules..."
vendor/bin/drush en -y jsonapi

echo "Enabling contrib modules..."
vendor/bin/drush en -y admin_toolbar admin_toolbar_tools

echo "Enabling S3FS module..."
vendor/bin/drush en -y s3fs

echo "Configuring Gin admin theme..."
vendor/bin/drush theme:install gin -y
vendor/bin/drush config-set system.theme admin gin -y
vendor/bin/drush config-set node.settings use_admin_theme 1 -y

# Configure S3FS from environment variables if set
if [ -n "$S3_ACCESS_KEY" ]; then
  echo "Configuring S3FS settings from environment variables..."
  vendor/bin/drush config-set s3fs.settings access_key "$S3_ACCESS_KEY" -y
  vendor/bin/drush config-set s3fs.settings secret_key "$S3_SECRET_KEY" -y
  vendor/bin/drush config-set s3fs.settings bucket "$S3_BUCKET" -y
  vendor/bin/drush config-set s3fs.settings region "${S3_REGION:-us-east-1}" -y
  vendor/bin/drush config-set s3fs.settings use_https "${S3_USE_HTTPS:-false}" -y
  vendor/bin/drush config-set s3fs.settings hostname "${S3_HOSTNAME:-minio:9000}" -y
  vendor/bin/drush config-set s3fs.settings use_path_style_endpoint "${S3_USE_PATH_STYLE:-true}" -y
  vendor/bin/drush config-set s3fs.settings public_folder "${S3_PUBLIC_FOLDER:-public}" -y
  vendor/bin/drush config-set s3fs.settings private_folder "${S3_PRIVATE_FOLDER:-private}" -y
  vendor/bin/drush config-set s3fs.settings use_presigned_urls "${S3_USE_PRESIGNED_URLS:-true}" -y
  vendor/bin/drush config-set s3fs.settings presigned_url_lifetime "${S3_PRESIGNED_URL_LIFETIME:-180}" -y
  
  # Set S3 as default file system if configured
  if [ "${S3_AS_DEFAULT_SCHEME:-true}" = "true" ]; then
    vendor/bin/drush config-set system.file default_scheme s3 -y
  fi
else
  echo "S3 environment variables not set. Skipping S3FS configuration."
fi


echo "Clearing cache..."
vendor/bin/drush cr

echo ""
echo "=== Database initialization complete! ==="
echo ""
echo "Default admin credentials (if using Bitnami image):"
echo "  Username: user"
echo "  Password: Check container logs or Bitnami documentation"
echo ""
echo "You can now access:"
echo "  - Drupal: http://drupal.${DOMAIN_SUFFIX}/"
echo "  - Admin: http://drupal.${DOMAIN_SUFFIX}/user/login"