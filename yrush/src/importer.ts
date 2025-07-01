import ky from 'ky';
import type { KyInstance } from 'ky';
import type {
  DrupalConfig,
  ExportResult,
  ImportResult,
  TaxonomyTerm,
  Node,
} from './types.js';

export class DrupalImporter {
  private client: KyInstance;
  private termIdMap: Map<number, string> = new Map();

  constructor(config: DrupalConfig) {
    if (!config.baseUrl) {
      throw new Error('baseUrl is required');
    }
    if (!config.username || !config.password) {
      throw new Error('username and password are required for import');
    }

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
    });
  }

  async import(data: ExportResult): Promise<ImportResult> {
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
      for (const term of data.taxonomyTerms) {
        try {
          await this.importTaxonomyTerm(term);
          result.imported.taxonomyTerms++;
        } catch (error) {
          result.success = false;
          result.errors.push({
            type: 'taxonomy_term',
            item: term.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // Import nodes
    if (data.nodes && data.nodes.length > 0) {
      for (const node of data.nodes) {
        try {
          await this.importNode(node);
          result.imported.nodes++;
        } catch (error) {
          result.success = false;
          result.errors.push({
            type: 'node',
            item: node.title,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

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

    const response = await this.client.post(`jsonapi/taxonomy_term/${term.vid}`, {
      json: payload,
    });

    const responseData = await response.json<{ data: { id: string } }>();
    
    // Store the mapping of old ID to new ID
    this.termIdMap.set(term.tid, responseData.data.id);
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
      relationships.field_tags = {
        data: tagField
          .map((tag) => {
            const newId = this.termIdMap.get(tag.target_id);
            return newId
              ? { type: 'taxonomy_term--tags', id: newId }
              : null;
          })
          .filter(Boolean),
      };
    }

    const payload = {
      data: {
        type: `node--${node.type}`,
        attributes,
        relationships: Object.keys(relationships).length > 0 ? relationships : undefined,
      },
    };

    await this.client.post(`jsonapi/node/${node.type}`, {
      json: payload,
    });
  }
}