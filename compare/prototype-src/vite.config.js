import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Builds the v3 prototype into one self-contained HTML file (script, styles and fonts inlined).
export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  base: './',
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'out', emptyOutDir: true, assetsInlineLimit: 100000000 },
})
