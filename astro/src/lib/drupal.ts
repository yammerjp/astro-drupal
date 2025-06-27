// Drupal API client utilities

const DRUPAL_BASE_URL = import.meta.env.DRUPAL_BASE_URL || process.env.DRUPAL_BASE_URL || 'http://localhost:8081';

export interface DrupalNode {
  id: string;
  type: string;
  attributes: {
    title: string;
    created: string;
    changed: string;
    status: boolean;
    body?: {
      value: string;
      format: string;
      processed: string;
    };
    field_summary?: {
      value: string;
      format: string;
      processed: string;
    };
  };
  relationships?: {
    field_tags?: {
      data: Array<{
        id: string;
        type: string;
      }>;
    };
  };
}

export interface DrupalTaxonomyTerm {
  id: string;
  type: string;
  attributes: {
    name: string;
    description?: {
      value: string;
      format: string;
      processed: string;
    };
  };
}

export interface JsonApiResponse<T> {
  data: T;
  included?: any[];
  links?: {
    self: { href: string };
    next?: { href: string };
    prev?: { href: string };
  };
}

export async function fetchArticles(): Promise<DrupalNode[]> {
  try {
    const response = await fetch(
      `${DRUPAL_BASE_URL}/jsonapi/node/article?include=field_tags&filter[status]=1&sort=-created`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.statusText}`);
    }
    
    const json: JsonApiResponse<DrupalNode[]> = await response.json();
    return json.data;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

export async function fetchArticleByUuid(uuid: string): Promise<DrupalNode | null> {
  try {
    const response = await fetch(
      `${DRUPAL_BASE_URL}/jsonapi/node/article/${uuid}?include=field_tags`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const json: JsonApiResponse<DrupalNode> = await response.json();
    return json.data;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function fetchTags(): Promise<DrupalTaxonomyTerm[]> {
  try {
    const response = await fetch(
      `${DRUPAL_BASE_URL}/jsonapi/taxonomy_term/tags`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.statusText}`);
    }
    
    const json: JsonApiResponse<DrupalTaxonomyTerm[]> = await response.json();
    return json.data;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

// Helper function to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}