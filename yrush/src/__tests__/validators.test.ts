import { describe, it, expect } from 'vitest';
import {
  validateUrl,
  validateExportData,
  validateConfig,
  sanitizeFilePath,
} from '../validators.js';
import { ValidationError } from '../errors.js';

describe('validateUrl', () => {
  it('should accept valid HTTP URLs', () => {
    expect(() => validateUrl('http://example.com')).not.toThrow();
    expect(() => validateUrl('https://example.com')).not.toThrow();
    expect(() => validateUrl('http://localhost:8080')).not.toThrow();
    expect(() => validateUrl('https://api.example.com/path')).not.toThrow();
  });

  it('should reject invalid URLs', () => {
    expect(() => validateUrl('not-a-url')).toThrow(ValidationError);
    expect(() => validateUrl('not-a-url')).toThrow('Invalid URL');
  });

  it('should reject non-HTTP protocols', () => {
    expect(() => validateUrl('ftp://example.com')).toThrow(ValidationError);
    expect(() => validateUrl('ftp://example.com')).toThrow('Invalid protocol: ftp:');
    expect(() => validateUrl('file:///path/to/file')).toThrow('Invalid protocol: file:');
    expect(() => validateUrl('ssh://example.com')).toThrow('Invalid protocol: ssh:');
  });

  it('should reject empty strings', () => {
    expect(() => validateUrl('')).toThrow(ValidationError);
    expect(() => validateUrl('')).toThrow('Invalid URL');
  });
});

describe('validateExportData', () => {
  const validData = {
    metadata: {
      exportedAt: '2025-01-01T00:00:00Z',
      sourceUrl: 'http://example.com',
      exportMethod: 'json_api',
    },
    taxonomyTerms: [],
    nodes: [],
  };

  it('should accept valid export data', () => {
    expect(() => validateExportData(validData)).not.toThrow();
  });

  it('should accept export data with items', () => {
    const dataWithItems = {
      ...validData,
      taxonomyTerms: [{ tid: 1, name: 'Test' }],
      nodes: [{ nid: 1, title: 'Test' }],
    };
    expect(() => validateExportData(dataWithItems)).not.toThrow();
  });

  it('should reject non-object data', () => {
    expect(() => validateExportData(null)).toThrow('Export data must be an object');
    expect(() => validateExportData(undefined)).toThrow('Export data must be an object');
    expect(() => validateExportData('string')).toThrow('Export data must be an object');
    expect(() => validateExportData(123)).toThrow('Export data must be an object');
  });

  it('should reject data without metadata', () => {
    const invalidData = { ...validData, metadata: undefined };
    expect(() => validateExportData(invalidData)).toThrow('Export data must have a metadata object');
  });

  it('should reject data with invalid metadata', () => {
    const invalidData = { ...validData, metadata: 'not an object' };
    expect(() => validateExportData(invalidData)).toThrow('Export data must have a metadata object');
  });

  it('should reject data with incomplete metadata', () => {
    const missingExportedAt = {
      ...validData,
      metadata: { sourceUrl: 'http://example.com', exportMethod: 'json_api' },
    };
    expect(() => validateExportData(missingExportedAt)).toThrow(
      'Metadata must contain exportedAt, sourceUrl, and exportMethod'
    );

    const missingSourceUrl = {
      ...validData,
      metadata: { exportedAt: '2025-01-01T00:00:00Z', exportMethod: 'json_api' },
    };
    expect(() => validateExportData(missingSourceUrl)).toThrow(
      'Metadata must contain exportedAt, sourceUrl, and exportMethod'
    );

    const missingExportMethod = {
      ...validData,
      metadata: { exportedAt: '2025-01-01T00:00:00Z', sourceUrl: 'http://example.com' },
    };
    expect(() => validateExportData(missingExportMethod)).toThrow(
      'Metadata must contain exportedAt, sourceUrl, and exportMethod'
    );
  });

  it('should reject data without taxonomyTerms array', () => {
    const invalidData = { ...validData, taxonomyTerms: undefined };
    expect(() => validateExportData(invalidData)).toThrow('Export data must have a taxonomyTerms array');
  });

  it('should reject data with non-array taxonomyTerms', () => {
    const invalidData = { ...validData, taxonomyTerms: 'not an array' };
    expect(() => validateExportData(invalidData)).toThrow('Export data must have a taxonomyTerms array');
  });

  it('should reject data without nodes array', () => {
    const invalidData = { ...validData, nodes: undefined };
    expect(() => validateExportData(invalidData)).toThrow('Export data must have a nodes array');
  });

  it('should reject data with non-array nodes', () => {
    const invalidData = { ...validData, nodes: {} };
    expect(() => validateExportData(invalidData)).toThrow('Export data must have a nodes array');
  });
});

describe('validateConfig', () => {
  it('should accept valid config', () => {
    const config = {
      baseUrl: 'http://localhost:8080',
      username: 'admin',
      password: 'password',
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  it('should accept config without credentials', () => {
    const config = {
      baseUrl: 'http://localhost:8080',
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  it('should reject non-object config', () => {
    expect(() => validateConfig(null)).toThrow('Config must be an object');
    expect(() => validateConfig(undefined)).toThrow('Config must be an object');
    expect(() => validateConfig('string')).toThrow('Config must be an object');
  });

  it('should reject config without baseUrl', () => {
    const config = { username: 'admin', password: 'password' };
    expect(() => validateConfig(config)).toThrow('Config must have a valid baseUrl string');
  });

  it('should reject config with invalid baseUrl', () => {
    const config = { baseUrl: 123 };
    expect(() => validateConfig(config)).toThrow('Config must have a valid baseUrl string');
  });

  it('should reject config with invalid URL in baseUrl', () => {
    const config = { baseUrl: 'not-a-url' };
    expect(() => validateConfig(config)).toThrow(ValidationError);
    expect(() => validateConfig(config)).toThrow('Invalid URL');
  });

  it('should reject config with non-string username', () => {
    const config = { baseUrl: 'http://localhost', username: 123 };
    expect(() => validateConfig(config)).toThrow('Username must be a string');
  });

  it('should reject config with non-string password', () => {
    const config = { baseUrl: 'http://localhost', password: true };
    expect(() => validateConfig(config)).toThrow('Password must be a string');
  });
});

describe('sanitizeFilePath', () => {
  it('should remove dangerous characters from file paths', () => {
    expect(sanitizeFilePath('normal-file.json')).toBe('normal-file.json');
    expect(sanitizeFilePath('path/to/file.json')).toBe('path/to/file.json');
    expect(sanitizeFilePath('file<>name.json')).toBe('filename.json');
    expect(sanitizeFilePath('file:name.json')).toBe('filename.json');
    expect(sanitizeFilePath('file"name.json')).toBe('filename.json');
    expect(sanitizeFilePath('file|name.json')).toBe('filename.json');
    expect(sanitizeFilePath('file?name.json')).toBe('filename.json');
    expect(sanitizeFilePath('file*name.json')).toBe('filename.json');
  });

  it('should handle multiple dangerous characters', () => {
    expect(sanitizeFilePath('file<>:|?*"name.json')).toBe('filename.json');
  });

  it('should preserve valid path separators', () => {
    expect(sanitizeFilePath('path/to/file.json')).toBe('path/to/file.json');
    expect(sanitizeFilePath('../relative/path.json')).toBe('../relative/path.json');
  });
});