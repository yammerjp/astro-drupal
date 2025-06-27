# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro + Drupal Headless CMS project that combines:
- **Astro** (SSR-enabled frontend) running on Node.js
- **Drupal 10** as a headless CMS via Docker
- **Bitnami images** from mirror.gcr.io to avoid Docker Hub rate limits

## Essential Commands

### Development Environment
```bash
# Start full development environment (Astro + Drupal + MariaDB)
docker-compose up -d

# Enable Drupal modules (run after first startup)
docker exec astro-drupal-drupal-1 /scripts/enable-modules.sh

# View logs
docker-compose logs -f astro   # Astro logs
docker-compose logs -f drupal  # Drupal logs

# Restart services
docker-compose restart astro
docker-compose restart drupal

# Production environment
docker-compose -f docker-compose.prod.yml up -d
```

### Drupal Management
```bash
# Access Drupal container
docker-compose exec drupal bash

# Run Drush commands
docker-compose exec drupal drush cr                    # Clear cache
docker-compose exec drupal drush config:export --destination=/config/sync  # Export config
docker-compose exec drupal drush config:import --source=/config/sync       # Import config
docker-compose exec drupal drush sql:dump > backup.sql                    # Backup database

# Generate Kubernetes ConfigMap from exported config
./scripts/generate-configmap.sh
```

### Content Management
```bash
# Full content refresh with sample data
./scripts/content-management.sh refresh

# Individual operations
./scripts/content-management.sh setup    # Set up content structure
./scripts/content-management.sh insert   # Insert sample articles
./scripts/content-management.sh reset    # Delete all content
./scripts/content-management.sh export   # Export to JSON
```

### Access URLs
- Astro Frontend: http://localhost:4321
- Drupal Admin: http://localhost:8081/user/login
- JSON API: http://localhost:8081/jsonapi

## Architecture

### Docker Setup
- **Astro**: Node.js Alpine image with hot-reload for development
- **Drupal**: Bitnami Drupal 10 image with custom Dockerfile.dev
- **MariaDB**: Bitnami MariaDB for database
- Port mappings: Astro (4321), Drupal (8081), MariaDB (internal)
- Volumes: 
  - Astro source files mounted read-only for hot-reload
  - Drupal config and scripts mounted read-only
  - Named volumes for node_modules and data persistence
- Network: Services communicate via Docker network (drupal:8080 internally)

### Configuration Management
- `config/settings.local.php` - Local development settings (database, caching, etc.)
- `config/cors.settings.php` - CORS configuration for API access
- Settings are included via settings.php modification during module enablement
- ConfigMap generation script creates Kubernetes-ready configurations

### Key Scripts
- `scripts/enable-modules.sh` - Installs and enables JSON API, Admin Toolbar, and Gin theme
- `scripts/generate-configmap.sh` - Converts Drupal config exports to Kubernetes ConfigMap
- `scripts/docker-entrypoint.sh` - (Removed due to issues, using standard Bitnami entrypoint)

### Astro Configuration
- Server-side rendering (SSR) enabled with Node.js adapter
- Configured for standalone mode
- Pages structure:
  - `src/pages/index.astro` - Homepage with latest articles
  - `src/pages/articles/index.astro` - Article listing page
  - `src/pages/articles/[id].astro` - Individual article pages (dynamic)
- API client in `src/lib/drupal.ts` for fetching content from Drupal JSON API

### Content Structure
- **Article** content type with custom fields:
  - `field_summary` - Article summary/excerpt
  - `field_featured_image` - Featured image
  - `field_tags` - Taxonomy reference for tags
- **Tags** vocabulary for categorizing articles
- Sample content includes 5 Japanese articles about web development

## Important Notes

1. **First-time setup**: After `docker-compose up -d`, wait ~45 seconds for Drupal installation, then run the enable-modules script
2. **CORS**: Currently configured for development with permissive settings - restrict for production
3. **Mirror Registry**: Using mirror.gcr.io instead of Docker Hub to avoid rate limits
4. **Config Export**: Always export to `/config/sync` directory for ConfigMap generation