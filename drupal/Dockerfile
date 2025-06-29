FROM mirror.gcr.io/bitnami/drupal:11

USER root

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create scripts directory
RUN mkdir -p /scripts

# Switch to drupal user for composer operations
USER 1001

# Set working directory
WORKDIR /opt/bitnami/drupal

# Install required Drupal modules via composer
RUN composer require \
    drupal/admin_toolbar \
    drupal/gin \
    drupal/gin_toolbar \
    drupal/s3fs \
    aws/aws-sdk-php \
    --no-interaction

# Copy scripts into the image
COPY --chown=1001:1001 scripts/ /scripts/
RUN chmod +x /scripts/*.sh

USER 1001