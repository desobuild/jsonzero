# JSONZero

**JSON. Zero clutter.**

A privacy-first, client-side JSON developer workbench. Format, validate, diff, transform, and convert JSON — entirely in your browser.

## Philosophy

- **No ads** — ever
- **No accounts** — no sign-up required
- **No selling data** — your data stays yours
- **No JSON uploads** — all processing happens locally
- **No unnecessary backend** — 100% client-side
- **Open source** — MIT licensed
- **Free core tool** — developer-first UX

## Status

> **Phase 0 — Foundation**
>
> The engineering foundation is established. The application shell, design system, theming, and tooling are in place.
>
> Phase 1 (Core Formatter MVP) is next.

### Planned Features

- Format / Minify / Validate / Repair
- Search / Search & Replace / JSONPath
- Tree View / Statistics
- Structural Diff
- Sort Keys / Flatten / Unflatten / Escape / Unescape
- Convert to Table / CSV / TypeScript / Dart / JSON Schema
- Schema Validation / Assertions / Mock JSON

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm 10+

### Setup

```bash
git clone https://github.com/desobuild/jsonzero.git
cd JSONZero
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

### Testing

```bash
npm run test          # Unit tests
npm run test:watch    # Watch mode
npm run test:e2e      # Playwright e2e tests
```

### Code Quality

```bash
npm run lint          # ESLint
npm run format        # Prettier (write)
npm run format:check  # Prettier (check)
npm run typecheck     # TypeScript
```

## Technology Stack

| Layer        | Technology                        |
| ------------ | --------------------------------- |
| Frontend     | React, TypeScript, Vite           |
| Styling      | Tailwind CSS v4, shadcn/ui        |
| Icons        | Lucide React                      |
| Typography   | Geist Sans, Geist Mono            |
| Testing      | Vitest, React Testing Library, Playwright |
| Code Quality | ESLint, Prettier                  |
| Hosting      | Cloudflare Pages                  |

## Privacy

JSONZero is designed from the ground up with privacy as a core principle:

- All JSON processing happens **locally in your browser**
- **No data is sent** to any server for core functionality
- **No analytics**, tracking, or telemetry SDKs
- **No authentication** required
- **No third-party data processing**

## License

[MIT](./LICENSE)
