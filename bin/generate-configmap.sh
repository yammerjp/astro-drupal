#!/bin/bash
set -e

# Generate Kubernetes ConfigMap from Drupal configuration
# This creates a ConfigMap YAML file from the exported configuration

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
CONFIG_DIR="$PROJECT_ROOT/config/sync"
OUTPUT_FILE="$PROJECT_ROOT/k8s/drupal-config.yaml"

# Check if config directory exists
if [ ! -d "$CONFIG_DIR" ]; then
    echo "Error: Configuration directory not found: $CONFIG_DIR"
    echo "Please run './bin/content-management.sh export-config' first"
    exit 1
fi

# Check if there are any config files
if [ -z "$(ls -A $CONFIG_DIR/*.yml 2>/dev/null)" ]; then
    echo "Error: No configuration files found in $CONFIG_DIR"
    exit 1
fi

# Create k8s directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/k8s"

# Generate ConfigMap YAML
echo "Generating ConfigMap from Drupal configuration..."

cat > "$OUTPUT_FILE" << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: drupal-config
  labels:
    app: drupal
    component: config
data:
EOF

# Add each config file to the ConfigMap
for file in "$CONFIG_DIR"/*.yml; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "  $filename: |" >> "$OUTPUT_FILE"
        # Indent the file content by 4 spaces
        sed 's/^/    /' "$file" >> "$OUTPUT_FILE"
    fi
done

echo ""
echo "ConfigMap generated successfully: $OUTPUT_FILE"
echo ""
echo "To apply this ConfigMap to your Kubernetes cluster:"
echo "  kubectl apply -f $OUTPUT_FILE"
echo ""
echo "To use in your Drupal deployment, mount the ConfigMap:"
echo "  - Mount path: /config/sync"
echo "  - Run: drush config:import --source=/config/sync"