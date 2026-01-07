import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

// If a service worker is registered on localhost:5173 from a previous run/project,
// it can incorrectly try to cache POST requests (breaking toggle/create/update).
// Unregister in dev to keep API calls consistent.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Note: unregistering does not immediately stop an already-controlling SW.
  // We clear caches and force a one-time reload to ensure the SW stops intercepting requests.
  const cleanupCount = Number(sessionStorage.getItem('ff_sw_cleanup_count') ?? '0')
  navigator.serviceWorker.getRegistrations().then(async (regs) => {
    if (regs.length === 0) return

    // Try to update to the current /sw.js (we ship a self-unregistering SW in public/sw.js).
    await Promise.all(regs.map((r) => r.update().catch(() => undefined)))
    await Promise.all(regs.map((r) => r.unregister().catch(() => undefined)))

    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }

    // Reload so the page is no longer controlled by the previous service worker.
    // We cap reload attempts to avoid loops in weird environments.
    if (cleanupCount < 2) {
      sessionStorage.setItem('ff_sw_cleanup_count', String(cleanupCount + 1))
      window.location.reload()
    }
  })
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing #root element')

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
