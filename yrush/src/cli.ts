#!/usr/bin/env node

import { program } from 'commander';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DrupalExporter } from './exporter.js';
import { DrupalImporter } from './importer.js';
import { DryRunImporter } from './dry-run-importer.js';
import { ConfigLoader } from './config-loader.js';
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
  .option('-u, --url <url>', 'Drupal base URL', process.env.DRUPAL_URL)
  .option('-U, --username <username>', 'Drupal username', process.env.DRUPAL_USER)
  .option('-P, --password <password>', 'Drupal password', process.env.DRUPAL_PASS)
  .option('-o, --output <file>', 'Output file path', './drupal-export.json')
  .option('--profile <name>', 'Use a named profile from config file')
  .option('--parallel', 'Enable parallel fetching')
  .option('--concurrency <number>', 'Number of parallel requests', '5')
  .action(async (options) => {
    const logger = new Logger({ level: LogLevel.INFO });
    
    try {
      const configLoader = new ConfigLoader();
      let config: DrupalConfig;
      
      if (options.profile) {
        // Load from profile
        const profileConfig = await configLoader.loadProfile(options.profile);
        if (!profileConfig) {
          throw new Error(`Profile '${options.profile}' not found`);
        }
        config = profileConfig;
      } else {
        // Merge with defaults from config file
        config = await configLoader.mergeWithDefaults({
          baseUrl: options.url,
          username: options.username,
          password: options.password,
        });
      }

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
  .option('-u, --url <url>', 'Drupal base URL', process.env.DRUPAL_URL)
  .option('-U, --username <username>', 'Drupal username (required)', process.env.DRUPAL_USER)
  .option('-P, --password <password>', 'Drupal password (required)', process.env.DRUPAL_PASS)
  .option('-i, --input <file>', 'Input file path', './drupal-export.json')
  .option('--profile <name>', 'Use a named profile from config file')
  .option('--dry-run', 'Perform a dry run without making changes')
  .action(async (options) => {
    const logger = new Logger({ level: LogLevel.INFO });
    
    try {
      const configLoader = new ConfigLoader();
      let config: DrupalConfig;
      
      if (options.profile) {
        // Load from profile
        const profileConfig = await configLoader.loadProfile(options.profile);
        if (!profileConfig) {
          throw new Error(`Profile '${options.profile}' not found`);
        }
        config = profileConfig;
      } else {
        // Merge with defaults from config file
        config = await configLoader.mergeWithDefaults({
          baseUrl: options.url,
          username: options.username,
          password: options.password,
        });
      }

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

      if (options.dryRun) {
        logger.info('🔍 Running in dry-run mode...');
        const dryRunImporter = new DryRunImporter(config);
        const report = await dryRunImporter.dryRun(data);
        
        console.log('\n' + dryRunImporter.formatReport(report));
        
        if (!report.validation.passed) {
          process.exit(1);
        }
        return;
      }

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

program
  .command('config')
  .description('Manage yrush configuration')
  .option('--init', 'Initialize a new config file')
  .option('--list', 'List all profiles')
  .option('--show', 'Show current configuration')
  .action(async (options) => {
    const logger = new Logger({ level: LogLevel.INFO });
    
    try {
      if (options.init) {
        const { writeFile } = await import('node:fs/promises');
        const configPath = resolve('.yrushrc.json');
        
        const defaultConfig = {
          defaults: {
            url: 'http://localhost:8081',
            showProgress: true,
          },
          profiles: {
            local: {
              url: 'http://localhost:8081',
              description: 'Local development environment',
            },
          },
          export: {
            pretty: true,
          },
          import: {
            continueOnError: true,
          },
        };
        
        await writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
        logger.info(`✅ Created config file: ${configPath}`);
        return;
      }
      
      const configLoader = new ConfigLoader();
      const config = await configLoader.loadConfig();
      
      if (options.list && config.profiles) {
        logger.info('📋 Available profiles:');
        for (const [name, profile] of Object.entries(config.profiles)) {
          logger.info(`   - ${name}: ${profile.url}`);
          if (profile.description) {
            logger.info(`     ${profile.description}`);
          }
        }
      } else if (options.show) {
        console.log(JSON.stringify(config, null, 2));
      } else {
        logger.info('Use --init to create a config file, --list to show profiles, or --show to display config');
      }
    } catch (error) {
      logger.error(`❌ Config command failed: ${formatError(error)}`, error);
      process.exit(1);
    }
  });

program.parse();