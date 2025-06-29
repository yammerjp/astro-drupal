<?php
/**
 * Add a file field to the Article content type.
 */

use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\Core\Entity\Entity\EntityFormDisplay;
use Drupal\Core\Entity\Entity\EntityViewDisplay;

// Create field storage
$field_storage = FieldStorageConfig::loadByName('node', 'field_attachment');
if (!$field_storage) {
  $field_storage = FieldStorageConfig::create([
    'field_name' => 'field_attachment',
    'entity_type' => 'node',
    'type' => 'file',
    'settings' => [
      'uri_scheme' => 's3',  // Use S3 storage
    ],
    'cardinality' => -1,  // Unlimited files
  ]);
  $field_storage->save();
  echo "Created field storage for field_attachment\n";
}

// Create field instance for Article content type
$field = FieldConfig::loadByName('node', 'article', 'field_attachment');
if (!$field) {
  $field = FieldConfig::create([
    'field_storage' => $field_storage,
    'bundle' => 'article',
    'label' => 'File Attachments',
    'settings' => [
      'file_extensions' => 'txt pdf doc docx jpg jpeg png gif zip',
      'file_directory' => 'articles/[date:custom:Y]-[date:custom:m]',
      'max_filesize' => '10 MB',
      'description_field' => TRUE,
    ],
  ]);
  $field->save();
  echo "Created field instance for Article content type\n";
}

// Add to form display
$form_display = EntityFormDisplay::load('node.article.default');
if ($form_display) {
  $form_display->setComponent('field_attachment', [
    'type' => 'file_generic',
    'weight' => 10,
    'settings' => [
      'progress_indicator' => 'bar',
    ],
  ])->save();
  echo "Added field to form display\n";
}

// Add to view display
$view_display = EntityViewDisplay::load('node.article.default');
if ($view_display) {
  $view_display->setComponent('field_attachment', [
    'type' => 'file_default',
    'weight' => 10,
    'label' => 'above',
    'settings' => [
      'use_description_as_link_text' => TRUE,
    ],
  ])->save();
  echo "Added field to view display\n";
}

echo "File field setup complete!\n";