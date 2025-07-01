# Content Migration Guide

This project uses Drupal's JSON API for content export and import, providing a simple and standard approach.

## Overview

- **Export**: Uses JSON API to fetch content from Drupal
- **Import**: Uses JSON API to create content in Drupal
- **No Drupal internals**: Works with standard Drupal APIs only

## Usage

### Export Content

```bash
# Export all content to JSON
./bin/content-management.sh export

# Output: export/content-export-YYYY-MM-DD.json
```

### Import Content

```bash
# Import from latest export
./bin/content-management.sh import

# Import specific file
./bin/content-management.sh import path/to/export.json
```

### Configuration Management

```bash
# Export Drupal configuration (content types, fields, etc.)
./bin/content-management.sh export-config

# Import configuration
./bin/content-management.sh import-config
```

## Environment Variables

For the import script to work with authentication:

```bash
export DRUPAL_USER=user
export DRUPAL_PASS=bitnami
export DRUPAL_URL=http://localhost:8081
```

## File Structure

```
bin/
├── content-management.sh  # Main CLI tool
├── export-content.js      # JSON API export
└── import-content.js      # JSON API import

drupal/scripts/
├── export-config.sh       # Drush config export
├── import-config.sh       # Drush config import
├── reset-content.sh       # Delete all content
├── setup-content.sh       # Create content structure
└── insert-sample-content.sh # Add sample data
```

## Workflow Example

```bash
# 1. Set up content structure in development
./bin/content-management.sh setup
./bin/content-management.sh insert

# 2. Export structure and content
./bin/content-management.sh export-config
./bin/content-management.sh export

# 3. Import in another environment
./bin/content-management.sh import-config
./bin/content-management.sh import
```

## Technical Details

### Export Format

The exported JSON contains:
- `metadata`: Export timestamp and source info
- `taxonomy_terms`: All taxonomy terms
- `nodes`: All content nodes with relationships

### Authentication

The import script uses HTTP Basic Authentication. Make sure to:
1. Enable JSON API write operations in Drupal
2. Use an account with content creation permissions
3. Set environment variables for credentials

### Limitations

- Files/media are referenced but not exported (use separate file sync)
- User accounts are not exported
- Some complex field types may need manual handling