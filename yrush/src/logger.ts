export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LoggerOptions {
  level: LogLevel;
  timestamps?: boolean;
  colors?: boolean;
}

export class Logger {
  public level: LogLevel;
  private timestamps: boolean;
  private colors: boolean;

  constructor(options: LoggerOptions) {
    this.level = options.level;
    this.timestamps = options.timestamps ?? true;
    this.colors = options.colors ?? true;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = this.timestamps ? `[${new Date().toISOString()}] ` : '';
    return `${timestamp}${level}: ${message}`;
  }

  private colorize(text: string, color: string): string {
    if (!this.colors) return text;
    
    const colors: Record<string, string> = {
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      gray: '\x1b[90m',
      reset: '\x1b[0m',
    };
    
    return `${colors[color]}${text}${colors.reset}`;
  }

  error(message: string, error?: unknown): void {
    if (this.level >= LogLevel.ERROR) {
      const formatted = this.formatMessage('ERROR', message);
      console.error(this.colorize(formatted, 'red'));
      if (error && this.level >= LogLevel.DEBUG) {
        console.error(error);
      }
    }
  }

  warn(message: string): void {
    if (this.level >= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', message);
      console.warn(this.colorize(formatted, 'yellow'));
    }
  }

  info(message: string): void {
    if (this.level >= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', message);
      console.log(this.colorize(formatted, 'blue'));
    }
  }

  debug(message: string, data?: unknown): void {
    if (this.level >= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message);
      console.log(this.colorize(formatted, 'gray'));
      if (data !== undefined) {
        console.log(data);
      }
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

let defaultLogger: Logger | null = null;

export function getLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger({ level: LogLevel.INFO });
  }
  return defaultLogger;
}

export function setDefaultLogger(logger: Logger): void {
  defaultLogger = logger;
}