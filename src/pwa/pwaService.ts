/**
 * JSONZero — PWA Service Worker & Install Manager
 *
 * Coordinates service worker registration, update notifications,
 * offline status detection, and deferred PWA installation.
 * Zero telemetry, zero external network calls.
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export type PwaUpdateCallback = (
  registration: ServiceWorkerRegistration
) => void

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null
const installPromptListeners = new Set<
  (prompt: BeforeInstallPromptEvent | null) => void
>()

/**
 * Check if the application is currently running in standalone (installed) mode
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  const isStandaloneDisplay = window.matchMedia(
    '(display-mode: standalone)'
  ).matches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isIosStandalone = (window.navigator as any).standalone === true
  return isStandaloneDisplay || isIosStandalone
}

/**
 * Register global listeners for beforeinstallprompt
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredInstallPrompt = e as BeforeInstallPromptEvent
    installPromptListeners.forEach((listener) =>
      listener(deferredInstallPrompt)
    )
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    installPromptListeners.forEach((listener) => listener(null))
  })
}

/**
 * Subscribe to deferred install prompt state changes
 */
export function subscribeInstallPrompt(
  listener: (prompt: BeforeInstallPromptEvent | null) => void
): () => void {
  installPromptListeners.add(listener)
  listener(deferredInstallPrompt)
  return () => {
    installPromptListeners.delete(listener)
  }
}

/**
 * Trigger the captured PWA installation prompt
 */
export async function triggerInstallPrompt(): Promise<
  'accepted' | 'dismissed' | 'unavailable'
> {
  if (!deferredInstallPrompt) {
    return 'unavailable'
  }

  try {
    await deferredInstallPrompt.prompt()
    const choice = await deferredInstallPrompt.userChoice
    deferredInstallPrompt = null
    installPromptListeners.forEach((listener) => listener(null))
    return choice.outcome
  } catch {
    return 'unavailable'
  }
}

/**
 * Register Service Worker in supporting environments
 */
export function registerServiceWorker(
  options: { onUpdate?: PwaUpdateCallback } = {}
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null)
  }

  return navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      // Check for updates periodically or on page focus
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing
        if (!installingWorker) return

        installingWorker.addEventListener('statechange', () => {
          if (
            installingWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New content is available once old tabs close or user confirms
            if (options.onUpdate) {
              options.onUpdate(registration)
            }
          }
        })
      })

      return registration
    })
    .catch((err) => {
      console.warn('JSONZero service worker registration failed:', err)
      return null
    })
}

/**
 * Tell waiting worker to skip waiting and activate immediately
 */
export function activateWaitingWorker(
  registration: ServiceWorkerRegistration
): void {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }
}
