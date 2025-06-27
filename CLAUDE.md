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
# Start development environment (Drupal + MariaDB)
docker-compose up -d

# Enable Drupal modules (run after first startup)
docker exec astro-drupal-drupal-1 /scripts/enable-modules.sh

# Start Astro development server
npm run dev

# Build Astro for production
npm run build

# Preview production build
npm run preview
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

### Access URLs
- Drupal: http://localhost:8081
- Drupal Admin: http://localhost:8081/user/login
- JSON API: http://localhost:8081/jsonapi
- Astro Dev Server: http://localhost:4321

## Architecture

### Docker Setup
- Uses Bitnami Drupal 10 image with custom Dockerfile.dev for development
- MariaDB for database
- Port 8081 is used (not 8080) to avoid conflicts
- Volumes mount `./config` and `./scripts` as read-only

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
- Currently basic setup in `src/pages/index.astro`

## Important Notes

1. **First-time setup**: After `docker-compose up -d`, wait ~45 seconds for Drupal installation, then run the enable-modules script
2. **CORS**: Currently configured for development with permissive settings - restrict for production
3. **Mirror Registry**: Using mirror.gcr.io instead of Docker Hub to avoid rate limits
4. **Config Export**: Always export to `/config/sync` directory for ConfigMap generation