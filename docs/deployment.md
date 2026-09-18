# JSONZero Deployment Guide

JSONZero is a static Single-Page Application (SPA) designed to run on any modern static web host.

---

## 1. Primary Target: Cloudflare Pages

JSONZero is optimized for direct hosting on [Cloudflare Pages](https://pages.cloudflare.com/).

### Build Configuration

| Setting | Value |
| ------- | ----- |
| **Framework preset** | `None` / `Vite` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` |
| **Node.js version** | `20` (or `22`) |

### Environment Variables

- **None required**: JSONZero contains no runtime backend API keys, secrets, or remote endpoints.

### Single-Page Application (SPA) Routing

Since JSONZero uses client-side routing, all non-file route requests should resolve to `index.html`. On Cloudflare Pages, this is handled automatically for SPAs.

### Preview Deployments

- Cloudflare Pages automatically creates unique preview deployment URLs for every pull request opened against `main`.
- Previews build identically to production and can be used to verify visual behavior and offline service worker activation before merging.

---

## 2. Progressive Web App (PWA) Requirements

To ensure Service Worker and PWA installation function correctly in production:

1. **HTTPS is Mandatory**: Service Workers require a secure HTTPS origin (or `localhost` for local development). Cloudflare Pages provides automatic SSL/TLS termination.
2. **MIME Types**: Ensure static hosts serve:
   - `manifest.webmanifest` as `application/manifest+json`
   - `sw.js` as `application/javascript` with appropriate Cache-Control headers (e.g. `Cache-Control: no-cache` so browser checks for updates).
3. **Asset Caching**: Hashed assets in `dist/assets/` can be cached immutably with long TTLs (`max-age=31536000, immutable`).

---

## 3. Alternative Static Hosts

JSONZero is 100% portable and can be deployed to any static file hosting service:

- **Netlify**:
  - Build command: `npm run build`
  - Publish directory: `dist`
- **Vercel**:
  - Build command: `npm run build`
  - Output directory: `dist`
- **GitHub Pages**:
  - Deploy contents of `dist/` branch or via GitHub Actions workflow.
- **Static Nginx / Caddy / Apache**:
  - Point root directory to `dist/`.
  - Configure fallback: `try_files $uri $uri/ /index.html;`.

---

## 4. Local Production Preview

To test the exact production build locally:

```bash
npm run build
npm run preview
```

The preview server runs at `http://localhost:4173` with service worker registration and asset caching fully functional.
