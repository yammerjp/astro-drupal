export interface DrupalConfig {
  baseUrl: string;
  username?: string;
  password?: string;
}

export interface TaxonomyTerm {
  tid: number;
  vid: string;
  name: string;
  description: string;
  weight: number;
  parent: string;
}

export interface Node {
  nid: number;
  type: string;
  title: string;
  status: number;
  created: number;
  changed: number;
  body?: {
    value: string;
    summary?: string;
    format: string;
  };
  fields?: Record<string, unknown>;
}

export interface ExportMetadata {
  exportedAt: string;
  sourceUrl: string;
  exportMethod: string;
}

export interface ExportResult {
  metadata: ExportMetadata;
  taxonomyTerms: TaxonomyTerm[];
  nodes: Node[];
  files?: unknown[];
}

export interface JsonApiResponse<T = unknown> {
  data: T[];
  links?: {
    self: { href: string };
    next?: { href: string };
  };
}

export interface JsonApiResource {
  type: string;
  id: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, unknown>;
}

export interface ImportResult {
  success: boolean;
  imported: {
    taxonomyTerms: number;
    nodes: number;
  };
  errors: Array<{
    type: string;
    item: string;
    error: string;
  }>;
}