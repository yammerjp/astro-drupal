#!/usr/bin/env node

/**
 * Import content to Drupal via JSON API
 * Simple approach using standard Drupal APIs
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const DRUPAL_URL = process.env.DRUPAL_URL || 'http://localhost:8081';
const DRUPAL_USER = process.env.DRUPAL_USER || 'user';
const DRUPAL_PASS = process.env.DRUPAL_PASS || 'bitnami';

// Get JSON file from command line or use latest
const jsonFile = process.argv[2] || path.join(__dirname, '..', 'export', 'content-export-latest.json');

if (!fs.existsSync(jsonFile)) {
  console.error(`Error: File not found: ${jsonFile}`);
  console.error('Usage: ./import-content.js [json-file]');
  process.exit(1);
}

/**
 * Make authenticated request to JSON API
 */
async function jsonApiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${DRUPAL_URL}${endpoint}`);
    const client = url.protocol === 'https:' ? https : http;
    
    const auth = Buffer.from(`${DRUPAL_USER}:${DRUPAL_PASS}`).toString('base64');
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    };
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(responseData ? JSON.parse(responseData) : null);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Import taxonomy terms
 */
async function importTaxonomyTerms(terms) {
  console.log(`\nImporting ${terms.length} taxonomy terms...`);
  
  for (const term of terms) {
    try {
      const payload = {
        data: {
          type: `taxonomy_term--${term.relationships.vid.data.id}`,
          attributes: {
            name: term.attributes.name,
            description: term.attributes.description,
            weight: term.attributes.weight
          }
        }
      };
      
      await jsonApiRequest('POST', `/jsonapi/taxonomy_term/${term.relationships.vid.data.id}`, payload);
      console.log(`✓ Imported term: ${term.attributes.name}`);
    } catch (error) {
      console.error(`✗ Failed to import term ${term.attributes.name}: ${error.message}`);
    }
  }
}

/**
 * Import nodes
 */
async function importNodes(nodes) {
  console.log(`\nImporting ${nodes.length} nodes...`);
  
  for (const node of nodes) {
    try {
      const nodeType = node.type.replace('node--', '');
      const payload = {
        data: {
          type: node.type,
          attributes: {
            title: node.attributes.title,
            status: node.attributes.status,
            body: node.attributes.body
          },
          relationships: {}
        }
      };
      
      // Add custom fields if present
      if (node.attributes.field_summary) {
        payload.data.attributes.field_summary = node.attributes.field_summary;
      }
      
      // Add relationships if present
      if (node.relationships && node.relationships.field_tags) {
        payload.data.relationships.field_tags = node.relationships.field_tags;
      }
      
      await jsonApiRequest('POST', `/jsonapi/node/${nodeType}`, payload);
      console.log(`✓ Imported ${nodeType}: ${node.attributes.title}`);
    } catch (error) {
      console.error(`✗ Failed to import node ${node.attributes.title}: ${error.message}`);
    }
  }
}

/**
 * Main import function
 */
async function importContent() {
  console.log('Starting content import via JSON API...');
  console.log(`Import file: ${jsonFile}`);
  console.log(`Drupal URL: ${DRUPAL_URL}`);
  
  try {
    // Read export file
    const exportData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    
    console.log(`\nExport metadata:`);
    console.log(`- Exported at: ${exportData.metadata.exported_at}`);
    console.log(`- Source: ${exportData.metadata.drupal_url}`);
    
    // Import taxonomy terms first
    if (exportData.taxonomy_terms && exportData.taxonomy_terms.length > 0) {
      await importTaxonomyTerms(exportData.taxonomy_terms);
    }
    
    // Import nodes
    if (exportData.nodes && exportData.nodes.length > 0) {
      await importNodes(exportData.nodes);
    }
    
    console.log('\nImport completed!');
    
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
}

// Note about authentication
console.log('Note: This script requires authentication to create content.');
console.log('Set DRUPAL_USER and DRUPAL_PASS environment variables if needed.\n');

// Run import
importContent();