import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), VitePWA({ registerType: 'autoUpdate', includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'], manifest: { name: '2UZ-FE Interactive Engine Atlas', short_name: 'Engine Atlas', description: 'Интерактивный технический атлас Toyota 2UZ-FE', theme_color: '#101215', background_color: '#101215', display: 'standalone', icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }] }, workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], maximumFileSizeToCacheInBytes: 3_000_000, navigateFallback: 'index.html', cleanupOutdatedCaches: true, clientsClaim: true, skipWaiting: true } })],
  build: { rollupOptions: { output: { manualChunks: { three: ['three'], viewer: ['@react-three/fiber', '@react-three/drei'] } } } },
});
