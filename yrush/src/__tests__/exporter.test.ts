import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DrupalExporter } from '../exporter.js';
import type { DrupalConfig } from '../types.js';

// Mock ky
vi.mock('ky', () => ({
  default: {
    extend: vi.fn(() => ({
      get: vi.fn(),
    })),
  },
}));

describe('DrupalExporter', () => {
  let exporter: DrupalExporter;
  const mockConfig: DrupalConfig = {
    baseUrl: 'http://localhost:8081',
    username: 'user',
    password: 'pass',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    exporter = new DrupalExporter(mockConfig);
  });

  describe('constructor', () => {
    it('should create an instance with provided config', () => {
      expect(exporter).toBeInstanceOf(DrupalExporter);
    });

    it('should throw an error if baseUrl is not provided', () => {
      expect(() => new DrupalExporter({ ...mockConfig, baseUrl: '' })).toThrow(
        'baseUrl is required',
      );
    });
  });

  describe('export', () => {
    it('should export content and return ExportResult', async () => {
      const mockTaxonomyResponse = {
        data: [
          {
            type: 'taxonomy_term--tags',
            id: '1',
            attributes: {
              drupal_internal__tid: 1,
              name: 'Technology',
              description: null,
              weight: 0,
            },
            relationships: {
              vid: {
                data: { id: 'tags', type: 'taxonomy_vocabulary--taxonomy_vocabulary' },
              },
            },
          },
        ],
        links: { self: { href: 'http://localhost:8081/jsonapi/taxonomy_term/tags' } },
      };

      const mockNodeResponse = {
        data: [
          {
            type: 'node--article',
            id: '1',
            attributes: {
              drupal_internal__nid: 1,
              title: 'Test Article',
              status: true,
              created: '2025-01-01T00:00:00+00:00',
              changed: '2025-01-01T00:00:00+00:00',
              body: {
                value: '<p>Test content</p>',
                format: 'full_html',
                summary: 'Test summary',
              },
            },
          },
        ],
        links: { self: { href: 'http://localhost:8081/jsonapi/node/article' } },
      };

      // Mock the ky client
      const mockGet = vi.fn()
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockTaxonomyResponse) })
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockNodeResponse) })
        .mockResolvedValueOnce({ json: () => Promise.resolve({ data: [] }) });

      const mockKyInstance = {
        get: mockGet,
      };

      // Import ky after mocks are set up
      const { default: ky } = await import('ky');
      (ky.extend as any).mockReturnValue(mockKyInstance);

      // Create new instance to use mocked ky
      exporter = new DrupalExporter(mockConfig);

      const result = await exporter.export();

      expect(result).toMatchObject({
        metadata: {
          exportedAt: expect.any(String),
          sourceUrl: 'http://localhost:8081',
          exportMethod: 'json_api',
        },
        taxonomyTerms: expect.arrayContaining([
          expect.objectContaining({
            tid: 1,
            vid: 'tags',
            name: 'Technology',
          }),
        ]),
        nodes: expect.arrayContaining([
          expect.objectContaining({
            nid: 1,
            type: 'article',
            title: 'Test Article',
          }),
        ]),
      });

      expect(mockGet).toHaveBeenCalledWith('jsonapi/taxonomy_term/tags');
      expect(mockGet).toHaveBeenCalledWith(
        'jsonapi/node/article?include=field_tags,field_featured_image',
      );
    });

    it('should handle pagination', async () => {
      const page1 = {
        data: [{ type: 'node--article', id: '1', attributes: { title: 'Page 1' } }],
        links: {
          self: { href: 'http://localhost:8081/jsonapi/node/article' },
          next: { href: '/jsonapi/node/article?page[offset]=1' },
        },
      };

      const page2 = {
        data: [{ type: 'node--article', id: '2', attributes: { title: 'Page 2' } }],
        links: {
          self: { href: 'http://localhost:8081/jsonapi/node/article?page[offset]=1' },
        },
      };

      const mockGet = vi.fn()
        .mockResolvedValueOnce({ json: () => Promise.resolve({ data: [] }) }) // taxonomy
        .mockResolvedValueOnce({ json: () => Promise.resolve(page1) }) // nodes page 1
        .mockResolvedValueOnce({ json: () => Promise.resolve(page2) }) // nodes page 2
        .mockResolvedValueOnce({ json: () => Promise.resolve({ data: [] }) }); // pages

      const mockKyInstance = {
        get: mockGet,
      };

      const { default: ky } = await import('ky');
      (ky.extend as any).mockReturnValue(mockKyInstance);

      exporter = new DrupalExporter(mockConfig);
      const result = await exporter.export();

      expect(result.nodes).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledTimes(4);
    });

    it('should handle API errors gracefully', async () => {
      const mockGet = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const mockKyInstance = {
        get: mockGet,
      };

      const { default: ky } = await import('ky');
      (ky.extend as any).mockReturnValue(mockKyInstance);

      exporter = new DrupalExporter(mockConfig);

      await expect(exporter.export()).rejects.toThrow('Failed to export content: Network error');
    });
  });
});