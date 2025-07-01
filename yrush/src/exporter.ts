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

export class DrupalExporter {
  private config: DrupalConfig;
  private client: KyInstance;

  constructor(config: DrupalConfig) {
    if (!config.baseUrl) {
      throw new Error('baseUrl is required');
    }
    this.config = config;
    
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
    });
  }

  async export(): Promise<ExportResult> {
    try {
      const [taxonomyTerms, articles, pages] = await Promise.all([
        this.fetchAll<JsonApiResource>('jsonapi/taxonomy_term/tags'),
        this.fetchAll<JsonApiResource>(
          'jsonapi/node/article?include=field_tags,field_featured_image',
        ),
        this.fetchAll<JsonApiResource>('jsonapi/node/page'),
      ]);

      return {
        metadata: {
          exportedAt: new Date().toISOString(),
          sourceUrl: this.config.baseUrl,
          exportMethod: 'json_api',
        },
        taxonomyTerms: taxonomyTerms.map(this.transformTaxonomyTerm),
        nodes: [...articles, ...pages].map(this.transformNode),
      };
    } catch (error) {
      throw new Error(`Failed to export content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async fetchAll<T>(endpoint: string): Promise<T[]> {
    const items: T[] = [];
    let url: string | undefined = endpoint;

    while (url) {
      const response: JsonApiResponse<T> = await this.fetchJsonApi<T>(url);
      items.push(...response.data);
      
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

    return items;
  }

  private async fetchJsonApi<T>(endpoint: string): Promise<JsonApiResponse<T>> {
    const response = await this.client.get(endpoint);
    return response.json<JsonApiResponse<T>>();
  }

  private transformTaxonomyTerm(term: JsonApiResource): TaxonomyTerm {
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

  private transformNode(node: JsonApiResource): Node {
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