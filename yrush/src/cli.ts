#!/usr/bin/env node

import { program } from 'commander';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DrupalExporter } from './exporter.js';
import { DrupalImporter } from './importer.js';
import type { DrupalConfig, ExportResult } from './types.js';
import { YrushError, formatError } from './errors.js';
import { Logger, LogLevel, setDefaultLogger } from './logger.js';
import { sanitizeFilePath } from './validators.js';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf-8'),
);

program
  .name('yrush')
  .description('A modern CLI tool for Drupal content management via JSON API')
  .version(packageJson.version)
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-d, --debug', 'Enable debug logging')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    let logLevel = LogLevel.INFO;
    
    if (options.debug) {
      logLevel = LogLevel.DEBUG;
    } else if (options.verbose) {
      logLevel = LogLevel.INFO;
    } else {
      logLevel = LogLevel.WARN;
    }
    
    const logger = new Logger({ level: logLevel });
    setDefaultLogger(logger);
  });

program
  .command('export')
  .description('Export content from Drupal via JSON API')
  .option('-u, --url <url>', 'Drupal base URL', process.env.DRUPAL_URL || 'http://localhost:8081')
  .option('-U, --username <username>', 'Drupal username', process.env.DRUPAL_USER)
  .option('-P, --password <password>', 'Drupal password', process.env.DRUPAL_PASS)
  .option('-o, --output <file>', 'Output file path', './drupal-export.json')
  .action(async (options, command) => {
    const logger = new Logger({ level: LogLevel.INFO });
    
    try {
      const config: DrupalConfig = {
        baseUrl: options.url,
        username: options.username,
        password: options.password,
      };

      logger.info('🚀 Starting content export...');
      logger.info(`📍 Drupal URL: ${config.baseUrl}`);

      const exporter = new DrupalExporter(config);
      const result = await exporter.export();

      const outputPath = resolve(sanitizeFilePath(options.output));
      await writeFile(outputPath, JSON.stringify(result, null, 2));

      logger.info(`✅ Export completed successfully!`);
      logger.info(`📄 Output file: ${outputPath}`);
      logger.info(`📊 Exported:`);
      logger.info(`   - ${result.taxonomyTerms.length} taxonomy terms`);
      logger.info(`   - ${result.nodes.length} nodes`);
    } catch (error) {
      logger.error(`❌ Export failed: ${formatError(error)}`, error);
      
      if (error instanceof YrushError) {
        logger.error(`Error code: ${error.code}`);
        if (error.details) {
          logger.debug('Error details:', error.details);
        }
      }
      
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
  .action(async (options, command) => {
    const logger = new Logger({ level: LogLevel.INFO });
    
    try {
      const config: DrupalConfig = {
        baseUrl: options.url,
        username: options.username,
        password: options.password,
      };

      logger.info('🚀 Starting content import...');
      logger.info(`📍 Drupal URL: ${config.baseUrl}`);

      const inputPath = resolve(sanitizeFilePath(options.input));
      let data: ExportResult;
      
      try {
        const fileContent = await readFile(inputPath, 'utf-8');
        data = JSON.parse(fileContent);
      } catch (error) {
        throw new Error(`Failed to read import file: ${error instanceof Error ? error.message : String(error)}`);
      }

      logger.info(`📄 Import file: ${inputPath}`);
      logger.info(`📅 Exported at: ${data.metadata.exportedAt}`);

      const importer = new DrupalImporter(config);
      const result = await importer.import(data);

      if (result.success) {
        logger.info(`✅ Import completed successfully!`);
      } else {
        logger.warn(`⚠️  Import completed with errors`);
      }

      logger.info(`📊 Imported:`);
      logger.info(`   - ${result.imported.taxonomyTerms} taxonomy terms`);
      logger.info(`   - ${result.imported.nodes} nodes`);

      if (result.errors.length > 0) {
        logger.error(`\n❌ Errors:`);
        result.errors.forEach((error) => {
          logger.error(`   - ${error.type}: ${error.item} - ${error.error}`);
        });
        process.exit(1);
      }
    } catch (error) {
      logger.error(`❌ Import failed: ${formatError(error)}`, error);
      
      if (error instanceof YrushError) {
        logger.error(`Error code: ${error.code}`);
        if (error.details) {
          logger.debug('Error details:', error.details);
        }
      }
      
      process.exit(1);
    }
  });

program.parse();