import { useEffect, useState } from 'react'
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const updateOnline = () => setOnline(true)
    const updateOffline = () => setOnline(false)

    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOffline)

    // fallback ping
    const interval = setInterval(async () => {
      try {
        await fetch('/favicon.svg', { cache: 'no-store' })
        setOnline(true)
      } catch {
        setOnline(false)
      }
    }, 10000)

    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOffline)
      clearInterval(interval)
    }
  }, [])

  return online
}