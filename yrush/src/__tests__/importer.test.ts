import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DrupalImporter } from '../importer.js';
import type { DrupalConfig, ExportResult } from '../types.js';
import { setDefaultLogger, Logger, LogLevel } from '../logger.js';
import { ConfigError, NetworkError, AuthenticationError } from '../errors.js';

// Mock ky
vi.mock('ky', () => ({
  default: {
    extend: vi.fn(() => ({
      post: vi.fn(),
    })),
  },
}));

// Mock logger to avoid console output during tests
const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  setLevel: vi.fn(),
};

describe('DrupalImporter', () => {
  let importer: DrupalImporter;
  const mockConfig: DrupalConfig = {
    baseUrl: 'http://localhost:8081',
    username: 'user',
    password: 'pass',
  };

  const mockExportData: ExportResult = {
    metadata: {
      exportedAt: '2025-01-01T00:00:00Z',
      sourceUrl: 'http://source.example.com',
      exportMethod: 'json_api',
    },
    taxonomyTerms: [
      {
        tid: 1,
        vid: 'tags',
        name: 'Technology',
        description: 'Tech related content',
        weight: 0,
        parent: '0',
      },
    ],
    nodes: [
      {
        nid: 1,
        type: 'article',
        title: 'Test Article',
        status: 1,
        created: 1704067200,
        changed: 1704067200,
        body: {
          value: '<p>Test content</p>',
          format: 'full_html',
          summary: 'Test summary',
        },
        fields: {
          field_summary: [{ value: 'Summary text', format: 'plain_text' }],
          field_tags: [{ target_id: 1 }],
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set mock logger to suppress console output
    setDefaultLogger(mockLogger as unknown as Logger);
    importer = new DrupalImporter(mockConfig);
  });

  afterEach(() => {
    // Reset to default logger after tests
    setDefaultLogger(new Logger({ level: LogLevel.INFO }));
  });

  describe('constructor', () => {
    it('should create an instance with provided config', () => {
      expect(importer).toBeInstanceOf(DrupalImporter);
    });

    it('should throw ConfigError if baseUrl is not provided', () => {
      expect(() => new DrupalImporter({ ...mockConfig, baseUrl: '' })).toThrow(ConfigError);
      expect(() => new DrupalImporter({ ...mockConfig, baseUrl: '' })).toThrow(
        'Invalid configuration',
      );
    });

    it('should throw AuthenticationError if credentials are not provided', () => {
      expect(() => new DrupalImporter({ baseUrl: 'http://localhost' })).toThrow(AuthenticationError);
      expect(() => new DrupalImporter({ baseUrl: 'http://localhost' })).toThrow(
        'Username and password are required for import',
      );
    });
  });

  describe('import', () => {
    it('should import taxonomy terms and nodes successfully', async () => {
      const mockPost = vi.fn()
        .mockResolvedValueOnce({ json: () => Promise.resolve({ data: { id: 'term-1' } }) })
        .mockResolvedValueOnce({ json: () => Promise.resolve({ data: { id: 'node-1' } }) });

      const mockKyInstance = {
        post: mockPost,
      };

      const { default: ky } = await import('ky');
      (ky.extend as any).mockReturnValue(mockKyInstance);

      importer = new DrupalImporter(mockConfig);
      const result = await importer.import(mockExportData);

      expect(result).toEqual({
        success: true,
        imported: {
          taxonomyTerms: 1,
          nodes: 1,
        },
        errors: [],
      });

      // Check taxonomy term creation
      expect(mockPost).toHaveBeenCalledWith('jsonapi/taxonomy_term/tags', {
        json: {
          data: {
            type: 'taxonomy_term--tags',
            attributes: {
              name: 'Technology',
              description: { value: 'Tech related content' },
              weight: 0,
            },
          },
        },
      });

      // Check node creation
      expect(mockPost).toHaveBeenCalledWith('jsonapi/node/article', {
        json: {
          data: {
            type: 'node--article',
            attributes: {
              title: 'Test Article',
              status: true,
              body: {
                value: '<p>Test content</p>',
                format: 'full_html',
                summary: 'Test summary',
              },
              field_summary: 'Summary text',
            },
            relationships: {
              field_tags: {
                data: [{ type: 'taxonomy_term--tags', id: 'term-1' }],
              },
            },
          },
        },
      });
    });

    it('should handle import errors gracefully', async () => {
      const mockPost = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to create term'))
        .mockResolvedValueOnce({ json: () => Promise.resolve({ data: { id: 'node-1' } }) });

      const mockKyInstance = {
        post: mockPost,
      };

      const { default: ky } = await import('ky');
      (ky.extend as any).mockReturnValue(mockKyInstance);

      importer = new DrupalImporter(mockConfig);
      const result = await importer.import(mockExportData);

      expect(result).toEqual({
        success: false,
        imported: {
          taxonomyTerms: 0,
          nodes: 1,
        },
        errors: [
          {
            type: 'taxonomy_term',
            item: 'Technology',
            error: 'Failed to import taxonomy term Technology: Failed to create term',
          },
        ],
      });
    });

    it('should skip import if no data provided', async () => {
      const emptyData: ExportResult = {
        ...mockExportData,
        taxonomyTerms: [],
        nodes: [],
      };

      const result = await importer.import(emptyData);

      expect(result).toEqual({
        success: true,
        imported: {
          taxonomyTerms: 0,
          nodes: 0,
        },
        errors: [],
      });
    });

    it('should create term ID mapping for relationship resolution', async () => {
      const mockPost = vi.fn()
        .mockResolvedValueOnce({ json: () => Promise.resolve({ data: { id: 'new-term-id' } }) })
        .mockResolvedValueOnce({ json: () => Promise.resolve({ data: { id: 'node-1' } }) });

      const mockKyInstance = {
        post: mockPost,
      };

      const { default: ky } = await import('ky');
      (ky.extend as any).mockReturnValue(mockKyInstance);

      importer = new DrupalImporter(mockConfig);
      await importer.import(mockExportData);

      // The node should be created with the new term ID
      const nodeCall = mockPost.mock.calls.find(call => call[0].includes('node'));
      expect(nodeCall).toBeDefined();
      const nodeData = nodeCall?.[1]?.json?.data;
      expect(nodeData?.relationships?.field_tags?.data).toEqual([
        { type: 'taxonomy_term--tags', id: 'new-term-id' }
      ]);
    });

    it('should handle validation errors for invalid export data', async () => {
      const invalidData = {
        metadata: {
          exportedAt: '2025-01-01T00:00:00Z',
          sourceUrl: 'http://source.example.com',
          // Missing exportMethod
        },
        taxonomyTerms: [],
        nodes: [],
      };

      await expect(importer.import(invalidData as ExportResult)).rejects.toThrow('Invalid import data format');
    });

    it('should handle authentication errors', async () => {
      const authError = {
        response: { status: 401 },
        message: 'Unauthorized',
      };
      const mockPost = vi.fn()
        .mockRejectedValueOnce(authError)
        .mockRejectedValueOnce(authError);

      const mockKyInstance = {
        post: mockPost,
      };

      const { default: ky } = await import('ky');
      (ky.extend as any).mockReturnValue(mockKyInstance);

      importer = new DrupalImporter(mockConfig);
      
      const result = await importer.import(mockExportData);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2); // Both term and node fail
      expect(result.errors[0].error).toContain('Authentication failed');
      expect(result.errors[1].error).toContain('Authentication failed');
    });

    it('should log progress when logger level is INFO', async () => {
      const infoLogger = new Logger({ level: LogLevel.INFO });
      const infoSpy = vi.spyOn(infoLogger, 'info');
      setDefaultLogger(infoLogger);

      const mockPost = vi.fn()
        .mockResolvedValueOnce({ json: () => Promise.resolve({ data: { id: 'term-1' } }) })
        .mockResolvedValueOnce({ json: () => Promise.resolve({ data: { id: 'node-1' } }) });

      const mockKyInstance = {
        post: mockPost,
      };

      const { default: ky } = await import('ky');
      (ky.extend as any).mockReturnValue(mockKyInstance);

      importer = new DrupalImporter(mockConfig);
      await importer.import(mockExportData);

      expect(infoSpy).toHaveBeenCalledWith('Starting content import');
      expect(infoSpy).toHaveBeenCalledWith('Importing 1 taxonomy terms');
      expect(infoSpy).toHaveBeenCalledWith('Importing 1 nodes');
      expect(infoSpy).toHaveBeenCalledWith('Import completed', {
        success: true,
        imported: {
          taxonomyTerms: 1,
          nodes: 1,
        },
        errors: 0,
      });
    });

    it('should handle nodes with missing references gracefully', async () => {
      const dataWithMissingRef: ExportResult = {
        ...mockExportData,
        nodes: [{
          ...mockExportData.nodes[0],
          fields: {
            ...mockExportData.nodes[0].fields,
            field_tags: [{ target_id: 999 }], // Non-existent term ID
          },
        }],
      };

      const mockPost = vi.fn()
        .mockResolvedValueOnce({ json: () => Promise.resolve({ data: { id: 'term-1' } }) })
        .mockResolvedValueOnce({ json: () => Promise.resolve({ data: { id: 'node-1' } }) });

      const mockKyInstance = {
        post: mockPost,
      };

      const { default: ky } = await import('ky');
      (ky.extend as any).mockReturnValue(mockKyInstance);

      importer = new DrupalImporter(mockConfig);
      const result = await importer.import(dataWithMissingRef);

      // Should still succeed but skip the missing reference
      expect(result.success).toBe(true);
      expect(result.imported.nodes).toBe(1);
    });
  });
});