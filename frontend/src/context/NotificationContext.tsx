import { createContext, useContext, useState, useRef, useCallback } from 'react'
import type { Notification } from '../types/api'

interface NotificationState {
  accountNumber: string
  notifications: Notification[]
  connected: boolean
  toast: Notification | null
  subscribe: (accountNumber: string) => void
  disconnect: () => void
  dismissToast: () => void
}

const NotificationContext = createContext<NotificationState | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [accountNumber, setAccountNumber] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [connected, setConnected] = useState(false)
  const [toast, setToast] = useState<Notification | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accountRef = useRef('')

  const dismissToast = useCallback(() => setToast(null), [])

  const cleanupRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }, [])

  const disconnect = useCallback(() => {
    cleanupRetry()
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnected(false)
  }, [cleanupRetry])

  const connectSSE = useCallback((account: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    const es = new EventSource(`/api/notifications/${account}/subscribe`)
    eventSourceRef.current = es

    es.addEventListener('connect', () => setConnected(true))

    es.addEventListener('notification', (event) => {
      const notification: Notification = JSON.parse(event.data)
      setNotifications(prev => [notification, ...prev])
      setToast(notification)
      setTimeout(() => setToast(null), 4000)
    })

    es.onerror = () => {
      setConnected(false)
      es.close()
      eventSourceRef.current = null
      // 3초 후 재연결 시도
      cleanupRetry()
      retryTimerRef.current = setTimeout(() => {
        if (accountRef.current) {
          connectSSE(accountRef.current)
        }
      }, 3000)
    }
  }, [cleanupRetry])

  const subscribe = useCallback((account: string) => {
    if (!account.trim()) return
    disconnect()
    accountRef.current = account
    setAccountNumber(account)
    connectSSE(account)
  }, [disconnect, connectSSE])

  return (
    <NotificationContext.Provider value={{ accountNumber, notifications, connected, toast, subscribe, disconnect, dismissToast }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
