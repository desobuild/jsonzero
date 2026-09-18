import { useState, useEffect, useCallback } from 'react'
import {
  isStandaloneMode,
  subscribeInstallPrompt,
  triggerInstallPrompt,
  registerServiceWorker,
  activateWaitingWorker,
  type BeforeInstallPromptEvent,
} from './pwaService'

export interface UsePwaReturn {
  isOnline: boolean
  canInstall: boolean
  isStandalone: boolean
  isUpdateAvailable: boolean
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
  applyUpdate: () => void
}

export function usePwa(): UsePwaReturn {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [canInstall, setCanInstall] = useState<boolean>(false)
  const [isStandalone, setIsStandalone] = useState<boolean>(() =>
    isStandaloneMode()
  )
  const [waitingRegistration, setWaitingRegistration] =
    useState<ServiceWorkerRegistration | null>(null)

  // Listen for online/offline connectivity changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Listen for install prompt availability
  useEffect(() => {
    const unsubscribe = subscribeInstallPrompt(
      (prompt: BeforeInstallPromptEvent | null) => {
        setCanInstall(!!prompt && !isStandaloneMode())
      }
    )
    setIsStandalone(isStandaloneMode())
    return unsubscribe
  }, [])

  // Register service worker in production / browser environment
  useEffect(() => {
    registerServiceWorker({
      onUpdate: (registration) => {
        setWaitingRegistration(registration)
      },
    })
  }, [])

  const install = useCallback(async () => {
    const result = await triggerInstallPrompt()
    if (result === 'accepted') {
      setCanInstall(false)
    }
    return result
  }, [])

  const applyUpdate = useCallback(() => {
    if (waitingRegistration) {
      activateWaitingWorker(waitingRegistration)
      window.location.reload()
    }
  }, [waitingRegistration])

  return {
    isOnline,
    canInstall,
    isStandalone,
    isUpdateAvailable: !!waitingRegistration,
    install,
    applyUpdate,
  }
}
