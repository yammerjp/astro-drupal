# yrush API Documentation

## Classes

### DrupalExporter

The main class for exporting content from Drupal via JSON API.

```typescript
import { DrupalExporter } from 'yrush';

const exporter = new DrupalExporter(config);
```

#### Constructor

```typescript
constructor(config: DrupalConfig)
```

**Parameters:**
- `config` - Configuration object containing:
  - `baseUrl` (string, required) - The base URL of your Drupal instance
  - `username` (string, optional) - Username for authentication
  - `password` (string, optional) - Password for authentication

**Throws:**
- `ConfigError` - If the configuration is invalid

#### Methods

##### export()

Exports content from Drupal.

```typescript
async export(): Promise<ExportResult>
```

**Returns:**
- `ExportResult` - Object containing:
  - `metadata` - Export metadata (timestamp, source URL, method)
  - `taxonomyTerms` - Array of taxonomy terms
  - `nodes` - Array of content nodes

**Throws:**
- `NetworkError` - If network request fails
- `AuthenticationError` - If authentication fails

**Example:**
```typescript
const exporter = new DrupalExporter({
  baseUrl: 'https://example.com',
  username: 'admin',
  password: 'password'
});

try {
  const result = await exporter.export();
  console.log(`Exported ${result.nodes.length} nodes`);
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  }
}
```

### DrupalImporter

The main class for importing content to Drupal via JSON API.

```typescript
import { DrupalImporter } from 'yrush';

const importer = new DrupalImporter(config);
```

#### Constructor

```typescript
constructor(config: DrupalConfig)
```

**Parameters:**
- `config` - Configuration object containing:
  - `baseUrl` (string, required) - The base URL of your Drupal instance
  - `username` (string, required) - Username for authentication
  - `password` (string, required) - Password for authentication

**Throws:**
- `ConfigError` - If the configuration is invalid
- `AuthenticationError` - If username or password is missing

#### Methods

##### import()

Imports content to Drupal.

```typescript
async import(data: ExportResult): Promise<ImportResult>
```

**Parameters:**
- `data` - Export data to import (must match ExportResult format)

**Returns:**
- `ImportResult` - Object containing:
  - `success` (boolean) - Whether import completed without errors
  - `imported` - Count of imported items
    - `taxonomyTerms` (number)
    - `nodes` (number)
  - `errors` - Array of import errors

**Throws:**
- `ValidationError` - If import data format is invalid
- `NetworkError` - If network request fails
- `AuthenticationError` - If authentication fails

**Example:**
```typescript
const importer = new DrupalImporter({
  baseUrl: 'https://example.com',
  username: 'admin',
  password: 'password'
});

try {
  const result = await importer.import(exportData);
  if (result.success) {
    console.log('Import successful!');
  } else {
    console.log('Import had errors:', result.errors);
  }
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid data format:', error.message);
  }
}
```

## Error Classes

### YrushError

Base error class for all yrush errors.

```typescript
class YrushError extends Error {
  code: string;
  details?: unknown;
}
```

### NetworkError

Thrown when network requests fail.

```typescript
class NetworkError extends YrushError {
  code = 'NETWORK_ERROR';
}
```

### AuthenticationError

Thrown when authentication fails.

```typescript
class AuthenticationError extends YrushError {
  code = 'AUTH_ERROR';
}
```

### ValidationError

Thrown when data validation fails.

```typescript
class ValidationError extends YrushError {
  code = 'VALIDATION_ERROR';
}
```

### ConfigError

Thrown when configuration is invalid.

```typescript
class ConfigError extends YrushError {
  code = 'CONFIG_ERROR';
}
```

## Logging

### Logger

The logging system supports multiple log levels and formatting options.

```typescript
import { Logger, LogLevel, getLogger } from 'yrush';

// Get default logger
const logger = getLogger();

// Create custom logger
const customLogger = new Logger({
  level: LogLevel.DEBUG,
  timestamps: true,
  colors: true
});
```

#### Log Levels

- `LogLevel.ERROR` (0) - Error messages only
- `LogLevel.WARN` (1) - Warnings and errors
- `LogLevel.INFO` (2) - Info, warnings, and errors
- `LogLevel.DEBUG` (3) - All messages including debug

#### Logger Methods

```typescript
logger.error(message: string, error?: unknown): void
logger.warn(message: string): void
logger.info(message: string): void
logger.debug(message: string, data?: unknown): void
logger.setLevel(level: LogLevel): void
```

## Validators

### validateUrl()

Validates a URL string.

```typescript
import { validateUrl } from 'yrush';

try {
  validateUrl('https://example.com');
} catch (error) {
  console.error('Invalid URL');
}
```

### validateExportData()

Validates export data format.

```typescript
import { validateExportData } from 'yrush';

try {
  validateExportData(data);
} catch (error) {
  console.error('Invalid export data');
}
```

### validateConfig()

Validates configuration object.

```typescript
import { validateConfig } from 'yrush';

try {
  validateConfig(config);
} catch (error) {
  console.error('Invalid configuration');
}
```

### sanitizeFilePath()

Sanitizes file paths by removing dangerous characters.

```typescript
import { sanitizeFilePath } from 'yrush';

const safePath = sanitizeFilePath(userInput);
```

## Type Definitions

### DrupalConfig

```typescript
interface DrupalConfig {
  baseUrl: string;
  username?: string;
  password?: string;
}
```

### ExportResult

```typescript
interface ExportResult {
  metadata: {
    exportedAt: string;
    sourceUrl: string;
    exportMethod: string;
  };
  taxonomyTerms: TaxonomyTerm[];
  nodes: Node[];
}
```

### ImportResult

```typescript
interface ImportResult {
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
```

### TaxonomyTerm

```typescript
interface TaxonomyTerm {
  tid: number;
  vid: string;
  name: string;
  description: string;
  weight: number;
  parent: string;
}
```

### Node

```typescript
interface Node {
  nid: number;
  type: string;
  title: string;
  status: number;
  created: number;
  changed: number;
  body?: {
    value: string;
    format: string;
    processed?: string;
    summary?: string;
  };
  fields?: Record<string, unknown>;
}
```