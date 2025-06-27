<?php
/**
 * Local development settings for Drupal
 * 
 * This file should be included in settings.php
 */

// Database configuration from environment variables
$databases['default']['default'] = [
  'database' => getenv('DRUPAL_DATABASE_NAME') ?: 'drupal',
  'username' => getenv('DRUPAL_DATABASE_USER') ?: 'drupal',
  'password' => getenv('DRUPAL_DATABASE_PASSWORD') ?: 'drupal',
  'host' => getenv('DRUPAL_DATABASE_HOST') ?: 'localhost',
  'port' => getenv('DRUPAL_DATABASE_PORT_NUMBER') ?: '3306',
  'driver' => 'mysql',
  'prefix' => '',
  'collation' => 'utf8mb4_general_ci',
];

// File paths
$settings['file_public_path'] = 'sites/default/files';
$settings['file_private_path'] = '/bitnami/drupal/files-private';

// Development settings
$settings['container_yamls'][] = DRUPAL_ROOT . '/sites/development.services.yml';
$config['system.performance']['css']['preprocess'] = FALSE;
$config['system.performance']['js']['preprocess'] = FALSE;

// Disable caching for development
$settings['cache']['bins']['render'] = 'cache.backend.null';
$settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
$settings['cache']['bins']['page'] = 'cache.backend.null';

// Enable verbose error reporting
$config['system.logging']['error_level'] = 'verbose';

// Trusted host patterns
$settings['trusted_host_patterns'] = [
  '^localhost$',
  '^127\.0\.0\.1$',
  '^\*$',
];

// Include CORS settings
if (file_exists(__DIR__ . '/cors.settings.php')) {
  include __DIR__ . '/cors.settings.php';
}