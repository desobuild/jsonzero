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

> **Phase 8 — Large JSON Performance, Scalability & Bundle Optimization** complete.
>
> Core Formatter, Editor Search & Replace, JSON Inspection (Tree View, JSONPath & Statistics), Structural Compare / Diff, JSON Transform, JSON Conversion, Developer & Testing Tools, Web Worker processing, and bundle code splitting are active.

### Performance & Scalability (Phase 8)

- **30.3% Initial Bundle Reduction**: Initial JS bundle reduced from ~595 kB to ~415 kB via dynamic route-level code splitting (`React.lazy` and `Suspense`), deferring heavy workbenches until requested.
- **Dedicated Web Worker Offloading**: CPU-intensive parsing, formatting, minification, diffing, and transformations on documents >= 100 KB run off the main thread in native Web Workers, keeping the UI responsive.
- **Instant Small-Document Processing**: Payloads < 100 KB process synchronously on the main thread, avoiding thread serialization overhead.
- **Worker Cancellation & Error Recovery**: Long operations can be cancelled at any time with worker termination and fresh instance recycling; error boundaries prevent application crashes.
- **High-Performance Editor Mode**: Documents exceeding 150 KB or 2,500 lines bypass expensive full-DOM syntax highlighting for instantaneous typing and scrolling, paired with windowed line number rendering.
- **Tree View & Table Windowing**: Large arrays and tables are rendered with windowed pagination (50 items/page) to prevent DOM node explosions, while preserving complete, un-truncated TSV and CSV exports.
- **Performance Documentation**: See [docs/performance.md](./docs/performance.md) for full benchmarks, worker protocol, and architecture details.


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
- **Structural JSON Compare / Diff**:
  - Pure client-side recursive structural comparison between two JSON documents.
  - **Object key ordering invariance**: Objects are compared by key regardless of property order.
  - **Array order sensitivity**: Arrays are compared index-by-index in order.
  - **Type transition detection**: Changes of value type (e.g. `1` → `"1"`, `[]` → `{}`) are accurately classified as `changed`.
  - **Deterministic change summary**: Counts added, removed, changed, and total differences.
  - **Precise JSONPaths**: Unambiguous JSONPath notation with bracket formatting for special characters.
  - **Side-by-side & mobile responsive**: Dual editors on desktop, intuitive tabbed switcher on mobile.
  - **Independent controls**: Independent formatting, clearing, input swapping, and sample loading.
