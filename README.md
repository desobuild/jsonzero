# JSONZero

**JSON. Zero clutter.**

Privacy-first JSON developer workbench.

Format, inspect, compare, transform, convert, and test JSON — entirely in your browser with zero network requests and zero server uploads.

**Live Application**: [https://jsonzero.desobuild.workers.dev/](https://jsonzero.desobuild.workers.dev/)

---

## Philosophy

JSONZero is built for developers who care about data confidentiality, tool responsiveness, and distraction-free workflows:

- **No ads** — No promotional banners or sponsored clutter.
- **No accounts** — No sign-up, login, or email capture required.
- **No selling data** — Your data never leaves your device.
- **No JSON harvesting** — Zero backend servers, zero database logs.
- **Local/browser processing** — 100% in-browser execution in client memory.
- **Open source** — Fully transparent code under the [MIT License](./LICENSE).
- **Free core tool** — High-performance developer workbench built for everyday productivity.

---

## Privacy Architecture

> "No ads. No accounts. No selling data."
> 
> **"Your JSON stays in your browser."**

### How Data Moves

```
User JSON
  │
  ▼
Browser Memory (RAM)
  │
  ▼
JSONZero Processing (Synchronous Pure Utilities or Native Web Worker)
  │
  ▼
Output Result (Rendered on screen)
```

- **Zero Server Uploads**: No user JSON is ever transmitted across the network to any server.
- **Zero Telemetry / Analytics**: No tracking SDKs, no behavioral cookies, no error reporting beacons.
- **In-Memory Only**: User JSON is never stored in persistent browser storage (`localStorage`, `sessionStorage`, or `indexedDB`). Closing the tab instantly flushes your data.
- **Theme Storage**: Only your chosen theme preference (`light` or `dark`) is stored locally in `localStorage`.
- **Service Worker Isolation**: The Service Worker precaches static application assets (`.js`, `.css`, fonts, icons) so the app runs offline. It **never** caches user JSON.

For our full privacy specification, see [docs/privacy.md](./docs/privacy.md).

---

## Feature Overview

JSONZero provides six dedicated workbenches accessible from a unified toolbar:

### FORMAT
- **Format**: Pretty-print JSON with configurable indentation (2 spaces, 4 spaces, or tabs).
- **Minify**: Strip all whitespace and compact tokens for transport payloads.
- **Validate**: Instant syntax validation with line/character indicators and actionable error diagnostics.

### INSPECT
- **Search & Replace**: In-editor text search with match counts, match navigation, case sensitivity, and whole-word matching.
- **Tree View**: Interactive recursive hierarchy for objects and arrays with individual toggle, Expand All, Collapse All, syntax coloring, and quick path copying (`Copy Key`, `Copy Value`, `Copy JSONPath`).
- **JSONPath Querying**: Evaluates queries against JSON data supporting root (`$`), dot notation (`.user.name`), bracket notation (`['user']['name']`), array indices (`[0]`), wildcards (`[*]`), and filter comparisons (`[?(@.age > 21)]`).
- **Structure Statistics**: Deterministic metrics including root type, max depth, total nodes, total primitives, and itemized counts for objects, arrays, keys, strings, numbers, booleans, and nulls.

### COMPARE
- **Structural JSON Diff**: Recursive client-side comparison engine.
- **Key Order Invariance**: Objects are compared by key regardless of serialization order.
- **Array Sensitivity**: Arrays are compared index-by-index in sequence.
- **Change Classification**: Accurate detection of added, removed, and changed nodes, including primitive type transitions (`1` → `"1"`).
- **Side-by-Side & Mobile**: Dual-pane editors on desktop with tabbed view switching on mobile viewports.

### TRANSFORM
- **Sort Keys**: Alphabetical key sorting in lexicographical order (shallow or recursive, preserving array element order).
- **Flatten**: Flattens nested JSON into single-depth key-value representation using dot notation for objects and bracket notation for arrays with delimiter escaping.
- **Unflatten**: Reconstructs nested JSON structures with strict collision detection and diagnostics.
- **Escape JSON**: Compacts and serializes JSON as a safely escaped JSON string literal for embedding in code.
- **Unescape JSON**: Safely parses escaped JSON string payloads back into structured JSON.
- **Safe Non-Destructive Workflow**: Dedicated preview pane ensures input is never silently overwritten until you choose Apply.

### CONVERT
- **JSON → Table**: Tabular representation of object arrays displaying the union of all keys, compact string representations for nested objects, and cell/TSV export.
- **JSON → CSV**: RFC 4180 compliant CSV generator with delimiter selection (comma `,`, tab `\t`, semicolon `;`) and quote escaping.
- **JSON → TypeScript**: Generates deterministic TypeScript interfaces, type inference, union types for mixed arrays, and optional property markers (`?`).
- **JSON → Dart**: Generates dependency-free Dart models with constructors, `fromJson(Map<String, dynamic> json)`, and `toJson()` serialization methods.
- **JSON → JSON Schema**: Generates standard JSON Schema Draft 2020-12 specifications.

### TEST
- **Schema Validation**: Validates JSON data against Draft 2020-12 schemas entirely offline without remote `$ref` requests.
- **Generate Assertions**: Deterministic TypeScript `expect(...)` assertions for REST API response validation.
- **Playwright Assertions**: Generates ready-to-run Playwright API test blocks.
- **Generic Assertions**: Generates framework-agnostic JSONPath test assertions.
- **Mock JSON**: Generates deterministic mock JSON payloads based on inferred schema types without hallucinations.
- **Expected vs Actual**: Compares contract expectations against actual responses using the structural diff engine.
- **Diff → Assertions**: Generates targeted assertions enforcing contract expectations for detected discrepancies.

### Platform & Performance Capabilities
- **Large JSON Web Worker**: CPU-intensive operations (formatting, minification, sorting, diffing) on documents >= 100 KB run off the main thread with full cancellation support.
- **High-Performance Editor Mode**: Documents exceeding 150 KB or 2,500 lines bypass expensive full-DOM syntax highlighting to ensure fluid typing and scrolling.
- **Offline PWA Support**: Installable as a Progressive Web App on desktop and mobile; all tools and workers continue running without internet access.
- **Local File Open & Download**: Load local `.json` files directly into the workbench and download formatted or converted results locally.

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20.x or higher
- `npm` 10.x or higher

### Installation

```bash
git clone https://github.com/desobuild/jsonzero.git
cd jsonzero
npm install
```

### Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build & Preview

```bash
npm run build
npm run preview
```

Previews the optimized production build at `http://localhost:4173`.

### Automated Tests

```bash
npm run test          # Unit and component tests (Vitest)
npm run test:watch    # Interactive watch mode (Vitest)
npm run test:e2e      # End-to-end browser tests (Playwright)
```

### Code Quality & Formatting

```bash
npm run lint          # ESLint code style and quality checks
npm run typecheck     # TypeScript compiler type check (--noEmit)
npm run format:check  # Check formatting with Prettier
npm run format        # Automatically fix formatting with Prettier
```

---

## Architecture & Technology Stack

| Layer | Technology |
| ----- | ---------- |
| **Framework** | [React 19](https://react.dev/), [TypeScript 6](https://www.typescriptlang.org/), [Vite 8](https://vite.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) tokens |
| **Typography** | Self-hosted [Geist Sans](https://vercel.com/font/sans) & [Geist Mono](https://vercel.com/font/mono) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Testing** | [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/), [Playwright](https://playwright.dev/) |
| **Offline / PWA** | Native Web Worker, Native Service Worker (`sw.js`), Web App Manifest |
| **Hosting** | [Cloudflare Pages](https://pages.cloudflare.com/) (or any static HTTP host) |

For in-depth architectural diagrams and module boundaries, see [docs/architecture.md](./docs/architecture.md).

---

## Known Limitations

- **Large Documents**: Documents larger than 150 KB or 2,500 lines switch to high-performance plain editor mode to prevent browser DOM rendering stalls.
- **iOS Safari PWA Installation**: iOS Safari does not support programmatic `beforeinstallprompt`. Installation is performed manually via **Share > Add to Home Screen**.
- **Firefox Private Browsing**: Firefox disables Service Worker caching and `Cache Storage` in Private Browsing mode by engine security policy. The application works normally online, but offline asset caching is unavailable in private tabs.
- **Offline Schema Validation**: The schema validator implements an offline subset of JSON Schema Draft 2020-12. Remote `$ref` resolution over HTTP is deliberately omitted to preserve our zero-network guarantee.

---

## Documentation Index

- [Architecture Guide](./docs/architecture.md) — Technical details of feature modules, Web Workers, and offline architecture.
- [Privacy Model](./docs/privacy.md) — Exhaustive breakdown of local data flow, zero-network guarantees, and memory lifecycle.
- [Deployment Guide](./docs/deployment.md) — Instructions for Cloudflare Pages, preview builds, and static hosts.
- [Versioning & Release Strategy](./docs/versioning.md) — Semantic versioning and release lifecycle.
- [Performance Benchmarks](./docs/performance.md) — Metrics, worker offloading benchmarks, and windowing details.
- [Quality & Accessibility Audit](./docs/quality-audit.md) — ARIA semantics, WCAG contrast, and keyboard navigation audit.
- [Changelog](./CHANGELOG.md) — History of all completed phases and releases.

---

## Contributing

Contributions that align with our privacy-first philosophy are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on code style, branch naming, local test requirements, and contribution rules.

---

## Security

Security reports are taken very seriously. Please review our [Security Policy](./SECURITY.md) to report vulnerabilities privately via GitHub Security Advisories. **Never include private JSON payloads or credentials in issue reports.**

---

## License

JSONZero is open-source software licensed under the [MIT License](./LICENSE).
