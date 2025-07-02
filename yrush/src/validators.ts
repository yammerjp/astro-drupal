import { ValidationError } from './errors.js';

export function validateUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new ValidationError(`Invalid protocol: ${parsed.protocol}. Only HTTP(S) is supported.`);
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(`Invalid URL: ${url}`);
  }
}

export function validateExportData(data: unknown): void {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Export data must be an object');
  }

  const obj = data as Record<string, unknown>;

  if (!obj.metadata || typeof obj.metadata !== 'object') {
    throw new ValidationError('Export data must have a metadata object');
  }

  if (!Array.isArray(obj.taxonomyTerms)) {
    throw new ValidationError('Export data must have a taxonomyTerms array');
  }

  if (!Array.isArray(obj.nodes)) {
    throw new ValidationError('Export data must have a nodes array');
  }

  const metadata = obj.metadata as Record<string, unknown>;
  if (!metadata.exportedAt || !metadata.sourceUrl || !metadata.exportMethod) {
    throw new ValidationError('Metadata must contain exportedAt, sourceUrl, and exportMethod');
  }
}

export function validateConfig(config: unknown): void {
  if (!config || typeof config !== 'object') {
    throw new ValidationError('Config must be an object');
  }

  const obj = config as Record<string, unknown>;

  if (!obj.baseUrl || typeof obj.baseUrl !== 'string') {
    throw new ValidationError('Config must have a valid baseUrl string');
  }

  validateUrl(obj.baseUrl as string);

  if (obj.username !== undefined && typeof obj.username !== 'string') {
    throw new ValidationError('Username must be a string');
  }

  if (obj.password !== undefined && typeof obj.password !== 'string') {
    throw new ValidationError('Password must be a string');
  }
}

export function sanitizeFilePath(path: string): string {
  // Remove potentially dangerous characters
  return path.replace(/[<>:"|?*]/g, '');
}