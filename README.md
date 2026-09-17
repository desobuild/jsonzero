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

> **Phase 3 — JSON Inspection** complete.
>
> Core Formatter, Editor Search & Replace, and JSON Inspection (Tree View, JSONPath & Statistics) are active.

### Features

- **Format / Minify / Validate**: Indentation (2 spaces, 4 spaces, tabs), fast parsing, syntax error indicators.
- **Editor Search & Replace**: Case-sensitive, whole-word toggles, match navigation, replace current / all.
- **Tree View Inspector**:
  - Interactive recursive hierarchy for objects and arrays.
  - Expand/collapse individual nodes, Expand All, Collapse All.
  - Distinct syntax styling for strings, numbers, booleans, and null.
  - Quick actions per node: Copy Key, Copy Value, Copy JSON Path.
  - In-tree local search with match highlighting, match count, and ancestor auto-expansion.
- **JSONPath Querying (Supported Subset)**:
  - Supports: `$` (root), `.property`, `["property"]`, `[0]` (array indexing), `[*]` (wildcards), and basic filter expressions `[?(@.property == value)]` or comparisons `[?(@.count > 10)]`.
  - Itemized results with individual path/value copying and bulk JSON copy.
- **Structure Statistics**:
  - Deterministic metrics: Root Type, Max Depth, Total Nodes, Total Primitives, and counts for Objects, Arrays, Keys, Strings, Numbers, Booleans, and Nulls.
- **Privacy & Security**:
  - 100% client-side. Zero telemetry, zero analytics, zero server calls.

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