- **JSON Transform Tools**:
  - **Sort Keys**: Alphabetical object-key sorting in lexicographic ascending order. Shallow sort keeps nested structures in original order.
  - **Recursive Sort**: Recursively sorts keys across all nested objects. Strictly preserves array element order, while sorting objects within arrays.
  - **Flatten**: Flattens nested JSON into single-depth key-value representation.
    - *Path Notation*: Nested object properties use dot notation (`user.name`), and arrays use bracket indices (`users[0].name`).
    - *Delimiter Escaping*: Special characters in object keys (`.`, `[`, `]`, `\`) are escaped (`\.`, `\[`, `\]`, `\\`) to ensure unambiguous representation.
    - *Empty Containers*: Empty objects `{}` and arrays `[]` are preserved as leaf values.
  - **Unflatten**: Reconstructs nested structure from flattened key paths.
    - *Collision Protection*: Detects and prevents collisions (e.g., when a path is both a primitive and an object, or conflicting array vs object types). Halts safely with actionable error diagnostics without mutating input.
  - **Escape JSON**: Compacts and serializes JSON as an escaped JSON string literal (e.g., `"{\"name\":\"Alice\"}"`) for embedding in code or configuration.
  - **Unescape JSON**: Unescapes both quoted and unquoted escaped JSON strings, validating JSON syntax before formatting.
  - **Escaped JSON Detection**: Automatically recognizes escaped JSON payloads and provides a quick `Unescape & Format` action.
  - **Safe Non-Destructive Workflow**: Dedicated preview pane ensures input is never silently overwritten. Users explicitly inspect results and choose **Apply**, **Copy Result**, or **Reset**.
- **JSON Conversion Tools (Phase 6)**:
  - **JSON → Table**:
    - Interactive tabular representation. Primary input is `Array<Object>`.
    - Columns represent the union of all keys across objects, preserving order of first appearance without discarding fields.
    - Nested values (objects and arrays) are formatted as compact readable JSON strings (`{"city":"Belagavi"}`), keeping cells clean while preserving raw underlying values.
    - Non-array object roots are presented as Key-Value tables; primitive roots are rendered as single-column value tables; empty structures are gracefully indicated.
    - Interactive controls include single-click cell copying, row copying, whole table TSV copying, and horizontal scrolling for wide datasets.
  - **JSON → CSV**:
    - Converts JSON arrays to standard RFC 4180 CSV with configurable delimiters (comma `,`, tab `\t`, semicolon `;`) and optional header inclusion.
    - Robust escaping: values containing delimiters, double quotes, or newlines are quoted, with embedded quotes escaped as `""`.
    - Nested objects and arrays are serialized as compact JSON inside safely escaped CSV cells.
  - **JSON → TypeScript**:
    - Generates clean, deterministic TypeScript interfaces and types based on the observed JSON sample.
    - Conservative type inference (`string`, `number`, `boolean`, `null`, arrays, nested objects).
    - Deterministic PascalCase interface names derived from property names, with parent-prefix collision avoidance.
    - Automatically quotes object keys that are not valid JavaScript identifiers (e.g. `"first-name": string;`).
    - Handles mixed-type arrays with union types `(number | string | boolean)[]` and heterogeneous object arrays with optional property markers `?`.
  - **JSON → Dart**:
    - Generates dependency-free Dart model classes with constructor, factory `fromJson(Map<String, dynamic> json)`, and `Map<String, dynamic> toJson()`.
    - Sanitizes property keys into valid camelCase field names while preserving original JSON keys during serialization.
    - Distinguishes `int`, `double`, and `num`. Handles nullability (`String?`, `dynamic`) based on observed sample data.
  - **JSON → JSON Schema**:
    - Generates standard JSON Schema Draft 2020-12 (`https://json-schema.org/draft/2020-12/schema`).
    - Infers primitive types, integer vs number distinctions, objects with `properties` and `required` arrays, and arrays with homogeneous `items` or heterogeneous `anyOf` unions.
- **Developer & Testing Tools (Phase 7)**:
  - **JSON Schema Validation**:
    - Validates JSON data against a local JSON Schema Draft 2020-12 compatible subset with zero network requests.
    - Supported keywords:
      - Types: `object`, `array`, `string`, `number`, `integer`, `boolean`, `null` (single or union arrays).
      - Object: `properties`, `required`, `additionalProperties` (boolean or schema), `minProperties`, `maxProperties`.
      - Array: `items`, `minItems`, `maxItems`, `uniqueItems`.
      - String: `minLength`, `maxLength`, `pattern`.
      - Number: `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`.
      - Composition: `anyOf`, `oneOf`, `allOf`.
      - Boolean schemas: `true` / `false`.
    - Limitations: `$ref` resolution and remote schemas are explicitly not supported in this offline browser subset.
    - Actionable error diagnostics: Itemized error reporting with JSONPath, keyword, expected condition, actual value, and copyable report.
  - **API Assertion Generator**:
    - Deterministically generates TypeScript `expect(...)` assertions for REST/JSON API response verification.
    - Configurable structure, types, values, array lengths, and sample limits.
  - **Playwright Assertion Generator**:
    - Generates Playwright API test snippets with response status verification (`expect(response.ok()).toBeTruthy()`) and JSON body assertions.
  - **Generic Test Assertions**:
    - Framework-agnostic test assertions (`ASSERT $.id EXISTS`, `ASSERT $.id TYPE number`, `ASSERT $.id EQUALS 42`).
  - **Mock JSON Generator**:
    - Deterministically generates mock data while preserving the schema and inferred types without hallucinating fake personal details.
    - Configurable strategies for strings, numbers, booleans, and array sampling.
  - **Expected vs Actual Workflow**:
    - Dedicated workflow comparing expected API contracts against live responses.
    - Reuses Phase 4 recursive structural diff engine to display change summaries (Added, Removed, Changed).
  - **Diff → Assertions**:
    - Generates targeted assertions enforcing the expected state for all detected response differences.
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
