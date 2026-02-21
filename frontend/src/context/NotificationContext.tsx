import { createContext, useContext, useState, useRef, useCallback } from 'react'
import type { Notification } from '../types/api'

interface NotificationState {
  accountNumber: string
  notifications: Notification[]
  connected: boolean
  subscribe: (accountNumber: string) => void
  disconnect: () => void
}

const NotificationContext = createContext<NotificationState | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [accountNumber, setAccountNumber] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnected(false)
  }, [])

  const subscribe = useCallback((account: string) => {
    if (!account.trim()) return
    disconnect()

    const es = new EventSource(`/api/notifications/${account}/subscribe`)
    eventSourceRef.current = es
    setAccountNumber(account)

    es.addEventListener('connect', () => setConnected(true))
    es.addEventListener('notification', (event) => {
      const notification: Notification = JSON.parse(event.data)
      setNotifications(prev => [notification, ...prev])
    })
    es.onerror = () => {
      setConnected(false)
      es.close()
      eventSourceRef.current = null
    }
  }, [disconnect])

  return (
    <NotificationContext.Provider value={{ accountNumber, notifications, connected, subscribe, disconnect }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
