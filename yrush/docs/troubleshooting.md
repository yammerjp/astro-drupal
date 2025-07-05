# Troubleshooting Guide

## Common Issues

### Authentication Errors

#### Problem: "Authentication failed" error
**Symptoms:**
- Error code: `AUTH_ERROR`
- HTTP 401 errors

**Solutions:**
1. Verify your username and password are correct
2. Check if your user has the necessary permissions in Drupal
3. Ensure basic authentication is enabled in Drupal
4. For development environments, check CORS settings

```bash
# Test authentication with curl
curl -u username:password https://your-drupal-site.com/jsonapi
```

### Network Errors

#### Problem: "Network request failed"
**Symptoms:**
- Error code: `NETWORK_ERROR`
- Timeout errors
- Connection refused errors

**Solutions:**
1. Check if Drupal is accessible:
   ```bash
   curl https://your-drupal-site.com/jsonapi
   ```
2. Verify the base URL is correct (no trailing slash)
3. Check if you're behind a proxy or firewall
4. Increase timeout if dealing with large datasets:
   ```typescript
   // Currently set to 30 seconds, may need adjustment
   ```

### Validation Errors

#### Problem: "Invalid export data format"
**Symptoms:**
- Error code: `VALIDATION_ERROR`
- Import fails immediately

**Solutions:**
1. Ensure the import file is valid JSON
2. Check if the file structure matches the expected format
3. Verify all required fields are present:
   ```json
   {
     "metadata": {
       "exportedAt": "...",
       "sourceUrl": "...",
       "exportMethod": "json_api"
     },
     "taxonomyTerms": [...],
     "nodes": [...]
   }
   ```

### Import Failures

#### Problem: "Failed to import node"
**Symptoms:**
- Individual items fail to import
- Partial import success

**Common Causes:**
1. **Missing content types**: Ensure the target Drupal has the same content types
2. **Missing vocabularies**: Taxonomy vocabularies must exist before importing terms
3. **Field mismatches**: Custom fields must be configured identically
4. **Permission issues**: User must have create permissions for content types

**Debugging Steps:**
1. Run with debug logging:
   ```bash
   yrush import -d -i export.json -u https://site.com -U admin -P pass
   ```
2. Check Drupal logs for detailed error messages
3. Try importing a single item first

### Configuration Issues

#### Problem: "Invalid configuration"
**Symptoms:**
- Error code: `CONFIG_ERROR`
- Tool fails to start

**Solutions:**
1. Ensure base URL includes protocol:
   ```bash
   # Correct
   yrush export -u https://example.com
   
   # Incorrect
   yrush export -u example.com
   ```
2. Check environment variables:
   ```bash
   echo $DRUPAL_URL
   echo $DRUPAL_USER
   echo $DRUPAL_PASS
   ```

## Debug Mode

Enable debug logging to see detailed information:

```bash
# Using debug flag
yrush export -d -u https://site.com

# Using verbose flag for less detail
yrush export -v -u https://site.com
```

Debug mode shows:
- All HTTP requests
- Response details
- Data transformation steps
- Detailed error information

## Performance Issues

### Slow Exports

For large sites, exports may take time. Monitor progress with verbose logging:

```bash
yrush export -v -u https://site.com
```

Consider:
1. Exporting specific content types (future feature)
2. Using pagination limits (future feature)
3. Running during off-peak hours

### Memory Issues

For very large exports, you may encounter memory limits:

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" yrush export -u https://site.com
```

## Getting Help

1. Check the debug output first
2. Review Drupal's logs at `/admin/reports/dblog`
3. Verify JSON API is working: `https://your-site.com/jsonapi`
4. Check permissions in Drupal
5. Report issues at: https://github.com/yammerjp/yrush/issues

## Environment-Specific Issues

### Docker Environments

When using Docker:
1. Use container names or docker network IPs
2. Ensure ports are properly mapped
3. Check if the container is running

### Proxy Environments

Behind corporate proxies:
```bash
# Set proxy environment variables
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

### Local Development

Common local development issues:
1. Self-signed certificates: Currently not supported
2. Non-standard ports: Include in URL (e.g., `http://localhost:8081`)
3. Host resolution: Use IP addresses if hostname fails