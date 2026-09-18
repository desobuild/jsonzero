# JSONZero Architecture

This document describes the high-level architecture, module design, Web Worker offloading, PWA offline capabilities, and testing strategy for JSONZero.

---

## 1. High-Level Architecture

JSONZero is designed as a **100% client-side Single-Page Application (SPA)** with zero backend, zero external API dependencies, and zero persistent user tracking.

```
+-------------------------------------------------------------------------+
|                               Browser                                   |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                          React UI                                 |  |
|  |   Header | Workbench Toggles | CodeEditor | Output / Result Panes |  |
|  +-------------------------------------------------------------------+  |
|                                 |                                       |
|                                 v                                       |
|  +-------------------------------------------------------------------+  |
|  |                  Feature Controllers & State                      |  |
|  |  (formatter, inspector, compare, transform, convert, testing)     |  |
|  +-------------------------------------------------------------------+  |
|             |                                             |             |
|  [Small Payloads < 100 KB]                   [Large Payloads >= 100 KB] |
|             v                                             v             |
|  +---------------------+                     +-----------------------+  |
|  | Shared Utilities    |                     | Dedicated Web Worker  |  |
|  | (Pure Synchronous)  |                     | (Off-Thread Pipeline) |  |
|  | `src/shared/json/`  |                     | `src/workers/`        |  |
|  +---------------------+                     +-----------------------+  |
|             |                                             |             |
|             +---------------------+-----------------------+             |
|                                   v                                     |
|                      +------------------------+                         |
|                      | Final Output in State  |                         |
|                      +------------------------+                         |
+-------------------------------------------------------------------------+
```

### Key Principles

1. **Client-Side Execution**: All processing occurs strictly in browser memory.
2. **Deterministic Outputs**: Given the same input, all algorithms produce identical outputs across environments.
3. **Graceful Degradation**: If an operation fails or an input document is invalid, the UI remains responsive, actionable errors are displayed, and raw input is never destroyed.

---

## 2. Feature Architecture

The codebase is organized into modular feature domains under `src/features/`, cleanly separated from reusable pure logic in `src/shared/`:

```
src/
├── features/
│   ├── formatter/     # Core formatting, minification, and indentation controls
│   ├── inspector/     # Tree View hierarchy, JSONPath query engine, structural statistics
│   ├── compare/       # Structural JSON diff engine and side-by-side comparison panes
│   ├── transform/     # Sort keys, flatten/unflatten, escape/unescape utilities
│   ├── convert/       # Table, CSV, TypeScript, Dart, and JSON Schema converters
│   └── testing/       # Schema validation, assertion generators, mock data, contract diff
├── shared/
│   ├── json/          # Pure, dependency-free JSON parsing, sorting, diffing, and formatting
│   ├── components/    # Reusable UI widgets (CodeEditor, Toolbar, ErrorDisplay, Modal)
│   └── hooks/         # Shared stateful hooks (useWorker, useTheme, useDebounce)
└── workers/           # Native Web Worker scripts, RPC dispatcher, and message protocols
```

### Feature Isolation

- **UI vs. Logic**: UI components handle user input, accessibility attributes, and responsive layout. They delegate heavy parsing and data manipulation to pure functions in `src/shared/json/` or to the worker pool.
- **Lazy Loading**: Route-level code splitting (`React.lazy` and `Suspense`) defers loading chunks for `InspectorWorkbench`, `CompareWorkbench`, `TransformWorkbench`, `ConvertWorkbench`, and `TestingWorkbench` until requested, keeping the initial bundle under 420 kB.

---

## 3. Web Worker Architecture

To guarantee 60fps UI responsiveness when processing large documents, JSONZero offloads compute-heavy operations to a dedicated background Web Worker.

### Offload Routing

- **Payloads < 100 KB**: Processed synchronously on the main thread to avoid thread messaging and serialization overhead.
- **Payloads >= 100 KB**: Routed to the native Web Worker via `useWorkerDispatcher`.

### Supported Worker Operations

The worker handles the following discrete tasks defined in `src/workers/types.ts`:
- `FORMAT`: JSON pretty-printing with 2 spaces, 4 spaces, or tabs
- `MINIFY`: Whitespace removal and token compaction
- `DIFF`: Structural comparison and key-order-invariant diff generation
- `SORT_KEYS`: Shallow and recursive lexicographical key sorting

### Cancellation & Fault Tolerance

- Each worker operation accepts an `AbortSignal`.
- If the user cancels an in-progress operation or enters new text while a background operation is calculating, the active worker instance is terminated via `worker.terminate()` and instantly recycled with a fresh worker instance.
- Long-running or infinite operations cannot hang the main UI thread.

---

## 4. Progressive Web App (PWA) Architecture

JSONZero functions as a fully offline-capable Progressive Web App.

### Core Components

1. **Web App Manifest (`public/manifest.webmanifest`)**: Provides metadata, standalone display mode, application theme colors, and icons (192px, 512px, maskable).
2. **Service Worker (`public/sw.js` and Vite Build Plugin)**:
   - Built dynamically during `npm run build` using `jsonzeroPwaPlugin` in `vite.config.ts`.
   - Computes a deterministic SHA-256 hash of all emitted static assets (`index.html`, JavaScript chunks, CSS files, self-hosted Geist fonts).
   - Generates a versioned cache namespace: `jsonzero-static-v1-<hash>`.
3. **Precaching & Fetch Strategy**:
   - **Install Phase**: Service worker precaches all essential application assets.
   - **Activate Phase**: Deletes any stale caches from previous build hashes.
   - **Fetch Phase**: Cache-first strategy for static application assets with network fallback.
4. **Strict User Privacy Guarantee**:
   - **Cache Storage only holds immutable application assets.**
   - **User JSON is never written to Cache Storage, `localStorage`, `sessionStorage`, or `indexedDB`.**

---

## 5. Testing Architecture

The project employs a multi-tiered testing strategy:

```
+-------------------------------------------------------------+
|                     E2E Tests (Playwright)                  |
|    68 tests covering full user journeys, offline PWA,       |
|    cross-browser behavior, and worker integration           |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                 Component Tests (Vitest + RTL)              |
|    Interactive behavior, keyboard navigation, ARIA states,  |
|    error displays, pagination, and accessibility audit      |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                 Unit Tests (Vitest Pure Logic)              |
|    Parsers, diff engines, serializers, formatters, schema   |
|    validators, and deterministic assertion generators       |
+-------------------------------------------------------------+
```

### Test Suites

- **Unit & Component Tests**: 388+ tests across 33 test files executed via `npm run test` with Vitest.
- **E2E Tests**: 68 Playwright tests executed via `npm run test:e2e` against production build previews (`http://localhost:4173`).
- **Performance Benchmarks**: Dedicated regression benchmark suite (`tests/performance/`) verifying timing thresholds for large documents.
- **Static Analysis**: ESLint 9 (`npm run lint`), TypeScript strict mode (`npm run typecheck`), and Prettier (`npm run format:check`).
