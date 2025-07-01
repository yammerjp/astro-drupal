#!/usr/bin/env node

import { program } from 'commander';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DrupalExporter } from './exporter.js';
import { DrupalImporter } from './importer.js';
import type { DrupalConfig, ExportResult } from './types.js';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf-8'),
);

program
  .name('yrush')
  .description('A modern CLI tool for Drupal content management via JSON API')
  .version(packageJson.version);

program
  .command('export')
  .description('Export content from Drupal via JSON API')
  .option('-u, --url <url>', 'Drupal base URL', process.env.DRUPAL_URL || 'http://localhost:8081')
  .option('-U, --username <username>', 'Drupal username', process.env.DRUPAL_USER)
  .option('-P, --password <password>', 'Drupal password', process.env.DRUPAL_PASS)
  .option('-o, --output <file>', 'Output file path', './drupal-export.json')
  .action(async (options) => {
    try {
      const config: DrupalConfig = {
        baseUrl: options.url,
        username: options.username,
        password: options.password,
      };

      console.log('🚀 Starting content export...');
      console.log(`📍 Drupal URL: ${config.baseUrl}`);

      const exporter = new DrupalExporter(config);
      const result = await exporter.export();

      const outputPath = resolve(options.output);
      await writeFile(outputPath, JSON.stringify(result, null, 2));

      console.log(`✅ Export completed successfully!`);
      console.log(`📄 Output file: ${outputPath}`);
      console.log(`📊 Exported:`);
      console.log(`   - ${result.taxonomyTerms.length} taxonomy terms`);
      console.log(`   - ${result.nodes.length} nodes`);
    } catch (error) {
      console.error('❌ Export failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('import')
  .description('Import content to Drupal via JSON API')
  .option('-u, --url <url>', 'Drupal base URL', process.env.DRUPAL_URL || 'http://localhost:8081')
  .option('-U, --username <username>', 'Drupal username (required)', process.env.DRUPAL_USER)
  .option('-P, --password <password>', 'Drupal password (required)', process.env.DRUPAL_PASS)
  .option('-i, --input <file>', 'Input file path', './drupal-export.json')
  .action(async (options) => {
    try {
      const config: DrupalConfig = {
        baseUrl: options.url,
        username: options.username,
        password: options.password,
      };

      if (!config.username || !config.password) {
        throw new Error('Username and password are required for import. Use -U and -P options or set DRUPAL_USER and DRUPAL_PASS environment variables.');
      }

      console.log('🚀 Starting content import...');
      console.log(`📍 Drupal URL: ${config.baseUrl}`);

      const inputPath = resolve(options.input);
      const data: ExportResult = JSON.parse(await readFile(inputPath, 'utf-8'));

      console.log(`📄 Import file: ${inputPath}`);
      console.log(`📅 Exported at: ${data.metadata.exportedAt}`);

      const importer = new DrupalImporter(config);
      const result = await importer.import(data);

      if (result.success) {
        console.log(`✅ Import completed successfully!`);
      } else {
        console.log(`⚠️  Import completed with errors`);
      }

      console.log(`📊 Imported:`);
      console.log(`   - ${result.imported.taxonomyTerms} taxonomy terms`);
      console.log(`   - ${result.imported.nodes} nodes`);

      if (result.errors.length > 0) {
        console.log(`\n❌ Errors:`);
        result.errors.forEach((error) => {
          console.log(`   - ${error.type}: ${error.item} - ${error.error}`);
        });
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Import failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();