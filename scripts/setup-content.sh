#!/bin/bash
set -e

cd /opt/bitnami/drupal

echo "Setting up content structure..."

# Create Article content type fields
echo "Creating custom fields for Article content type..."

# Enable taxonomy module first
vendor/bin/drush en -y taxonomy || true

# Create fields using PHP script instead (more reliable)
vendor/bin/drush php:eval '
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;
use Drupal\taxonomy\Entity\Vocabulary;

// Create tags vocabulary if it doesn'\''t exist
if (!Vocabulary::load("tags")) {
  $vocabulary = Vocabulary::create([
    "vid" => "tags",
    "name" => "Tags",
    "description" => "Article tags",
  ]);
  $vocabulary->save();
  echo "Created tags vocabulary\n";
} else {
  echo "Tags vocabulary already exists\n";
}

// Create field_summary
if (!FieldStorageConfig::loadByName("node", "field_summary")) {
  FieldStorageConfig::create([
    "field_name" => "field_summary",
    "entity_type" => "node",
    "type" => "text_long",
    "cardinality" => 1,
  ])->save();
  
  FieldConfig::create([
    "field_name" => "field_summary",
    "entity_type" => "node",
    "bundle" => "article",
    "label" => "Summary",
    "required" => FALSE,
  ])->save();
  echo "Created field_summary\n";
} else {
  echo "field_summary already exists\n";
}

// Create field_featured_image
if (!FieldStorageConfig::loadByName("node", "field_featured_image")) {
  FieldStorageConfig::create([
    "field_name" => "field_featured_image",
    "entity_type" => "node",
    "type" => "image",
    "cardinality" => 1,
  ])->save();
  
  FieldConfig::create([
    "field_name" => "field_featured_image",
    "entity_type" => "node",
    "bundle" => "article",
    "label" => "Featured Image",
    "required" => FALSE,
  ])->save();
  echo "Created field_featured_image\n";
} else {
  echo "field_featured_image already exists\n";
}

// Create field_tags
if (!FieldStorageConfig::loadByName("node", "field_tags")) {
  FieldStorageConfig::create([
    "field_name" => "field_tags",
    "entity_type" => "node",
    "type" => "entity_reference",
    "cardinality" => -1,
    "settings" => [
      "target_type" => "taxonomy_term",
    ],
  ])->save();
  
  FieldConfig::create([
    "field_name" => "field_tags",
    "entity_type" => "node",
    "bundle" => "article",
    "label" => "Tags",
    "required" => FALSE,
    "settings" => [
      "handler" => "default:taxonomy_term",
      "handler_settings" => [
        "target_bundles" => [
          "tags" => "tags",
        ],
      ],
    ],
  ])->save();
  echo "Created field_tags\n";
} else {
  echo "field_tags already exists\n";
}
'

# Configure display modes
echo "Configuring display modes..."

# Enable JSON API for custom fields
vendor/bin/drush config:set jsonapi.settings read_only 0 -y

# Clear cache
vendor/bin/drush cr

echo "Content structure setup complete!"