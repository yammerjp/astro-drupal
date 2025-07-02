import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel, getLogger, setDefaultLogger } from '../logger.js';

describe('Logger', () => {
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Log levels', () => {
    it('should only log errors when level is ERROR', () => {
      const logger = new Logger({ level: LogLevel.ERROR });
      
      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log errors and warnings when level is WARN', () => {
      const logger = new Logger({ level: LogLevel.WARN });
      
      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log errors, warnings, and info when level is INFO', () => {
      const logger = new Logger({ level: LogLevel.INFO });
      
      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should log all messages when level is DEBUG', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      
      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // info + debug
    });
  });

  describe('Formatting', () => {
    it('should include timestamps when enabled', () => {
      const logger = new Logger({ level: LogLevel.INFO, timestamps: true });
      
      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      expect(call).toContain('INFO: test message');
    });

    it('should not include timestamps when disabled', () => {
      const logger = new Logger({ level: LogLevel.INFO, timestamps: false });
      
      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).not.toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      expect(call).toContain('INFO: test message');
    });

    it('should include colors when enabled', () => {
      const logger = new Logger({ level: LogLevel.INFO, colors: true });
      
      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('\x1b[34m'); // blue color code
      expect(call).toContain('\x1b[0m'); // reset color code
    });

    it('should not include colors when disabled', () => {
      const logger = new Logger({ level: LogLevel.INFO, colors: false });
      
      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).not.toContain('\x1b[');
    });
  });

  describe('Error handling', () => {
    it('should log error objects when level is DEBUG', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      const error = new Error('test error');
      
      logger.error('error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should not log error objects when level is not DEBUG', () => {
      const logger = new Logger({ level: LogLevel.INFO });
      const error = new Error('test error');
      
      logger.error('error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(error);
    });
  });

  describe('Debug data', () => {
    it('should log debug data when provided', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      const data = { foo: 'bar', count: 42 };
      
      logger.debug('debug message', data);

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith(data);
    });
  });

  describe('Dynamic level', () => {
    it('should allow changing log level at runtime', () => {
      const logger = new Logger({ level: LogLevel.ERROR });
      
      logger.info('should not log');
      expect(consoleLogSpy).not.toHaveBeenCalled();
      
      logger.setLevel(LogLevel.INFO);
      
      logger.info('should log');
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Global logger', () => {
    it('should return the same logger instance', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();
      
      expect(logger1).toBe(logger2);
    });

    it('should allow setting a custom default logger', () => {
      const customLogger = new Logger({ level: LogLevel.DEBUG });
      setDefaultLogger(customLogger);
      
      const logger = getLogger();
      expect(logger).toBe(customLogger);
    });
  });
});