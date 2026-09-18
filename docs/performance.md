# JSONZero — Performance & Scalability Documentation

## Overview

JSONZero is designed as a privacy-first, client-side developer workbench. Phase 8 focuses on **large JSON performance, scalability, and bundle optimization**, ensuring JSONZero remains responsive and predictable as JSON documents scale from kilobytes to tens of megabytes, while substantially reducing the initial JavaScript footprint.

---

## 1. Bundle Optimization & Code Splitting

### Measurement Before vs. After

| Metric | Phase 7 Baseline | Phase 8 Optimized | Improvement |
| :--- | :--- | :--- | :--- |
| **Initial JS Bundle** | 594.91 kB raw | 414.84 kB raw | **-180.07 kB (-30.3%)** |
| **Initial JS (Gzip)** | 168.14 kB gzip | 129.67 kB gzip | **-38.47 kB (-22.9%)** |
| **CSS Bundle** | 107.75 kB (50.18 kB gzip) | 109.68 kB (50.34 kB gzip) | +1.9 kB (performance UI) |
| **Production Build Time** | ~1.42 s | ~1.39 s | Instantaneous |

### Code-Splitting Architecture

Rather than shipping all feature workbenches in a monolithic entry chunk, JSONZero dynamically splits non-core features using React `Suspense` and `React.lazy()`:

* **Initial Core Shell + Formatter**: Eagerly loaded (`index.js` ~414 kB). Users opening JSONZero get instant formatting, minification, validation, and status reporting.
* **Inspector Workbench**: Code-split into dedicated lazy chunk (`Inspector-*.js` ~38.7 kB).
* **Compare / Diff Workbench**: Code-split into dedicated lazy chunk (`CompareWorkbench-*.js` ~22.6 kB).
* **Transform Workbench**: Code-split into dedicated lazy chunk (`TransformWorkbench-*.js` ~28.0 kB).
* **Convert Workbench**: Code-split into dedicated lazy chunk (`ConvertWorkbench-*.js` ~53.8 kB).
* **Developer & Testing Workbench**: Code-split into dedicated lazy chunk (`TestingWorkbench-*.js` ~79.2 kB).

Every lazy boundary features an accessible, non-flashing loading fallback (`WorkbenchLoadingFallback`) ensuring seamless transitions without layout jumps or unhandled import errors.

---

## 2. Benchmark Infrastructure & Methodology

### Dataset Profiles

Located in `tests/performance/benchmark-generators.ts`, deterministic synthetic generators produce structured datasets across varying scales and topologies without external APIs, uncontrolled random values, or network calls:

1. **Small (~1 KB)**: Lightweight nested structure (~1.3 KB).
2. **Medium (~100 KB)**: 350-item product catalog (~100.8 KB).
3. **Large (~1 MB)**: 3,500-item transactional record stream (~1.01 MB).
4. **Very Large (~5 MB)**: 17,500-item enterprise dataset (~5.04 MB).
5. **Stress (~10 MB+)**: 35,000-item stress payload (~10.08 MB).
6. **Structural Topologies**:
   * **Deep Object**: 50 levels of nested objects.
   * **Wide Object**: 1,000 sibling properties.
   * **Large Array**: 5,000 array elements.
   * **Heterogeneous Array**: 1,000 items with differing fields and missing keys.
   * **Mixed Structure**: Nested hierarchy combining arrays, sub-objects, booleans, and nulls.

### Pure Engine Benchmark Results (Node.js / V8 environment)

| Operation | 1 KB | 100 KB | 1 MB | 5 MB | 10 MB+ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Parse & Validate** | < 0.1 ms | ~0.4 ms | ~4.5 ms | ~24 ms | ~50 ms |
| **Format (2 spaces)** | < 0.1 ms | ~1.1 ms | ~11 ms | ~58 ms | ~120 ms |
| **Minify** | < 0.1 ms | ~0.3 ms | ~3.8 ms | ~20 ms | ~42 ms |
| **Structure Statistics** | < 0.1 ms | ~1.8 ms | ~18 ms | ~92 ms | ~185 ms |
| **Structural Diff** | < 0.1 ms | ~4.2 ms | ~42 ms | ~215 ms | ~440 ms |
| **JSONPath Query** | < 0.1 ms | ~0.8 ms | ~7.2 ms | ~35 ms | ~72 ms |
| **Recursive Sort** | < 0.1 ms | ~3.1 ms | ~34 ms | ~170 ms | ~355 ms |
| **Flatten** | < 0.1 ms | ~5.8 ms | ~62 ms | ~310 ms | ~640 ms |
| **Unflatten** | < 0.1 ms | ~7.2 ms | ~75 ms | ~380 ms | ~790 ms |
| **API Assertions** | < 0.1 ms | ~1.4 ms | ~14 ms | ~70 ms | ~145 ms |

*Measurements recorded on standard developer workstation. Execution times reflect pure algorithmic processing and linear scaling with zero catastrophic backtracking.*

---

## 3. Web Worker Architecture

### Worker Protocol & Boundary

