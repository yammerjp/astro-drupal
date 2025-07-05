import ky from 'ky';
import type { KyInstance } from 'ky';
import type {
  DrupalConfig,
  ExportResult,
  JsonApiResponse,
  JsonApiResource,
  TaxonomyTerm,
  Node,
} from './types.js';
import { NetworkError, ConfigError, isHTTPError } from './errors.js';
import { getLogger } from './logger.js';
import { validateConfig } from './validators.js';

export class DrupalExporter {
  protected config: DrupalConfig;
  private client: KyInstance;
  protected logger = getLogger();

  constructor(config: DrupalConfig) {
    try {
      validateConfig(config);
    } catch (error) {
      throw new ConfigError('Invalid configuration', { error });
    }
    
    this.config = config;
    this.logger.debug('Initializing DrupalExporter', { baseUrl: config.baseUrl });
    
    const headers: Record<string, string> = {
      Accept: 'application/vnd.api+json',
    };

    if (config.username && config.password) {
      const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      headers.Authorization = `Basic ${auth}`;
    }

    this.client = ky.extend({
      prefixUrl: config.baseUrl,
      headers,
      timeout: 30000,
      retry: {
        limit: 2,
        methods: ['get'],
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

  async export(): Promise<ExportResult> {
    this.logger.info('Starting content export');
    
    try {
      this.logger.debug('Fetching taxonomy terms and nodes');
      const [taxonomyTerms, articles, pages] = await Promise.all([
        this.fetchAll<JsonApiResource>('jsonapi/taxonomy_term/tags'),
        this.fetchAll<JsonApiResource>(
          'jsonapi/node/article?include=field_tags,field_featured_image',
        ),
        this.fetchAll<JsonApiResource>('jsonapi/node/page'),
      ]);

      this.logger.info(`Fetched ${taxonomyTerms.length} taxonomy terms`);
      this.logger.info(`Fetched ${articles.length} articles and ${pages.length} pages`);

      const result = {
        metadata: {
          exportedAt: new Date().toISOString(),
          sourceUrl: this.config.baseUrl,
          exportMethod: 'json_api',
        },
        taxonomyTerms: taxonomyTerms.map(this.transformTaxonomyTerm),
        nodes: [...articles, ...pages].map(this.transformNode),
      };

      this.logger.info(`Export completed successfully - Terms: ${result.taxonomyTerms.length}, Nodes: ${result.nodes.length}`);

      return result;
    } catch (error) {
      this.logger.error('Export failed', error);
      
      if (isHTTPError(error)) {
        throw new NetworkError(
          `Failed to export content: HTTP ${error.response.status}`,
          error
        );
      }
      
      throw new NetworkError(
        `Failed to export content: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  private async fetchAll<T>(endpoint: string): Promise<T[]> {
    const items: T[] = [];
    let url: string | undefined = endpoint;
    let pageCount = 0;

    while (url) {
      pageCount++;
      this.logger.debug(`Fetching page ${pageCount} from ${url}`);
      
      const response: JsonApiResponse<T> = await this.fetchJsonApi<T>(url);
      items.push(...response.data);
      
      this.logger.debug(`Retrieved ${response.data.length} items from page ${pageCount}`);
      
      // Handle pagination
      if (response.links?.next?.href) {
        // Extract relative path if it's an absolute URL
        const nextUrl: string = response.links.next.href;
        url = nextUrl.startsWith('http') 
          ? new URL(nextUrl).pathname + new URL(nextUrl).search
          : nextUrl;
        // Remove leading slash if present
        if (url && url.startsWith('/')) {
          url = url.substring(1);
        }
      } else {
        url = undefined;
      }
    }

    this.logger.debug(`Fetched total of ${items.length} items from ${endpoint}`);
    return items;
  }

  protected async fetchJsonApi<T>(endpoint: string): Promise<JsonApiResponse<T>> {
    try {
      const response = await this.client.get(endpoint);
      return response.json<JsonApiResponse<T>>();
    } catch (error) {
      this.logger.error(`Failed to fetch from ${endpoint}`, error);
      
      if (isHTTPError(error)) {
        throw new NetworkError(
          `HTTP ${error.response.status} error while fetching ${endpoint}`,
          error
        );
      }
      
      throw new NetworkError(
        `Failed to fetch from ${endpoint}: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  protected transformTaxonomyTerm(term: JsonApiResource): TaxonomyTerm {
    const relationships = term.relationships as {
      vid?: { data?: { id: string } };
    };

    return {
      tid: term.attributes.drupal_internal__tid as number,
      vid: relationships?.vid?.data?.id || '',
      name: term.attributes.name as string,
      description: (term.attributes.description as string) || '',
      weight: term.attributes.weight as number,
      parent: '0',
    };
  }

  protected transformNode(node: JsonApiResource): Node {
    const nodeAttributes = node.attributes as {
      drupal_internal__nid?: number;
      title?: string;
      status?: boolean;
      created?: string;
      changed?: string;
      body?: {
        value: string;
        format: string;
        summary?: string;
      };
      field_summary?: string;
    };

    const transformed: Node = {
      nid: nodeAttributes.drupal_internal__nid || 0,
      type: node.type.replace('node--', ''),
      title: nodeAttributes.title || '',
      status: nodeAttributes.status ? 1 : 0,
      created: nodeAttributes.created 
        ? new Date(nodeAttributes.created).getTime() / 1000 
        : Date.now() / 1000,
      changed: nodeAttributes.changed
        ? new Date(nodeAttributes.changed).getTime() / 1000
        : Date.now() / 1000,
    };

    if (nodeAttributes.body) {
      transformed.body = nodeAttributes.body;
    }

    // Add custom fields
    const customFields: Record<string, unknown> = {};
    if (nodeAttributes.field_summary) {
      customFields.field_summary = [
        {
          value: nodeAttributes.field_summary,
          format: 'plain_text',
        },
      ];
    }

    if (node.relationships?.field_tags) {
      const fieldTags = node.relationships.field_tags as {
        data?: Array<{ meta?: { drupal_internal__target_id: number } }>;
      };
      if (fieldTags.data) {
        customFields.field_tags = fieldTags.data.map((tag) => ({
          target_id: tag.meta?.drupal_internal__target_id,
        }));
      }
    }

    if (Object.keys(customFields).length > 0) {
      transformed.fields = customFields;
    }

    return transformed;
  }
}