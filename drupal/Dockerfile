FROM mirror.gcr.io/bitnami/drupal:11

USER root

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create directories for config export
RUN mkdir -p /config /scripts && \
    chown -R 1001:1001 /config /scripts

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

# Copy configuration files
COPY --chown=1001:1001 config/settings.local.php /opt/bitnami/drupal/sites/default/
COPY --chown=1001:1001 config/cors.settings.php /opt/bitnami/drupal/sites/default/

# Copy Docker scripts
COPY --chown=1001:1001 docker-scripts/ /docker-scripts/
RUN chmod +x /docker-scripts/*.sh

# Switch back to root for final setup
USER root

# Update settings.php to include settings.local.php
RUN echo "" >> /opt/bitnami/drupal/sites/default/settings.php && \
    echo "// Include local settings" >> /opt/bitnami/drupal/sites/default/settings.php && \
    echo "if (file_exists(\$app_root . '/' . \$site_path . '/settings.local.php')) {" >> /opt/bitnami/drupal/sites/default/settings.php && \
    echo "  include \$app_root . '/' . \$site_path . '/settings.local.php';" >> /opt/bitnami/drupal/sites/default/settings.php && \
    echo "}" >> /opt/bitnami/drupal/sites/default/settings.php && \
    chown 1001:1001 /opt/bitnami/drupal/sites/default/settings.php

USER 1001