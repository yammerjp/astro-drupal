#!/bin/bash
set -e

# Configuration
CONFIG_DIR="${1:-./config}"
OUTPUT_FILE="${2:-drupal-configmap.yaml}"
CONFIGMAP_NAME="${3:-drupal-config}"
NAMESPACE="${4:-default}"

# Check if config directory exists
if [ ! -d "$CONFIG_DIR" ]; then
    echo "Error: Config directory '$CONFIG_DIR' not found!"
    echo "Usage: $0 [config-dir] [output-file] [configmap-name] [namespace]"
    exit 1
fi

# Start ConfigMap YAML
cat > "$OUTPUT_FILE" << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: $CONFIGMAP_NAME
  namespace: $NAMESPACE
data:
EOF

# Add settings.local.php
cat >> "$OUTPUT_FILE" << 'EOF'
  settings.local.php: |
    <?php
    // Local settings for Kubernetes deployment
    
    // Database settings from environment
    $databases['default']['default'] = [
      'database' => getenv('DRUPAL_DATABASE_NAME'),
      'username' => getenv('DRUPAL_DATABASE_USER'),
      'password' => getenv('DRUPAL_DATABASE_PASSWORD'),
      'host' => getenv('DRUPAL_DATABASE_HOST'),
      'port' => getenv('DRUPAL_DATABASE_PORT_NUMBER'),
      'driver' => 'mysql',
      'prefix' => '',
      'collation' => 'utf8mb4_general_ci',
    ];
    
    // Config sync directory
    $settings['config_sync_directory'] = '/config/sync';
    
    // Trusted host patterns
    $settings['trusted_host_patterns'] = [
      '^.+$',
    ];
    
    // File paths
    $settings['file_public_path'] = 'sites/default/files';
    $settings['file_private_path'] = '/bitnami/drupal/files-private';
    
    // Performance settings
    $settings['cache']['bins']['render'] = 'cache.backend.null';
    $settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
    $settings['cache']['bins']['page'] = 'cache.backend.null';
EOF

# Add initialization script
cat >> "$OUTPUT_FILE" << 'EOF'
  init-drupal.sh: |
    #!/bin/bash
    set -e
    
    echo "Initializing Drupal configuration..."
    
    # Wait for database to be ready
    until drush sql:query "SELECT 1" > /dev/null 2>&1; do
        echo "Waiting for database..."
        sleep 5
    done
    
    # Import configuration if sync directory exists and has files
    if [ -d "/config/sync" ] && [ "$(ls -A /config/sync 2>/dev/null)" ]; then
        echo "Importing configuration..."
        drush config:import -y || echo "Config import failed, might be initial setup"
    fi
    
    # Enable required modules
    echo "Enabling modules..."
    drush en -y jsonapi cors gin gin_toolbar admin_toolbar admin_toolbar_tools || true
    
    # Set Gin as admin theme
    drush config-set system.theme admin gin -y || true
    drush config-set node.settings use_admin_theme 1 -y || true
    
    # Clear cache
    drush cr
    
    echo "Drupal initialization complete!"
EOF

# Process YAML files in config directory
if [ -d "$CONFIG_DIR/sync" ]; then
    echo "  # Configuration sync files" >> "$OUTPUT_FILE"
    
    # Find all YAML files in sync directory
    find "$CONFIG_DIR/sync" -name "*.yml" -type f | while read -r file; do
        # Get relative path from sync directory
        relative_path="${file#$CONFIG_DIR/sync/}"
        # Convert path to valid ConfigMap key (replace / with -)
        key="sync-$(echo "$relative_path" | tr '/' '-')"
        
        echo "Adding config file: $relative_path"
        
        # Add file to ConfigMap
        echo "  $key: |" >> "$OUTPUT_FILE"
        sed 's/^/    /' "$file" >> "$OUTPUT_FILE"
    done
fi

echo ""
echo "ConfigMap generated successfully: $OUTPUT_FILE"
echo ""
echo "To apply to Kubernetes:"
echo "  kubectl apply -f $OUTPUT_FILE"
echo ""
echo "To export Drupal configuration:"
echo "  docker-compose exec drupal drush config:export --destination=/config/sync"