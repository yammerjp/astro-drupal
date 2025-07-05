import ky from 'ky';
import type { KyInstance } from 'ky';
import type {
  DrupalConfig,
  ExportResult,
  ImportResult,
  TaxonomyTerm,
  Node,
} from './types.js';
import { NetworkError, AuthenticationError, ConfigError, ValidationError, isHTTPError } from './errors.js';
import { getLogger } from './logger.js';
import { validateConfig, validateExportData } from './validators.js';

export class DrupalImporter {
  private client: KyInstance;
  private termIdMap: Map<number, string> = new Map();
  private logger = getLogger();

  constructor(config: DrupalConfig) {
    try {
      validateConfig(config);
    } catch (error) {
      throw new ConfigError('Invalid configuration', { error });
    }
    
    if (!config.username || !config.password) {
      throw new AuthenticationError('Username and password are required for import');
    }

    this.logger.debug('Initializing DrupalImporter', { baseUrl: config.baseUrl });
    
    const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');

    this.client = ky.extend({
      prefixUrl: config.baseUrl,
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Basic ${auth}`,
      },
      timeout: 30000,
      retry: {
        limit: 2,
        methods: ['post'],
      },
      hooks: {
        beforeRequest: [(request) => {
          this.logger.debug(`Making request: ${request.method} ${request.url}`);
        }],
        beforeError: [(error) => {
          this.logger.error(`Request failed: ${error.message}`, error);
          return error;
        }],
      },
    });
  }

  async import(data: ExportResult): Promise<ImportResult> {
    this.logger.info('Starting content import');
    
    // Validate import data
    try {
      validateExportData(data);
    } catch (error) {
      throw new ValidationError('Invalid import data format', { error });
    }
    
    const result: ImportResult = {
      success: true,
      imported: {
        taxonomyTerms: 0,
        nodes: 0,
      },
      errors: [],
    };

    // Import taxonomy terms first
    if (data.taxonomyTerms && data.taxonomyTerms.length > 0) {
      this.logger.info(`Importing ${data.taxonomyTerms.length} taxonomy terms`);
      
      for (const term of data.taxonomyTerms) {
        try {
          this.logger.debug(`Importing taxonomy term: ${term.name}`);
          await this.importTaxonomyTerm(term);
          result.imported.taxonomyTerms++;
        } catch (error) {
          result.success = false;
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to import taxonomy term ${term.name}: ${errorMessage}`, error);
          result.errors.push({
            type: 'taxonomy_term',
            item: term.name,
            error: errorMessage,
          });
        }
      }
    }

    // Import nodes
    if (data.nodes && data.nodes.length > 0) {
      this.logger.info(`Importing ${data.nodes.length} nodes`);
      
      for (const node of data.nodes) {
        try {
          this.logger.debug(`Importing node: ${node.title}`);
          await this.importNode(node);
          result.imported.nodes++;
        } catch (error) {
          result.success = false;
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to import node ${node.title}: ${errorMessage}`, error);
          result.errors.push({
            type: 'node',
            item: node.title,
            error: errorMessage,
          });
        }
      }
    }

    this.logger.info(`Import completed - Success: ${result.success}, Terms: ${result.imported.taxonomyTerms}, Nodes: ${result.imported.nodes}, Errors: ${result.errors.length}`);

    return result;
  }

  private async importTaxonomyTerm(term: TaxonomyTerm): Promise<void> {
    const payload = {
      data: {
        type: `taxonomy_term--${term.vid}`,
        attributes: {
          name: term.name,
          description: term.description ? { value: term.description } : undefined,
          weight: term.weight,
        },
      },
    };

    try {
      const response = await this.client.post(`jsonapi/taxonomy_term/${term.vid}`, {
        json: payload,
      });

      const responseData = await response.json<{ data: { id: string } }>();
      
      // Store the mapping of old ID to new ID
      this.termIdMap.set(term.tid, responseData.data.id);
      this.logger.debug(`Successfully imported taxonomy term ${term.name} with new ID ${responseData.data.id}`);
    } catch (error) {
      if (isHTTPError(error)) {
        if (error.response.status === 401) {
          throw new AuthenticationError('Authentication failed during taxonomy term import', error);
        }
        throw new NetworkError(
          `HTTP ${error.response.status} error while importing taxonomy term ${term.name}`,
          error
        );
      }
      throw new NetworkError(
        `Failed to import taxonomy term ${term.name}: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  private async importNode(node: Node): Promise<void> {
    const attributes: Record<string, unknown> = {
      title: node.title,
      status: node.status === 1,
    };

    if (node.body) {
      attributes.body = node.body;
    }

    // Handle custom fields
    if (node.fields?.field_summary) {
      const summaryField = node.fields.field_summary as Array<{ value: string }>;
      if (summaryField.length > 0) {
        attributes.field_summary = summaryField[0].value;
      }
    }

    const relationships: Record<string, unknown> = {};

    // Map taxonomy term relationships
    if (node.fields?.field_tags) {
      const tagField = node.fields.field_tags as Array<{ target_id: number }>;
      const mappedTags = tagField
        .map((tag) => {
          const newId = this.termIdMap.get(tag.target_id);
          if (!newId) {
            this.logger.warn(`Could not find mapping for taxonomy term ID ${tag.target_id}`);
            return null;
          }
          return { type: 'taxonomy_term--tags', id: newId };
        })
        .filter(Boolean);
        
      if (mappedTags.length > 0) {
        relationships.field_tags = { data: mappedTags };
      }
    }

    const payload = {
      data: {
        type: `node--${node.type}`,
        attributes,
        relationships: Object.keys(relationships).length > 0 ? relationships : undefined,
      },
    };

    try {
      const response = await this.client.post(`jsonapi/node/${node.type}`, {
        json: payload,
      });
      
      const responseData = await response.json<{ data: { id: string } }>();
      this.logger.debug(`Successfully imported node ${node.title} with new ID ${responseData.data.id}`);
    } catch (error) {
      if (isHTTPError(error)) {
        if (error.response.status === 401) {
          throw new AuthenticationError('Authentication failed during node import', error);
        }
        throw new NetworkError(
          `HTTP ${error.response.status} error while importing node ${node.title}`,
          error
        );
      }
      throw new NetworkError(
        `Failed to import node ${node.title}: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }
}