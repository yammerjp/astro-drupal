# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of yrush CLI tool
- Export functionality via Drupal JSON API
- Import functionality via Drupal JSON API
- Support for taxonomy terms and nodes (articles, pages)
- Authentication support (Basic Auth)
- Comprehensive error handling with custom error classes
- Structured logging system with multiple log levels
- Input validation for URLs, configurations, and data
- TypeScript support with strict mode
- Comprehensive test suite with >90% coverage
- CLI with verbose and debug modes
- Environment variable support for credentials
- JSON file format for import/export

### Security
- Input sanitization for file paths
- Secure credential handling via environment variables
- Authentication validation

### Developer Experience
- Test-Driven Development (TDD) approach
- Modern toolchain (Vitest, TypeScript, ESM)
- CI/CD pipeline with GitHub Actions
- Automated dependency updates via Dependabot
- Code quality tools (ESLint, Prettier)
- Comprehensive documentation

## Future Releases

### [0.2.0] - Planned
- Content filtering options (by type, date, etc.)
- Progress indicators for large exports
- Dry-run mode for imports
- Configuration file support (.yrushrc)
- Incremental export/import
- Better handling of media files

### [0.3.0] - Planned
- Plugin system for custom transformations
- Support for more Drupal entities
- Parallel processing for performance
- Resume capability for interrupted operations
- Export/import profiles