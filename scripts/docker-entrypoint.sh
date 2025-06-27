#!/bin/bash
set -e

# Source the original entrypoint to set up environment
source /opt/bitnami/scripts/drupal/entrypoint.sh

# Start Drupal in background  
/opt/bitnami/scripts/drupal/run.sh &
DRUPAL_PID=$!

# Check if modules are already enabled
if [ ! -f /opt/bitnami/drupal/.modules_enabled ]; then
    echo "Waiting for Drupal to be ready..."
    sleep 45
    
    # Enable modules
    /scripts/enable-modules.sh || echo "Module installation will be retried on next restart"
    
    # Mark modules as enabled if successful
    if [ $? -eq 0 ]; then
        touch /opt/bitnami/drupal/.modules_enabled
    fi
fi

# Wait for the Drupal process
wait $DRUPAL_PID