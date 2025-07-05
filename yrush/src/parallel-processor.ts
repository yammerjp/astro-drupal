import pLimit from 'p-limit';
import { getLogger } from './logger.js';

export interface ParallelProcessorOptions {
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
}

export class ParallelProcessor {
  private logger = getLogger();
  private limit: ReturnType<typeof pLimit>;
  private options: Required<ParallelProcessorOptions>;

  constructor(options: ParallelProcessorOptions = {}) {
    this.options = {
      concurrency: 5,
      onProgress: () => {},
      ...options,
    };
    
    this.limit = pLimit(this.options.concurrency);
    this.logger.debug(`Initialized parallel processor with concurrency: ${this.options.concurrency}`);
  }

  async processItems<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    options?: {
      continueOnError?: boolean;
      itemName?: string;
    }
  ): Promise<Array<{ success: boolean; result?: R; error?: Error; item: T }>> {
    const { continueOnError = true, itemName = 'item' } = options || {};
    
    this.logger.info(`Processing ${items.length} ${itemName}s with concurrency ${this.options.concurrency}`);
    
    let completed = 0;
    const results: Array<{ success: boolean; result?: R; error?: Error; item: T }> = [];
    
    const tasks = items.map((item, index) => 
      this.limit(async () => {
        try {
          const result = await processor(item, index);
          completed++;
          this.options.onProgress(completed, items.length);
          
          results[index] = { success: true, result, item };
          
          this.logger.debug(`Successfully processed ${itemName} ${index + 1}/${items.length}`);
          
          return { success: true, result, item };
        } catch (error) {
          completed++;
          this.options.onProgress(completed, items.length);
          
          const errorObj = error instanceof Error ? error : new Error(String(error));
          results[index] = { success: false, error: errorObj, item };
          
          this.logger.error(`Failed to process ${itemName} ${index + 1}/${items.length}: ${errorObj.message}`);
          
          if (!continueOnError) {
            throw error;
          }
          
          return { success: false, error: errorObj, item };
        }
      })
    );
    
    await Promise.all(tasks);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    this.logger.info(
      `Parallel processing completed: ${successCount} succeeded, ${failureCount} failed`
    );
    
    return results;
  }

  async processBatches<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>,
    options?: {
      continueOnError?: boolean;
      batchName?: string;
    }
  ): Promise<R[]> {
    const { continueOnError = true, batchName = 'batch' } = options || {};
    
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    this.logger.info(`Processing ${items.length} items in ${batches.length} ${batchName}es of size ${batchSize}`);
    
    const results: R[] = [];
    
    const batchResults = await this.processItems(
      batches,
      async (batch, index) => {
        this.logger.debug(`Processing ${batchName} ${index + 1}/${batches.length} with ${batch.length} items`);
        return processor(batch);
      },
      { continueOnError, itemName: batchName }
    );
    
    for (const batchResult of batchResults) {
      if (batchResult.success && batchResult.result) {
        results.push(...batchResult.result);
      }
    }
    
    return results;
  }

  updateConcurrency(concurrency: number): void {
    this.options.concurrency = concurrency;
    this.limit = pLimit(concurrency);
    this.logger.debug(`Updated concurrency to ${concurrency}`);
  }
}