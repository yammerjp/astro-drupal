# yrush

> A modern CLI tool for Drupal content management via JSON API

[![CI](https://github.com/yammerjp/yrush/actions/workflows/ci.yml/badge.svg)](https://github.com/yammerjp/yrush/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/yrush.svg)](https://badge.fury.io/js/yrush)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

yrush is a powerful command-line tool that enables you to export and import Drupal content through the JSON API. Perfect for content migration, backup, and synchronization between Drupal environments.

## ✨ Features

- 🚀 **Fast & Efficient** - Parallel processing and streaming for optimal performance
- 🔐 **Secure** - Authentication with environment variables and config profiles
- 📦 **Complete Export** - Handles nodes, taxonomy terms, and relationships
- 🔄 **Smart Import** - Maintains content relationships with dry-run mode
- 🛠️ **Developer Friendly** - Written in TypeScript with full type safety
- 🧪 **Well Tested** - Comprehensive test suite with >90% coverage
- 📝 **Great Logging** - Debug, verbose modes, and progress indicators
- ⚙️ **Configurable** - Support for config files and named profiles

## 📋 Prerequisites

- Node.js 18 or higher
- Drupal 8/9/10 with JSON API module enabled
- Write permissions for import operations

## 🚀 Quick Start

### Using npx (no installation required)

```bash
# Export content
npx yrush export -u https://your-drupal-site.com -o content.json

# Import content
npx yrush import -u https://your-drupal-site.com -U admin -P password -i content.json
```

### Global Installation

```bash
npm install -g yrush
```

## 📖 Usage

### Export Content

Export all content from a Drupal site:

```bash
yrush export -u https://example.com -o export.json
```

With authentication:

```bash
yrush export -u https://example.com -U username -P password -o export.json
```

### Import Content

Import content to a Drupal site:

```bash
yrush import -u https://example.com -U admin -P password -i export.json
```

### Environment Variables

You can use environment variables to avoid passing credentials via command line:

```bash
export DRUPAL_URL=https://example.com
export DRUPAL_USER=admin
export DRUPAL_PASS=password

yrush export -o export.json
yrush import -i export.json
```

### Configuration Files

Create a `.yrushrc.json` file for persistent configuration:

```bash
# Initialize config file
yrush config --init

# Use profiles
yrush export --profile production -o backup.json
yrush import --profile staging -i backup.json
```

### Dry Run Mode

Preview import operations without making changes:

```bash
yrush import --dry-run -i export.json -u https://example.com -U admin -P password
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
yrush export -d -u https://example.com
yrush import -d -u https://example.com -U admin -P password -i export.json
```

## 🔧 Options

### Global Options

- `-v, --verbose` - Enable verbose logging
- `-d, --debug` - Enable debug logging (most detailed)
- `-h, --help` - Display help
- `--version` - Display version

### Export Command

- `-u, --url <url>` - Drupal base URL
- `-U, --username <username>` - Drupal username
- `-P, --password <password>` - Drupal password
- `-o, --output <file>` - Output file path (default: `./drupal-export.json`)
- `--profile <name>` - Use named profile from config file
- `--parallel` - Enable parallel fetching for better performance
- `--concurrency <n>` - Number of parallel requests (default: 5)

### Import Command

- `-u, --url <url>` - Drupal base URL
- `-U, --username <username>` - Drupal username (required)
- `-P, --password <password>` - Drupal password (required)
- `-i, --input <file>` - Input file path (default: `./drupal-export.json`)
- `--profile <name>` - Use named profile from config file
- `--dry-run` - Preview import without making changes

### Config Command

- `--init` - Initialize a new config file
- `--list` - List all available profiles
- `--show` - Display current configuration

## 📊 What Gets Exported/Imported

### Content Types
- Articles
- Pages
- Custom content types (automatically detected)

### Taxonomy
- All taxonomy vocabularies
- Term hierarchies (parent/child relationships)

### Relationships
- Entity references
- Taxonomy term references
- Author information

### Fields
- Text fields
- Body fields with formatting
- Custom fields

## 🔧 Programmatic API

You can also use yrush as a library in your Node.js projects:

```typescript
import { DrupalExporter, DrupalImporter } from 'yrush';

// Export
const exporter = new DrupalExporter({
  baseUrl: 'https://example.com',
  username: 'admin',
  password: 'password'
});

try {
  const data = await exporter.export();
  console.log(`Exported ${data.nodes.length} nodes`);
} catch (error) {
  console.error('Export failed:', error);
}

// Import
const importer = new DrupalImporter({
  baseUrl: 'https://other-site.com',
  username: 'admin',
  password: 'password'
});

try {
  const result = await importer.import(data);
  if (result.success) {
    console.log(`Imported ${result.imported.nodes} nodes`);
  } else {
    console.log('Import had errors:', result.errors);
  }
} catch (error) {
  console.error('Import failed:', error);
}
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Type check
npm run typecheck

# Build
npm run build

# Run in development
npm run dev export -- -u https://example.com
```

## 🐛 Troubleshooting

See the [troubleshooting guide](docs/troubleshooting.md) for common issues and solutions.

## 📚 Documentation

- [API Documentation](docs/api.md) - Detailed API reference
- [Data Format Specification](docs/format.md) - Export/import file format
- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues and solutions
- [Production Readiness](docs/production-readiness.md) - Deployment considerations

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © [yammerjp](https://github.com/yammerjp)

## 🙏 Acknowledgments

Built with modern tools recommended by the Japanese tech community:
- Testing with [Vitest](https://vitest.dev/) instead of Jest
- HTTP requests with [Ky](https://github.com/sindresorhus/ky) instead of Axios
- Following t_wada's TDD practices