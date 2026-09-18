# JSONZero Privacy & Data Model

JSONZero is built around an uncompromising privacy commitment: **JSON. Zero clutter. Zero tracking.**

This document details exactly how data is processed, what is stored, what is transmitted, and how the application guarantees confidentiality.

---

## 1. Summary of Guarantees

| Metric | Status |
| ------ | ------ |
| **Server-side JSON Processing** | **None (0%)** |
| **Telemetry / Analytics Trackers** | **None (0%)** |
| **User Accounts / Authentication** | **None (0%)** |
| **External CDN Requests** | **None (0%)** |
| **User JSON Storage** | **None (In-memory only)** |

---

## 2. Data Flow & Local Processing

When you format, inspect, compare, transform, or convert JSON in JSONZero:

```
[User Input]
     │
     ▼
[Browser Memory (RAM)]
     │
     ├── Small Payloads (< 100 KB) ──► Main Thread Pure Utilities
     │                                           │
     └── Large Payloads (>= 100 KB) ─► Native In-Browser Web Worker
                                                 │
                                                 ▼
                                        [Formatted / Output JSON]
                                                 │
                                                 ▼
                                     [Rendered on Screen]
```

- **In-Memory Only**: User JSON resides exclusively in browser application state (RAM).
- **No Uploads**: No network requests are initiated when processing JSON.
- **Immediate Discard**: Navigating away or closing the browser tab immediately frees the JSON payload from memory.

---

## 3. Storage Model

### What Is Stored
- **Theme Preference**: The chosen visual mode (`light` or `dark`) is stored in `localStorage` under `jsonzero-theme` so your preference persists across sessions.

### What Is NOT Stored
- **User JSON**: User input, formatted output, transformed structures, diff results, and query results are **never** persisted to `localStorage`, `sessionStorage`, `indexedDB`, cookies, or file system storage.
- **Session History**: No history of previously opened documents or queries is tracked or persisted.

---

## 4. Service Worker & Caching

JSONZero uses a native Service Worker (`sw.js`) to enable offline capabilities:
- **Application Assets Only**: The service worker caches static assets required to run the app offline (`index.html`, JavaScript chunks, CSS stylesheets, icons, self-hosted Geist fonts).
- **No Data Caching**: The service worker does not intercept, log, or cache user payloads. It operates strictly as a static asset cache (`Cache Storage`).
- **Cache Invalidation**: Each build produces a deterministic hash based on asset contents (`jsonzero-static-v1-<hash>`). Old asset caches are purged automatically on activation.

---

## 5. Network Traffic Audit

During normal operation:
- **Total Network Requests for JSON operations**: `0`
- **Total Analytics Beacons**: `0`
- **Third-Party Fonts or Scripts**: `0` (Geist Sans and Geist Mono are bundled and self-hosted).

You can verify this at any time:
1. Open your browser's Developer Tools (`F12` or `Ctrl+Shift+I`).
2. Navigate to the **Network** tab.
3. Paste JSON, format it, compare it, run diffs or transforms.
4. Observe that **zero network requests** are sent during any JSON operation.
