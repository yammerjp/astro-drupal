import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DrupalImporter } from '../importer.js';
import type { DrupalConfig, ExportResult } from '../types.js';

// Mock ky
vi.mock('ky', () => ({
  default: {
    extend: vi.fn(() => ({
      post: vi.fn(),
    })),
  },
}));

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
    importer = new DrupalImporter(mockConfig);
  });

  describe('constructor', () => {
    it('should create an instance with provided config', () => {
      expect(importer).toBeInstanceOf(DrupalImporter);
    });

    it('should throw an error if baseUrl is not provided', () => {
      expect(() => new DrupalImporter({ ...mockConfig, baseUrl: '' })).toThrow(
        'baseUrl is required',
      );
    });

    it('should throw an error if credentials are not provided', () => {
      expect(() => new DrupalImporter({ baseUrl: 'http://localhost' })).toThrow(
        'username and password are required for import',
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
            error: 'Failed to create term',
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
  });
});