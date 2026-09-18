import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { defineConfig, type Plugin } from 'vite'

function jsonzeroPwaPlugin(): Plugin {
  return {
    name: 'jsonzero-pwa-plugin',
    apply: 'build',
    generateBundle(_options, bundle) {
      // Collect all emitted asset files
      const emittedFiles = Object.keys(bundle)

      const staticFiles = [
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/favicon.svg',
        '/icon-192.png',
        '/icon-512.png',
        '/icon-maskable.png',
      ]

      const assetUrls = Array.from(
        new Set([
          ...staticFiles,
          ...emittedFiles
            .filter((file) => !file.endsWith('.map') && file !== 'sw.js')
            .map((file) => (file.startsWith('/') ? file : `/${file}`)),
        ])
      )

      // Compute deterministic hash of all asset paths
      const hash = crypto
        .createHash('sha256')
        .update(assetUrls.sort().join('|'))
        .digest('hex')
        .slice(0, 10)

      const cacheName = `jsonzero-static-v1-${hash}`

      // Read service worker template from public/sw.js
      const swTemplatePath = resolve(process.cwd(), 'public/sw.js')
      const swTemplate = fs.readFileSync(swTemplatePath, 'utf-8')

      const finalSw = swTemplate
        .replace(
          /const CACHE_NAME = ['"][^'"]+['"]/,
          `const CACHE_NAME = ${JSON.stringify(cacheName)}`
        )
        .replace(
          /const PRECACHE_ASSETS = \[[\s\S]*?\]/,
          `const PRECACHE_ASSETS = ${JSON.stringify(assetUrls, null, 2)}`
        )

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: finalSw,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), jsonzeroPwaPlugin()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
})
