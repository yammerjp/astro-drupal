# Contributing to yrush

We love your input! We want to make contributing to yrush as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## We Develop with Github

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## We Use [Github Flow](https://guides.github.com/introduction/flow/index.html)

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using Github's [issues](https://github.com/yammerjp/yrush/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/yammerjp/yrush/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Process

### Prerequisites

- Node.js 18+ 
- npm 9+
- A Drupal instance with JSON API enabled (for testing)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yammerjp/yrush.git
   cd yrush
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run tests:
   ```bash
   npm test
   ```

### Development Workflow

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Write/update tests for your changes

4. Run the full test suite:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run test:coverage
   ```

5. Build the project:
   ```bash
   npm run build
   ```

6. Test the CLI locally:
   ```bash
   npm link
   yrush --help
   ```

7. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

### Coding Standards

- We use TypeScript with strict mode enabled
- Follow the existing code style (enforced by ESLint and Prettier)
- Write meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use descriptive variable and function names

### Testing

- We practice Test-Driven Development (TDD)
- Write tests for all new functionality
- Aim for >90% test coverage
- Tests should be:
  - Fast
  - Isolated
  - Repeatable
  - Self-validating
  - Timely

Example test structure:
```typescript
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Documentation

- Update README.md if you change functionality
- Update API documentation for public API changes
- Add entries to docs/ for new features
- Include code examples where helpful

### Pull Request Process

1. Update the README.md with details of changes to the interface
2. Update the CHANGELOG.md with your changes
3. The PR will be merged once you have the sign-off of at least one maintainer

## Code Review Process

All submissions require review. We use GitHub pull requests for this purpose. Consult [GitHub Help](https://help.github.com/articles/about-pull-requests/) for more information on using pull requests.

During code review, we look for:

- **Correctness**: Does the code do what it's supposed to?
- **Complexity**: Is the code more complex than it needs to be?
- **Consistency**: Does the code follow our patterns and style?
- **Testing**: Are there adequate tests? Do they test the right things?
- **Documentation**: Is the code well-documented?
- **Performance**: Are there any performance concerns?

## Community

- Be welcoming to newcomers and encourage diverse new contributors from all backgrounds
- Be respectful and considerate in your communication
- Focus on the code and ideas, not the person
- Assume good intentions

## License

By contributing, you agree that your contributions will be licensed under its MIT License.