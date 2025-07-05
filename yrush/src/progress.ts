import { stdout } from 'node:process';
import { getLogger } from './logger.js';

export interface ProgressOptions {
  total: number;
  width?: number;
  format?: string;
  stream?: NodeJS.WriteStream;
  renderThrottle?: number;
}

export class ProgressBar {
  private current = 0;
  private total: number;
  private width: number;
  private format: string;
  private stream: NodeJS.WriteStream;
  private lastRender = 0;
  private renderThrottle: number;
  private startTime = Date.now();
  private logger = getLogger();
  private isEnabled = true;

  constructor(options: ProgressOptions) {
    this.total = options.total;
    this.width = options.width || 40;
    this.format = options.format || ':bar :percent :current/:total :elapsed/:eta';
    this.stream = options.stream || stdout;
    this.renderThrottle = options.renderThrottle || 16; // ~60fps
    
    // Disable progress bar if not TTY or in debug mode
    if (!this.stream.isTTY || this.logger.level === 3) {
      this.isEnabled = false;
    }
  }

  tick(delta = 1): void {
    this.current += delta;
    
    if (this.current > this.total) {
      this.current = this.total;
    }
    
    this.render();
  }

  update(current: number): void {
    this.current = current;
    
    if (this.current > this.total) {
      this.current = this.total;
    }
    
    this.render();
  }

  private render(): void {
    if (!this.isEnabled) return;
    
    const now = Date.now();
    const timeSinceLastRender = now - this.lastRender;
    
    // Throttle rendering
    if (timeSinceLastRender < this.renderThrottle && this.current < this.total) {
      return;
    }
    
    this.lastRender = now;
    
    const percent = this.current / this.total;
    const filledLength = Math.round(this.width * percent);
    const emptyLength = this.width - filledLength;
    
    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(emptyLength);
    const bar = filled + empty;
    
    const elapsed = Math.floor((now - this.startTime) / 1000);
    const rate = this.current / elapsed;
    const eta = rate > 0 ? Math.floor((this.total - this.current) / rate) : 0;
    
    let output = this.format
      .replace(':bar', bar)
      .replace(':percent', `${Math.floor(percent * 100)}%`)
      .replace(':current', this.current.toString())
      .replace(':total', this.total.toString())
      .replace(':elapsed', this.formatTime(elapsed))
      .replace(':eta', this.formatTime(eta))
      .replace(':rate', rate.toFixed(1));
    
    // Clear the line and write the progress
    this.stream.write(`\r${output}`);
    
    // If complete, move to next line
    if (this.current >= this.total) {
      this.stream.write('\n');
    }
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}m${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h${remainingMinutes}m`;
  }

  complete(): void {
    this.current = this.total;
    this.render();
  }

  terminate(): void {
    if (this.isEnabled && this.current < this.total) {
      this.stream.write('\n');
    }
  }
}

export class MultiProgress {
  private bars: Map<string, ProgressBar> = new Map();

  createBar(id: string, options: ProgressOptions): ProgressBar {
    const bar = new ProgressBar(options);
    this.bars.set(id, bar);
    return bar;
  }

  getBar(id: string): ProgressBar | undefined {
    return this.bars.get(id);
  }

  removeBar(id: string): void {
    const bar = this.bars.get(id);
    if (bar) {
      bar.terminate();
      this.bars.delete(id);
    }
  }

  terminateAll(): void {
    for (const bar of this.bars.values()) {
      bar.terminate();
    }
    this.bars.clear();
  }
}