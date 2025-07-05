import type {
  ExportResult,
  TaxonomyTerm,
  Node,
} from './types.js';
import { DrupalImporter } from './importer.js';
import { getLogger } from './logger.js';
import { validateExportData } from './validators.js';
import { ValidationError } from './errors.js';

export interface DryRunReport {
  summary: {
    totalItems: number;
    taxonomyTerms: number;
    nodes: number;
    nodesByType: Record<string, number>;
  };
  validation: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  };
  operations: Array<{
    type: 'create' | 'update' | 'skip';
    entityType: string;
    entity: string;
    reason?: string;
  }>;
  estimatedTime: string;
}

export class DryRunImporter extends DrupalImporter {
  private dryRunLogger = getLogger();

  async dryRun(data: ExportResult): Promise<DryRunReport> {
    this.dryRunLogger.info('Starting dry run import analysis');
    
    const report: DryRunReport = {
      summary: {
        totalItems: 0,
        taxonomyTerms: 0,
        nodes: 0,
        nodesByType: {},
      },
      validation: {
        passed: true,
        errors: [],
        warnings: [],
      },
      operations: [],
      estimatedTime: '0s',
    };
    
    // Validate data structure
    try {
      validateExportData(data);
    } catch (error) {
      report.validation.passed = false;
      report.validation.errors.push(
        error instanceof ValidationError ? error.message : 'Invalid data format'
      );
      return report;
    }
    
    // Analyze taxonomy terms
    if (data.taxonomyTerms && data.taxonomyTerms.length > 0) {
      report.summary.taxonomyTerms = data.taxonomyTerms.length;
      report.summary.totalItems += data.taxonomyTerms.length;
      
      for (const term of data.taxonomyTerms) {
        const validation = this.validateTaxonomyTerm(term);
        
        if (validation.errors.length > 0) {
          report.validation.errors.push(...validation.errors);
          report.validation.passed = false;
        }
        
        if (validation.warnings.length > 0) {
          report.validation.warnings.push(...validation.warnings);
        }
        
        report.operations.push({
          type: validation.errors.length > 0 ? 'skip' : 'create',
          entityType: 'taxonomy_term',
          entity: `${term.name} (tid: ${term.tid})`,
          reason: validation.errors.join(', ') || undefined,
        });
      }
    }
    
    // Analyze nodes
    if (data.nodes && data.nodes.length > 0) {
      report.summary.nodes = data.nodes.length;
      report.summary.totalItems += data.nodes.length;
      
      for (const node of data.nodes) {
        // Count by type
        report.summary.nodesByType[node.type] = 
          (report.summary.nodesByType[node.type] || 0) + 1;
        
        const validation = this.validateNode(node);
        
        if (validation.errors.length > 0) {
          report.validation.errors.push(...validation.errors);
          report.validation.passed = false;
        }
        
        if (validation.warnings.length > 0) {
          report.validation.warnings.push(...validation.warnings);
        }
        
        report.operations.push({
          type: validation.errors.length > 0 ? 'skip' : 'create',
          entityType: `node_${node.type}`,
          entity: `${node.title} (nid: ${node.nid})`,
          reason: validation.errors.join(', ') || undefined,
        });
      }
    }
    
    // Estimate time (rough calculation: 0.5s per item)
    const estimatedSeconds = report.summary.totalItems * 0.5;
    report.estimatedTime = this.formatTime(estimatedSeconds);
    
    this.dryRunLogger.info(`Dry run analysis completed - Total: ${report.summary.totalItems}, Passed: ${report.validation.passed}, Errors: ${report.validation.errors.length}, Warnings: ${report.validation.warnings.length}`);
    
    return report;
  }
  
  private validateTaxonomyTerm(term: TaxonomyTerm): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!term.name || term.name.trim() === '') {
      errors.push(`Taxonomy term ${term.tid} has no name`);
    }
    
    if (!term.vid) {
      errors.push(`Taxonomy term ${term.tid} has no vocabulary ID`);
    }
    
    if (term.name && term.name.length > 255) {
      warnings.push(`Taxonomy term ${term.tid} name exceeds 255 characters`);
    }
    
    return { errors, warnings };
  }
  
  private validateNode(node: Node): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!node.title || node.title.trim() === '') {
      errors.push(`Node ${node.nid} has no title`);
    }
    
    if (!node.type) {
      errors.push(`Node ${node.nid} has no content type`);
    }
    
    if (node.title && node.title.length > 255) {
      warnings.push(`Node ${node.nid} title exceeds 255 characters`);
    }
    
    // Check for missing field references
    if (node.fields?.field_tags) {
      const tags = node.fields.field_tags as Array<{ target_id: number }>;
      for (const tag of tags) {
        if (!tag.target_id) {
          warnings.push(`Node ${node.nid} has invalid tag reference`);
        }
      }
    }
    
    return { errors, warnings };
  }
  
  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}m ${Math.round(remainingSeconds)}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
  }
  
  formatReport(report: DryRunReport): string {
    const lines: string[] = [];
    
    lines.push('=== DRY RUN IMPORT REPORT ===\n');
    
    // Summary
    lines.push('📊 SUMMARY');
    lines.push(`   Total items: ${report.summary.totalItems}`);
    lines.push(`   Taxonomy terms: ${report.summary.taxonomyTerms}`);
    lines.push(`   Nodes: ${report.summary.nodes}`);
    
    if (Object.keys(report.summary.nodesByType).length > 0) {
      lines.push('   Node types:');
      for (const [type, count] of Object.entries(report.summary.nodesByType)) {
        lines.push(`     - ${type}: ${count}`);
      }
    }
    
    lines.push(`   Estimated time: ${report.estimatedTime}\n`);
    
    // Validation
    lines.push(`✅ VALIDATION: ${report.validation.passed ? 'PASSED' : 'FAILED'}`);
    
    if (report.validation.errors.length > 0) {
      lines.push(`   ❌ Errors (${report.validation.errors.length}):`);
      for (const error of report.validation.errors.slice(0, 10)) {
        lines.push(`      - ${error}`);
      }
      if (report.validation.errors.length > 10) {
        lines.push(`      ... and ${report.validation.errors.length - 10} more`);
      }
    }
    
    if (report.validation.warnings.length > 0) {
      lines.push(`   ⚠️  Warnings (${report.validation.warnings.length}):`);
      for (const warning of report.validation.warnings.slice(0, 10)) {
        lines.push(`      - ${warning}`);
      }
      if (report.validation.warnings.length > 10) {
        lines.push(`      ... and ${report.validation.warnings.length - 10} more`);
      }
    }
    
    lines.push('');
    
    // Operations summary
    const createOps = report.operations.filter(op => op.type === 'create').length;
    const skipOps = report.operations.filter(op => op.type === 'skip').length;
    
    lines.push('📝 OPERATIONS');
    lines.push(`   Create: ${createOps}`);
    lines.push(`   Skip: ${skipOps}`);
    
    if (skipOps > 0) {
      lines.push('\n   Items to be skipped:');
      const skippedOps = report.operations.filter(op => op.type === 'skip').slice(0, 10);
      for (const op of skippedOps) {
        lines.push(`     - ${op.entity} (${op.reason})`);
      }
      if (skipOps > 10) {
        lines.push(`     ... and ${skipOps - 10} more`);
      }
    }
    
    lines.push('\n' + '='.repeat(30));
    
    return lines.join('\n');
  }
}