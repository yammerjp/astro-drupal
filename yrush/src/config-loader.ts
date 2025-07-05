import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { cwd } from 'node:process';
import { getLogger } from './logger.js';
import { ConfigError, ValidationError } from './errors.js';
import { validateConfig, validateUrl } from './validators.js';
import type { DrupalConfig } from './types.js';

export interface YrushConfig {
  defaults?: {
    url?: string;
    username?: string;
    outputDir?: string;
    parallel?: boolean;
    concurrency?: number;
    showProgress?: boolean;
  };
  profiles?: Record<string, {
    url: string;
    username?: string;
    password?: string;
    description?: string;
  }>;
  export?: {
    pretty?: boolean;
    streaming?: boolean;
    includeMetadata?: boolean;
  };
  import?: {
    dryRun?: boolean;
    continueOnError?: boolean;
    batchSize?: number;
  };
}

export class ConfigLoader {
  private logger = getLogger();
  private configCache?: YrushConfig;
  
  private readonly configFileNames = [
    '.yrushrc.json',
    '.yrushrc',
    'yrush.config.json',
  ];

  async loadConfig(): Promise<YrushConfig> {
    if (this.configCache) {
      return this.configCache;
    }
    
    this.logger.debug('Loading configuration');
    
    // Look for config files in order of precedence
    const configPaths = await this.getConfigSearchPaths();
    
    for (const configPath of configPaths) {
      for (const fileName of this.configFileNames) {
        const fullPath = resolve(configPath, fileName);
        
        try {
          await access(fullPath);
          this.logger.debug(`Found config file at: ${fullPath}`);
          
          const content = await readFile(fullPath, 'utf-8');
          const config = JSON.parse(content) as YrushConfig;
          
          this.validateConfigFile(config);
          this.configCache = config;
          
          this.logger.info(`Loaded configuration from: ${fullPath}`);
          return config;
        } catch (error) {
          // File doesn't exist or is invalid, continue searching
          if (error instanceof SyntaxError) {
            throw new ConfigError(`Invalid JSON in config file: ${fullPath}`, { error });
          }
        }
      }
    }
    
    // No config file found, return empty config
    this.logger.debug('No configuration file found, using defaults');
    this.configCache = {};
    return {};
  }

  async loadProfile(profileName: string): Promise<DrupalConfig | null> {
    const config = await this.loadConfig();
    
    if (!config.profiles || !config.profiles[profileName]) {
      this.logger.warn(`Profile '${profileName}' not found in configuration`);
      return null;
    }
    
    const profile = config.profiles[profileName];
    
    try {
      validateUrl(profile.url);
    } catch (error) {
      throw new ConfigError(`Invalid URL in profile '${profileName}'`, { error });
    }
    
    return {
      baseUrl: profile.url,
      username: profile.username,
      password: profile.password,
    };
  }

  async mergeWithDefaults(options: Partial<DrupalConfig>): Promise<DrupalConfig> {
    const config = await this.loadConfig();
    const defaults = config.defaults || {};
    
    const merged: DrupalConfig = {
      baseUrl: options.baseUrl || defaults.url || 'http://localhost:8081',
      username: options.username || defaults.username,
      password: options.password,
    };
    
    try {
      validateConfig(merged);
    } catch (error) {
      throw new ConfigError('Invalid merged configuration', { error });
    }
    
    return merged;
  }

  async getExportOptions(): Promise<YrushConfig['export']> {
    const config = await this.loadConfig();
    return config.export || {};
  }

  async getImportOptions(): Promise<YrushConfig['import']> {
    const config = await this.loadConfig();
    return config.import || {};
  }

  private async getConfigSearchPaths(): Promise<string[]> {
    const paths: string[] = [];
    
    // Current working directory
    paths.push(cwd());
    
    // Walk up directory tree
    let currentDir = cwd();
    let parentDir = dirname(currentDir);
    
    while (parentDir !== currentDir) {
      paths.push(parentDir);
      currentDir = parentDir;
      parentDir = dirname(currentDir);
    }
    
    // User's home directory
    paths.push(homedir());
    
    // Global config directory
    if (process.platform === 'win32') {
      if (process.env.APPDATA) {
        paths.push(resolve(process.env.APPDATA, 'yrush'));
      }
    } else {
      paths.push(resolve(homedir(), '.config', 'yrush'));
    }
    
    return paths;
  }

  private validateConfigFile(config: YrushConfig): void {
    // Validate defaults
    if (config.defaults) {
      if (config.defaults.url) {
        try {
          validateUrl(config.defaults.url);
        } catch (error) {
          throw new ValidationError('Invalid URL in defaults', { error });
        }
      }
      
      if (config.defaults.concurrency !== undefined) {
        if (config.defaults.concurrency < 1 || config.defaults.concurrency > 50) {
          throw new ValidationError('Concurrency must be between 1 and 50');
        }
      }
    }
    
    // Validate profiles
    if (config.profiles) {
      for (const [name, profile] of Object.entries(config.profiles)) {
        try {
          validateUrl(profile.url);
        } catch (error) {
          throw new ValidationError(`Invalid URL in profile '${name}'`, { error });
        }
      }
    }
    
    // Validate export options
    if (config.export) {
      // Add specific validation if needed
    }
    
    // Validate import options
    if (config.import) {
      if (config.import.batchSize !== undefined) {
        if (config.import.batchSize < 1 || config.import.batchSize > 1000) {
          throw new ValidationError('Batch size must be between 1 and 1000');
        }
      }
    }
  }

  clearCache(): void {
    this.configCache = undefined;
  }
}