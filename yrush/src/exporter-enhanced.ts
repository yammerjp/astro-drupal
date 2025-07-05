import { DrupalExporter } from './exporter.js';
import { StreamWriter } from './stream-writer.js';
import { ParallelProcessor } from './parallel-processor.js';
import { ProgressBar } from './progress.js';
import type { DrupalConfig, ExportResult, JsonApiResource } from './types.js';
import { getLogger } from './logger.js';
import { NetworkError } from './errors.js';

export interface EnhancedExportOptions {
  parallel?: boolean;
  concurrency?: number;
  showProgress?: boolean;
  streamOutput?: boolean;
  batchSize?: number;
}

export class EnhancedDrupalExporter extends DrupalExporter {
  private enhancedLogger = getLogger();
  private parallelProcessor?: ParallelProcessor;

  constructor(config: DrupalConfig, private options: EnhancedExportOptions = {}) {
    super(config);
    
    if (options.parallel) {
      this.parallelProcessor = new ParallelProcessor({
        concurrency: options.concurrency || 5,
      });
    }
  }

  async exportToFile(outputPath: string): Promise<void> {
    this.enhancedLogger.info('Starting enhanced export with streaming');
    
    if (this.options.streamOutput) {
      const writer = new StreamWriter({
        filePath: outputPath,
        pretty: true,
      });
      
      const data = await this.export();
      await writer.writeExportData(data);
    } else {
      // Use parent's export method for regular export
      const data = await this.export();
      const { writeFile } = await import('node:fs/promises');
      await writeFile(outputPath, JSON.stringify(data, null, 2));
    }
    
    this.enhancedLogger.info('Export completed successfully');
  }

  async export(): Promise<ExportResult> {
    if (!this.options.parallel) {
      return super.export();
    }
    
    this.enhancedLogger.info('Starting parallel export');
    
    try {
      // Define the endpoints to fetch
      const endpoints = [
        { url: 'jsonapi/taxonomy_term/tags', type: 'taxonomy' },
        { url: 'jsonapi/node/article?include=field_tags,field_featured_image', type: 'article' },
        { url: 'jsonapi/node/page', type: 'page' },
      ];
      
      let progressBar: ProgressBar | undefined;
      
      if (this.options.showProgress) {
        progressBar = new ProgressBar({
          total: endpoints.length,
          format: 'Fetching: :bar :percent :current/:total',
        });
      }
      
      // Fetch all endpoints in parallel
      const results = await this.parallelProcessor!.processItems(
        endpoints,
        async (endpoint) => {
          const items = await this.fetchAllWithProgress(endpoint.url, endpoint.type);
          
          if (progressBar) {
            progressBar.tick();
          }
          
          return { type: endpoint.type, items };
        },
        { itemName: 'endpoint' }
      );
      
      // Process results
      let taxonomyTerms: JsonApiResource[] = [];
      let articles: JsonApiResource[] = [];
      let pages: JsonApiResource[] = [];
      
      for (const result of results) {
        if (result.success && result.result) {
          switch (result.result.type) {
            case 'taxonomy':
              taxonomyTerms = result.result.items;
              break;
            case 'article':
              articles = result.result.items;
              break;
            case 'page':
              pages = result.result.items;
              break;
          }
        }
      }
      
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
      this.enhancedLogger.error('Parallel export failed', error);
      throw new NetworkError(
        `Failed to export content: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  private async fetchAllWithProgress(endpoint: string, type: string): Promise<JsonApiResource[]> {
    const items: JsonApiResource[] = [];
    let url: string | undefined = endpoint;
    let pageCount = 0;
    
    // First, get total count if possible
    const firstResponse = await this.fetchJsonApiEnhanced(url);
    const totalItems = firstResponse.meta?.count || 0;
    
    let progressBar: ProgressBar | undefined;
    
    if (this.options.showProgress && totalItems > 0) {
      progressBar = new ProgressBar({
        total: totalItems,
        format: `${type}: :bar :percent :current/:total`,
      });
    }
    
    // Process first page
    items.push(...firstResponse.data);
    if (progressBar) {
      progressBar.update(items.length);
    }
    
    // Handle pagination
    while (firstResponse.links?.next?.href) {
      pageCount++;
      const nextUrl = firstResponse.links.next.href;
      url = nextUrl.startsWith('http') 
        ? new URL(nextUrl).pathname + new URL(nextUrl).search
        : nextUrl;
      
      if (url && url.startsWith('/')) {
        url = url.substring(1);
      }
      
      if (url) {
        const response = await this.fetchJsonApiEnhanced(url);
        items.push(...response.data);
        
        if (progressBar) {
          progressBar.update(items.length);
        }
        
        if (!response.links?.next?.href) {
          break;
        }
      } else {
        break;
      }
    }
    
    if (progressBar) {
      progressBar.complete();
    }
    
    return items;
  }

  private async fetchJsonApiEnhanced(_endpoint: string): Promise<any> {
    // This would use the parent's client to fetch data
    // For now, returning mock data structure
    return {
      data: [],
      links: {},
      meta: {},
    };
  }

}