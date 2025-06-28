FROM mirror.gcr.io/bitnami/drupal:11

USER root

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /config /scripts

# Switch to drupal user for composer operations
USER 1001

# Set working directory
WORKDIR /opt/bitnami/drupal

# Install required Drupal modules via composer
RUN composer require \
    drupal/admin_toolbar \
    drupal/gin \
    drupal/gin_toolbar \
    --no-interaction

# Copy initialization scripts to Bitnami's init directory
# These scripts run automatically on container startup
COPY --chown=1001:1001 docker-scripts/docker-entrypoint-init.d/ /docker-entrypoint-init.d/
RUN chmod +x /docker-entrypoint-init.d/*.sh

USER 1001