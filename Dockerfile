FROM mirror.gcr.io/bitnami/drupal:10

USER root

# Install required modules only
RUN cd /opt/bitnami/drupal && \
    composer require \
        drupal/gin \
        drupal/gin_toolbar \
        drupal/admin_toolbar

USER 1001