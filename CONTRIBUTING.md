# Contributing to JSONZero

Thanks for your interest in contributing to JSONZero!

## Getting Started

```bash
git clone https://github.com/desobuild/jsonzero.git
cd JSONZero
npm install
npm run dev
```

## Development Commands

| Command               | Description                     |
| --------------------- | ------------------------------- |
| `npm run dev`         | Start development server        |
| `npm run build`       | Production build                |
| `npm run preview`     | Preview production build        |
| `npm run lint`        | Run ESLint                      |
| `npm run format`      | Format code with Prettier       |
| `npm run format:check`| Check formatting                |
| `npm run test`        | Run unit tests                  |
| `npm run test:watch`  | Run tests in watch mode         |
| `npm run test:e2e`    | Run Playwright e2e tests        |
| `npm run typecheck`   | TypeScript type checking        |

## Code Style

- **TypeScript**: Strict mode enabled. Avoid `any` unless genuinely unavoidable.
- **Formatting**: Prettier handles formatting. Run `npm run format` before committing.
- **Linting**: ESLint enforces code quality. All lint errors must be resolved.
- **Components**: Keep components small and focused. Prefer composition over inheritance.
- **Styling**: Use Tailwind CSS with design tokens. Avoid hardcoded color values.

## Testing

- Write unit tests for utility functions and JSON processing logic.
- Write component tests for UI components using React Testing Library.
- All tests must pass before a PR can be merged.

## Pull Requests

1. Fork the repository and create a feature branch.
2. Make your changes with clear, descriptive commits.
3. Ensure all checks pass: lint, typecheck, tests, build.
4. Open a PR with a clear description of what changed and why.

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests.
- Include reproduction steps for bugs.
- Be specific about expected vs actual behavior.

## Privacy Principle

JSONZero is a privacy-first tool. Do not introduce:

- Analytics or tracking SDKs
- Remote JSON processing for core features
- Authentication requirements
- Third-party data collection

Any feature that requires network access must be clearly isolated from core JSON processing.
