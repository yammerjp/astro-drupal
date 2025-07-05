import { createWriteStream } from 'node:fs';
import type { ExportResult } from './types.js';
import { getLogger } from './logger.js';

export interface StreamWriterOptions {
  filePath: string;
  pretty?: boolean;
}

export class StreamWriter {
  private logger = getLogger();
  private options: Required<StreamWriterOptions>;

  constructor(options: StreamWriterOptions) {
    this.options = {
      pretty: false,
      ...options,
    };
  }

  async writeExportData(data: ExportResult): Promise<void> {
    this.logger.debug('Starting streaming write to file', { filePath: this.options.filePath });
    
    const writeStream = createWriteStream(this.options.filePath, { encoding: 'utf8' });
    
    try {
      // Write opening
      await this.write(writeStream, '{\n');
      
      // Write metadata
      await this.write(writeStream, '  "metadata": ');
      await this.write(writeStream, this.stringify(data.metadata));
      await this.write(writeStream, ',\n');
      
      // Write taxonomy terms
      await this.write(writeStream, '  "taxonomyTerms": ');
      await this.writeArray(writeStream, data.taxonomyTerms);
      await this.write(writeStream, ',\n');
      
      // Write nodes
      await this.write(writeStream, '  "nodes": ');
      await this.writeArray(writeStream, data.nodes);
      await this.write(writeStream, '\n');
      
      // Write closing
      await this.write(writeStream, '}\n');
      
      // Ensure all data is written
      await new Promise<void>((resolve, reject) => {
        writeStream.end((err: Error | null | undefined) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      this.logger.debug('Streaming write completed successfully');
    } catch (error) {
      this.logger.error('Streaming write failed', error);
      throw error;
    }
  }

  private async write(stream: NodeJS.WritableStream, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const canWrite = stream.write(data, (err) => {
        if (err) reject(err);
        else resolve();
      });
      
      if (!canWrite) {
        stream.once('drain', resolve);
      }
    });
  }

  private async writeArray<T>(stream: NodeJS.WritableStream, items: T[]): Promise<void> {
    await this.write(stream, '[\n');
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isLast = i === items.length - 1;
      
      await this.write(stream, '    ');
      await this.write(stream, this.stringify(item));
      
      if (!isLast) {
        await this.write(stream, ',');
      }
      await this.write(stream, '\n');
      
      // Yield control periodically to prevent blocking
      if (i % 100 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    await this.write(stream, '  ]');
  }

  private stringify(obj: unknown): string {
    return this.options.pretty 
      ? JSON.stringify(obj, null, 2)
      : JSON.stringify(obj);
  }
}

export class StreamedExporter {
  private logger = getLogger();

  async exportToStream(
    fetchData: () => Promise<ExportResult>,
    outputPath: string,
    options?: { pretty?: boolean }
  ): Promise<void> {
    this.logger.info('Starting streamed export');
    
    const data = await fetchData();
    
    const writer = new StreamWriter({
      filePath: outputPath,
      pretty: options?.pretty,
    });
    
    await writer.writeExportData(data);
    
    this.logger.info('Streamed export completed');
  }
}