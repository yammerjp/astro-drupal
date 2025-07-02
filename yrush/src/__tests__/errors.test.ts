import { describe, it, expect } from 'vitest';
import {
  YrushError,
  NetworkError,
  AuthenticationError,
  ValidationError,
  ConfigError,
  isHTTPError,
  formatError,
} from '../errors.js';

describe('Error Classes', () => {
  describe('YrushError', () => {
    it('should create an error with code and details', () => {
      const error = new YrushError('Something went wrong', 'ERR_CODE', { foo: 'bar' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(YrushError);
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('ERR_CODE');
      expect(error.details).toEqual({ foo: 'bar' });
      expect(error.name).toBe('YrushError');
    });
  });

  describe('NetworkError', () => {
    it('should create a network error with NETWORK_ERROR code', () => {
      const error = new NetworkError('Connection failed', { status: 500 });
      
      expect(error).toBeInstanceOf(YrushError);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.details).toEqual({ status: 500 });
      expect(error.name).toBe('NetworkError');
    });
  });

  describe('AuthenticationError', () => {
    it('should create an authentication error with AUTH_ERROR code', () => {
      const error = new AuthenticationError('Invalid credentials');
      
      expect(error).toBeInstanceOf(YrushError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error with VALIDATION_ERROR code', () => {
      const error = new ValidationError('Invalid data', { field: 'email' });
      
      expect(error).toBeInstanceOf(YrushError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid data');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('ConfigError', () => {
    it('should create a config error with CONFIG_ERROR code', () => {
      const error = new ConfigError('Missing configuration');
      
      expect(error).toBeInstanceOf(YrushError);
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toBe('Missing configuration');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.name).toBe('ConfigError');
    });
  });
});

describe('Error Utilities', () => {
  describe('isHTTPError', () => {
    it('should return true for HTTP error objects', () => {
      const httpError = {
        response: { status: 404 },
        message: 'Not found',
      };
      
      expect(isHTTPError(httpError)).toBe(true);
    });

    it('should return false for non-HTTP errors', () => {
      expect(isHTTPError(new Error('Regular error'))).toBe(false);
      expect(isHTTPError({ message: 'No response' })).toBe(false);
      expect(isHTTPError(null)).toBe(false);
      expect(isHTTPError(undefined)).toBe(false);
      expect(isHTTPError('string error')).toBe(false);
    });

    it('should return false for objects with invalid response', () => {
      expect(isHTTPError({ response: null })).toBe(false);
      expect(isHTTPError({ response: 'not an object' })).toBe(false);
      expect(isHTTPError({ response: {} })).toBe(false); // missing status
    });
  });

  describe('formatError', () => {
    it('should format YrushError with code', () => {
      const error = new YrushError('Test error', 'TEST_CODE');
      expect(formatError(error)).toBe('TEST_CODE: Test error');
    });

    it('should format regular Error with message', () => {
      const error = new Error('Regular error');
      expect(formatError(error)).toBe('Regular error');
    });

    it('should convert non-Error values to string', () => {
      expect(formatError('string error')).toBe('string error');
      expect(formatError(123)).toBe('123');
      expect(formatError(null)).toBe('null');
      expect(formatError(undefined)).toBe('undefined');
      expect(formatError({ foo: 'bar' })).toBe('[object Object]');
    });
  });
});