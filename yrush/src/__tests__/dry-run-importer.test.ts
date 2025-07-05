import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DryRunImporter } from '../dry-run-importer.js';
import type { ExportResult } from '../types.js';
import { setDefaultLogger, Logger, LogLevel } from '../logger.js';

// Mock logger to suppress console output
beforeEach(() => {
  const mockLogger = new Logger({ level: LogLevel.ERROR });
  setDefaultLogger(mockLogger);
});

describe('DryRunImporter', () => {
  const mockConfig = {
    baseUrl: 'http://localhost:8081',
    username: 'admin',
    password: 'password',
  };
  
  describe('dryRun', () => {
    it('should analyze valid export data', async () => {
      const importer = new DryRunImporter(mockConfig);
      
      const exportData: ExportResult = {
        metadata: {
          exportedAt: new Date().toISOString(),
          sourceUrl: 'http://source.com',
          exportMethod: 'json_api',
        },
        taxonomyTerms: [
          {
            tid: 1,
            vid: 'tags',
            name: 'Test Tag',
            description: '',
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
            created: Date.now() / 1000,
            changed: Date.now() / 1000,
          },
        ],
      };
      
      const report = await importer.dryRun(exportData);
      
      expect(report.summary.totalItems).toBe(2);
      expect(report.summary.taxonomyTerms).toBe(1);
      expect(report.summary.nodes).toBe(1);
      expect(report.summary.nodesByType.article).toBe(1);
      expect(report.validation.passed).toBe(true);
      expect(report.operations).toHaveLength(2);
      expect(report.operations[0].type).toBe('create');
      expect(report.operations[1].type).toBe('create');
    });
    
    it('should catch validation errors', async () => {
      const importer = new DryRunImporter(mockConfig);
      
      const exportData: ExportResult = {
        metadata: {
          exportedAt: new Date().toISOString(),
          sourceUrl: 'http://source.com',
          exportMethod: 'json_api',
        },
        taxonomyTerms: [
          {
            tid: 1,
            vid: '',  // Invalid: empty vid
            name: '',  // Invalid: empty name
            description: '',
            weight: 0,
            parent: '0',
          },
        ],
        nodes: [
          {
            nid: 1,
            type: '',  // Invalid: empty type
            title: '',  // Invalid: empty title
            status: 1,
            created: Date.now() / 1000,
            changed: Date.now() / 1000,
          },
        ],
      };
      
      const report = await importer.dryRun(exportData);
      
      expect(report.validation.passed).toBe(false);
      expect(report.validation.errors.length).toBeGreaterThan(0);
      expect(report.operations[0].type).toBe('skip');
      expect(report.operations[1].type).toBe('skip');
    });
    
    it('should handle warnings', async () => {
      const importer = new DryRunImporter(mockConfig);
      
      const exportData: ExportResult = {
        metadata: {
          exportedAt: new Date().toISOString(),
          sourceUrl: 'http://source.com',
          exportMethod: 'json_api',
        },
        taxonomyTerms: [],
        nodes: [
          {
            nid: 1,
            type: 'article',
            title: 'A'.repeat(300),  // Warning: title too long
            status: 1,
            created: Date.now() / 1000,
            changed: Date.now() / 1000,
            fields: {
              field_tags: [
                { target_id: 0 },  // Warning: invalid reference
              ],
            },
          },
        ],
      };
      
      const report = await importer.dryRun(exportData);
      
      expect(report.validation.warnings.length).toBeGreaterThan(0);
      expect(report.operations[0].type).toBe('create');  // Still creates despite warnings
    });
    
    it('should format report correctly', async () => {
      const importer = new DryRunImporter(mockConfig);
      
      const exportData: ExportResult = {
        metadata: {
          exportedAt: new Date().toISOString(),
          sourceUrl: 'http://source.com',
          exportMethod: 'json_api',
        },
        taxonomyTerms: [],
        nodes: [],
      };
      
      const report = await importer.dryRun(exportData);
      const formatted = importer.formatReport(report);
      
      expect(formatted).toContain('DRY RUN IMPORT REPORT');
      expect(formatted).toContain('SUMMARY');
      expect(formatted).toContain('VALIDATION: PASSED');
      expect(formatted).toContain('OPERATIONS');
    });
    
    it('should estimate time correctly', async () => {
      const importer = new DryRunImporter(mockConfig);
      
      const exportData: ExportResult = {
        metadata: {
          exportedAt: new Date().toISOString(),
          sourceUrl: 'http://source.com',
          exportMethod: 'json_api',
        },
        taxonomyTerms: Array(10).fill({
          tid: 1,
          vid: 'tags',
          name: 'Tag',
          description: '',
          weight: 0,
          parent: '0',
        }),
        nodes: Array(110).fill({
          nid: 1,
          type: 'article',
          title: 'Article',
          status: 1,
          created: Date.now() / 1000,
          changed: Date.now() / 1000,
        }),
      };
      
      const report = await importer.dryRun(exportData);
      
      expect(report.summary.totalItems).toBe(120);
      expect(report.estimatedTime).toBe('1m 0s');  // 120 * 0.5s = 60s
    });
  });
});