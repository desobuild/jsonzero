# JSONZero — Progressive Web App (PWA) & Offline Documentation

## Overview

JSONZero is designed from the ground up as a **local-first, privacy-first developer workbench**. Phase 9 implements native Progressive Web App (PWA) installation and comprehensive offline capabilities while strictly preserving JSONZero's core guarantee:

> **All JSON processing remains in memory within your browser. User JSON is never uploaded, never intercepted, never transmitted, and never written to persistent service worker caches.**

---

## 1. Architecture & Design

JSONZero adopts a **zero-dependency, native service worker architecture**:

```
+---------------------------------------------------------------------------------+
|                                 JSONZero PWA                                    |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Initial Online Visit                 Subsequent & Offline Visits               |
|                                                                                 |
|  1. Browser loads index.html          1. Service Worker intercepts request      |
|  2. sw.js registers & installs        2. Serves index.html from cache (0ms)     |
|  3. Precache manifest downloads:      3. Serves scripts, CSS, fonts, workers    |
|     - App shell (index.html)             from local Cache Storage               |
|     - All code-split chunks           4. React boots with full functionality    |
|     - Web Worker (json.worker.js)     5. User processes JSON offline            |
|     - Self-hosted Geist fonts                                                   |
|     - Icons & manifest.webmanifest                                              |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

### Key Architectural Tenets
1. **Zero External Dependencies**: Built with native standard Service Worker and Web App Manifest specifications without third-party PWA wrapper libraries.
2. **Build-Time Precache Generation**: A custom Vite plugin (`jsonzeroPwaPlugin` in `vite.config.ts`) scans Rollup's emitted bundle and injects the exact asset hashes and filenames directly into `sw.js`.
3. **Comprehensive Feature Pre-caching**: Not only `index.html` and the main bundle are precached, but all code-split feature chunks (`inspector`, `compare`, `transform`, `convert`, `testing`), the Web Worker (`json.worker.ts`), and self-hosted fonts are precached during installation.

---

## 2. Web App Manifest

The Web App Manifest is located at `public/manifest.webmanifest` and declared in `index.html`:

```json
{
  "name": "JSONZero",
  "short_name": "JSONZero",
  "description": "Privacy-first, client-side JSON developer workbench. Offline-capable, zero ads, zero telemetry, zero data collection.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#12131a",
  "theme_color": "#12131a",
  "categories": ["developer", "utilities", "productivity"],
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

### Application Icons
Application icons are self-hosted in `public/`:
- `public/icon-192.png`: 192x192 PNG for home screens, taskbars, and app switchers.
- `public/icon-512.png`: 512x512 PNG for high-DPI displays and splash screens.
- `public/icon-maskable.png`: 512x512 PNG with full bleed for adaptive Android launcher icons.
- `public/favicon.svg`: Vector icon matching the `{ }` JSONZero visual brand identity (`#12131A` background with `#68DBA9` accent brackets).

---

## 3. Service Worker & Caching Strategy

The service worker (`public/sw.js`, compiled to `dist/sw.js`) enforces strict boundary conditions:

### 1. Navigation Requests (HTML App Shell)
- **Strategy**: Cache-First with fallback to `/index.html` and `/`.
- When the user opens JSONZero, the service worker immediately matches the cached `index.html`.
- Startup is instantaneous and functions seamlessly when network access is severed.

### 2. Static Assets (JavaScript Chunks, Styles, Fonts, Icons)
- **Strategy**: Cache-First.
- Requests matching known hashed assets in `/assets/` or root static files are returned directly from Cache Storage.
- When an asset is fetched, it is cached under the active versioned cache key.

### 3. Strict Scope & Privacy Rules
- **Method Restriction**: Only `GET` requests are intercepted.
- **Origin Restriction**: Only same-origin requests matching `self.location.origin` are handled; third-party requests are ignored.
- **NEVER Cache User Data**: User input, generated files, converted schemas/tables, and clipboard payloads are never sent across the network or stored in the service worker cache.

---

## 4. Cache Versioning & Update Lifecycle

### Deterministic Versioning
The cache name is automatically derived at build time from the SHA-256 hash of all emitted bundle assets:
```
CACHE_NAME = "jsonzero-static-v1-[hash]"
```

### Obsolete Cache Cleanup
During the `activate` lifecycle event, the service worker purges all obsolete caches matching `jsonzero-` that do not match the current `CACHE_NAME`:
```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('jsonzero-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})
```

### Non-Disruptive Update UX
When a newer deployment is available:
1. The new service worker installs in the background.
2. It does **not** forcefully reload the tab or overwrite active user input.
3. The UI displays an unobtrusive notification banner:
   `A new version of JSONZero is available. [Update & Reload]`
4. Clicking **Update & Reload** posts `{ type: 'SKIP_WAITING' }` to the waiting worker and refreshes the browser cleanly.

---

## 5. Offline Capabilities

After initial load, all features of JSONZero function 100% offline:

| Feature Area | Supported Capabilities Offline | Offline Execution Mechanism |
| :--- | :--- | :--- |
| **Format** | Format, Minify, Validate, Indentation | Synchronous engine / Web Worker |
| **Inspect** | Search & Replace, Tree View, JSONPath, Statistics | Precached chunk (`inspector-*.js`) |
| **Compare** | Structural JSON Diff, Side-by-side view | Precached chunk (`compare-*.js`) |
| **Transform** | Sort Keys, Flatten, Unflatten, Escape/Unescape | Precached chunk (`transform-*.js`) |
| **Convert** | JSON to Table, CSV, TypeScript, Dart, JSON Schema | Precached chunk (`convert-*.js`) |
| **Testing** | Schema Validation, API/Playwright/Generic Assertions, Mock Data | Precached chunk (`testing-*.js`) |
| **Performance**| Large payload processing, syntax bypass mode | Precached Web Worker (`json.worker-*.js`) |
| **File I/O** | Open JSON (`<input type="file">`), Download (`Blob`) | Native browser memory & DOM APIs |

---

## 6. Install Experience & Offline Status Indicator

### User-Controlled Installation
- The `beforeinstallprompt` event is intercepted and retained in `src/pwa/pwaService.ts`.
- When supported by the browser and not already running in standalone mode, a discrete **Install App** button appears in the application header.
- Installation is never triggered automatically without explicit user interaction.

### Accessible Offline Indicator
In the bottom status bar (`StatusBar.tsx`):
- **Online**: Displays a subtle green dot with text `Online`.
- **Offline**: Displays an amber `WifiOff` icon with text `Offline`.
- Uses `role="status"` and `aria-live="polite"`.
- Status is color-independent: distinct visual icons and textual labels ensure full accessibility.

---

## 7. Privacy & Security Audit

1. **No External Requests**: A network interceptor audit during JSON processing verified 0 external HTTP requests.
2. **No Data Storage**: The service worker cache contains application code and assets only. User documents are held exclusively in browser memory.
3. **No Telemetry / Analytics**: Zero tracking scripts, cookies, or pingbacks.
4. **Secure Context Compliance**: Operates in standard HTTPS environments and `http://localhost` for development.

---

## 8. Known Browser Limitations

1. **iOS Safari PWA Limitations**: iOS supports adding to the Home Screen via the Share menu, but does not support the `beforeinstallprompt` programmatic install API. The header install button is hidden gracefully on iOS.
2. **Storage Quota & Eviction**: Browser storage management may evict offline caches under extreme storage pressure. JSONZero’s small footprint (~1.2 MB total) makes it highly resilient against cache eviction.
3. **Clipboard Permissions in Standalone Mode**: Chromium browsers may prompt for clipboard read permissions when using the Paste button in standalone window mode.

---

## 9. Cloudflare Pages Compatibility

JSONZero requires zero Node.js server runtime, no serverless functions, and no server-side rendering. The emitted `dist/` folder is a purely static bundle compatible with Cloudflare Pages, GitHub Pages, Netlify, or any static file host.
