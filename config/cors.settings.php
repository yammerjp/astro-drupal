<?php
/**
 * CORS configuration for Drupal 10
 * 
 * Add this to your settings.php file or include it
 */

// Enable CORS for JSON API
$config['jsonapi.settings']['read_only'] = FALSE;

// CORS settings for development
// WARNING: In production, restrict these values appropriately
$settings['cors.config'] = [
  'enabled' => TRUE,
  'allowedHeaders' => ['*'],
  'allowedMethods' => ['*'],
  'allowedOrigins' => ['*'],
  'exposedHeaders' => ['*'],
  'maxAge' => 3600,
  'supportsCredentials' => TRUE,
];

// Alternative: Set CORS headers directly
// This works for simple cases
if (PHP_SAPI !== 'cli') {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
}