Worker operations run off the main browser UI thread in a native Web Worker (`src/workers/json.worker.ts`). Communication uses a strictly-typed message protocol (`src/workers/types.ts`):

```typescript
// Request
interface WorkerRequest<T = unknown> {
  id: string
  operation: WorkerOperationType
  payload: T
}

// Response
interface WorkerResponse<T = unknown> {
  id: string
  success: boolean
  result?: T
  error?: string
}
```

Supported whitelisted operations:
* `parse`
* `format`
* `minify`
* `stats`
* `diff`
* `jsonpath`
* `sort`
* `flatten`
* `unflatten`
* `generateAssertions`
* `validateSchema`

### Direct Synchronous vs. Worker Routing Threshold

* **Threshold: 100 KB (102,400 characters)**:
  * Payloads `< 100 KB`: Handled **directly and synchronously** on the main thread. This avoids the serialization and inter-thread postMessage transfer overhead for small JSON documents where UI response time is sub-millisecond.
  * Payloads `>= 100 KB`: Automatically routed to the Web Worker. The main thread immediately receives an asynchronous handle, displays non-blocking processing indicators, and avoids browser UI freezing.

### Cancellation and Error Recovery

1. **Cancellation**: If a long-running operation is superseded or explicitly cancelled by the user via the `Cancel` action:
   * The active worker instance is terminated immediately via `worker.terminate()`.
   * Pending promises are rejected with `'Operation cancelled'`.
   * A fresh replacement worker is lazily spawned for subsequent requests.
2. **Error Recovery**:
   * Worker failures (e.g. malformed JSON syntax, out-of-memory limits) are caught cleanly inside the worker dispatcher and returned as `{ success: false, error: string }`.
   * If a worker crashes uncaught (`onerror`), the client rejects the pending request, terminates the faulty worker, and instantiates a clean worker.
   * The UI cleanly resets the `isProcessing` state, displays an actionable error notification, and never leaves the user stuck in an indefinite loading state.

---

## 4. Large JSON Editor Performance

JSONZero retains its native lightweight `textarea`/`pre`/`code` architecture rather than injecting heavy dependencies (such as Monaco or CodeMirror, which add 2-4 MB of bundle weight):

1. **Selective Syntax Highlighting Bypass**:
   * For documents exceeding **150 KB** or **2,500 lines**, full-DOM HTML syntax highlighting is automatically bypassed.
   * In this high-performance mode, the background `<pre><code>` container is disabled and the `<textarea>` renders directly using the theme's primary text color.
   * A subtle badge (`High-performance mode: syntax styling disabled for fast editing`) informs the user. Native typing, selection, and scrolling remain 60fps even on multi-megabyte payloads.
2. **Gutter Line Number Virtualization**:
   * For files with more than **1,000 lines**, gutter line rendering is bounded to a window of visible lines centered on the scroll position, preventing the DOM from allocating tens of thousands of `<span>` elements.

---

## 5. Tree View Windowing & Large Array Scalability

In the Tree View inspector (`src/features/inspector/components/JsonTreeNode.tsx`), large arrays and objects no longer render unlimited DOM nodes:

1. **Windowed Node Rendering**:
   * Arrays and objects with more than **50 items** initially render only the first 50 entries.
   * A footer control announces: `Showing 1–50 of N items` alongside an accessible `Show next 50` button and a `Show all` option.
2. **Smart Search Auto-Expansion**:
   * When an in-tree search query is active, the windowing boundary automatically expands to include all matching children so that search matches are never hidden or skipped.
3. **Array Count Badge**:
   * Arrays and objects clearly display their size badge (`[10,000 items]`, `{500 keys}`) before and after expansion.

---

## 6. Table Virtualization & Full Dataset Preservation

In the JSON → Table conversion workbench (`src/features/convert/components/ConvertTable.tsx`):

1. **Paged Table View**:
   * When receiving large datasets, the DOM renders a maximum of **50 rows per page**.
   * Accessible pagination controls (`Previous Page`, `Next Page`, `Rows X–Y of Z`) allow rapid navigation without browser layout degradation.
2. **Lossless Full Exports**:
   * The `Copy Table (TSV)` button, CSV conversion, and file download mechanisms export the **complete, un-truncated dataset**, ensuring pagination remains purely a rendering optimization that never modifies or clips output data.

---

## 7. Known Browser Limitations

1. **V8 String Length Limit**: JavaScript engines enforce maximum string limits (e.g. 512 MB in 64-bit V8, 256 MB in 32-bit). Documents approaching or exceeding these limits will fail natively during `JSON.parse` or `JSON.stringify`.
2. **Mobile Browser Memory Limits**: Mobile browsers (iOS Safari, mobile Chrome) typically limit single-tab memory allocation to ~1-2 GB. Payloads above ~20-30 MB may cause memory pressure or tab reloads on lower-end devices.
3. **Worker Structured Clone Overhead**: While Web Workers prevent UI thread blocking, passing multi-megabyte strings to and from workers requires serializing data across the thread boundary. For payloads above 25 MB, this serialization cost may add 50-150 ms of postMessage latency.
