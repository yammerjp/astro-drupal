#!/bin/bash
set -e

cd /opt/bitnami/drupal

echo "Inserting sample content..."

# Create sample tags using PHP
echo "Creating tags..."
vendor/bin/drush php:eval '
use Drupal\taxonomy\Entity\Term;

$tags = ["Technology", "Web Development", "Drupal", "Astro", "Tutorial", "News"];
foreach ($tags as $tag_name) {
  $existing = \Drupal::entityTypeManager()
    ->getStorage("taxonomy_term")
    ->loadByProperties(["name" => $tag_name, "vid" => "tags"]);
  
  if (empty($existing)) {
    $term = Term::create([
      "vid" => "tags",
      "name" => $tag_name,
    ]);
    $term->save();
    echo "Created tag: " . $tag_name . "\n";
  } else {
    echo "Tag already exists: " . $tag_name . "\n";
  }
}'

# Create sample articles using Drush PHP script
vendor/bin/drush php:script /scripts/create-articles.php

echo "Sample content inserted successfully!"