#!/usr/bin/env node

/**
 * Export Drupal content via JSON API
 * Simple, standard approach without Drupal internal dependencies
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const DRUPAL_URL = process.env.DRUPAL_URL || 'http://localhost:8081';
const OUTPUT_DIR = path.join(__dirname, '..', 'export');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Fetch data from JSON API endpoint
 */
async function fetchJsonApi(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${DRUPAL_URL}${endpoint}`;
    console.log(`Fetching: ${url}`);
    
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Fetch all items handling pagination
 */
async function fetchAll(endpoint) {
  const items = [];
  let url = endpoint;
  
  while (url) {
    try {
      const response = await fetchJsonApi(url);
      
      if (response.data) {
        items.push(...response.data);
      }
      
      // Check for next page
      url = response.links && response.links.next ? 
        response.links.next.href.replace(DRUPAL_URL, '') : null;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      break;
    }
  }
  
  return items;
}

/**
 * Main export function
 */
async function exportContent() {
  console.log('Starting content export via JSON API...');
  console.log(`Drupal URL: ${DRUPAL_URL}`);
  
  try {
    // Export taxonomy terms
    console.log('\nExporting taxonomy terms...');
    const terms = await fetchAll('/jsonapi/taxonomy_term/tags');
    console.log(`Exported ${terms.length} taxonomy terms`);
    
    // Export articles
    console.log('\nExporting articles...');
    const articles = await fetchAll('/jsonapi/node/article?include=field_tags,field_featured_image');
    console.log(`Exported ${articles.length} articles`);
    
    // Export pages
    console.log('\nExporting pages...');
    const pages = await fetchAll('/jsonapi/node/page');
    console.log(`Exported ${pages.length} pages`);
    
    // Combine all content
    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        drupal_url: DRUPAL_URL,
        export_method: 'json_api'
      },
      taxonomy_terms: terms,
      nodes: [...articles, ...pages]
    };
    
    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = path.join(OUTPUT_DIR, `content-export-${timestamp}.json`);
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    // Create latest symlink
    const latestLink = path.join(OUTPUT_DIR, 'content-export-latest.json');
    if (fs.existsSync(latestLink)) {
      fs.unlinkSync(latestLink);
    }
    fs.symlinkSync(filename, latestLink);
    
    console.log(`\nExport completed successfully!`);
    console.log(`Output file: ${filename}`);
    console.log(`Latest link: ${latestLink}`);
    
  } catch (error) {
    console.error('Export failed:', error.message);
    process.exit(1);
  }
}

// Run export
exportContent();