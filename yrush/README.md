# yrush

A modern TypeScript CLI tool for Drupal content management via JSON API. Built with Vitest, Ky, and Commander.

## Features

- 🚀 Export Drupal content to JSON
- 📥 Import content back to Drupal
- 🔐 Basic authentication support
- 📄 Full TypeScript support
- 🧪 Thoroughly tested with Vitest
- 🌐 Uses modern fetch via Ky

## Installation

```bash
# Use directly with npx
npx yrush export

# Or install globally
npm install -g yrush

# Or install as a dev dependency
npm install --save-dev yrush
```

## Usage

### Export Content

```bash
# Export with default settings
yrush export

# Export with custom URL and output file
yrush export -u https://mydrupal.com -o content.json

# Export with authentication
yrush export -U username -P password

# Using environment variables
export DRUPAL_URL=https://mydrupal.com
export DRUPAL_USER=myuser
export DRUPAL_PASS=mypass
yrush export
```

### Import Content

```bash
# Import from default file
yrush import -U username -P password

# Import from specific file
yrush import -i content.json -U username -P password

# Import to different Drupal instance
yrush import -u https://otherdrupal.com -U username -P password
```

## Options

### Export Command

- `-u, --url <url>` - Drupal base URL (default: `http://localhost:8081` or `DRUPAL_URL` env)
- `-U, --username <username>` - Drupal username (optional, or `DRUPAL_USER` env)
- `-P, --password <password>` - Drupal password (optional, or `DRUPAL_PASS` env)
- `-o, --output <file>` - Output file path (default: `./drupal-export.json`)

### Import Command

- `-u, --url <url>` - Drupal base URL (default: `http://localhost:8081` or `DRUPAL_URL` env)
- `-U, --username <username>` - Drupal username (required, or `DRUPAL_USER` env)
- `-P, --password <password>` - Drupal password (required, or `DRUPAL_PASS` env)
- `-i, --input <file>` - Input file path (default: `./drupal-export.json`)

## Programmatic Usage

```typescript
import { DrupalExporter, DrupalImporter } from 'yrush';

// Export
const exporter = new DrupalExporter({
  baseUrl: 'https://mydrupal.com',
  username: 'user',
  password: 'pass',
});

const exportResult = await exporter.export();
console.log(`Exported ${exportResult.nodes.length} nodes`);

// Import
const importer = new DrupalImporter({
  baseUrl: 'https://otherdrupal.com',
  username: 'user',
  password: 'pass',
});

const importResult = await importer.import(exportResult);
console.log(`Imported ${importResult.imported.nodes} nodes`);
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build
npm run build

# Run in development
npm run dev export
```

## License

MIT