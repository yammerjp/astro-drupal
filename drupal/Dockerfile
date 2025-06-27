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

# Copy Docker scripts
COPY docker-scripts/ /docker-scripts/
RUN chmod +x /docker-scripts/*.sh && chown -R 1001:1001 /docker-scripts

USER 1001