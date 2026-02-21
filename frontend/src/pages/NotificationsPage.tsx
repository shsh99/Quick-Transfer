import { useState, useEffect, useRef } from 'react'
import type { Notification } from '../types/api'

function NotificationsPage() {
  const [accountNumber, setAccountNumber] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const handleSubscribe = () => {
    if (!accountNumber.trim()) return
    if (eventSourceRef.current) eventSourceRef.current.close()

    const es = new EventSource(`/api/notifications/${accountNumber}/subscribe`)
    eventSourceRef.current = es

    es.onopen = () => setConnected(true)
    es.onmessage = (event) => {
      const notification: Notification = JSON.parse(event.data)
      setNotifications(prev => [notification, ...prev])
    }
    es.onerror = () => {
      setConnected(false)
      es.close()
    }
  }

  useEffect(() => {
    return () => { eventSourceRef.current?.close() }
  }, [])

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>실시간 알림</h2>
      <div className="card">
        <input
          placeholder="구독할 계좌번호"
          value={accountNumber}
          onChange={e => setAccountNumber(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSubscribe}>
          {connected ? '구독중' : 'SSE 구독'}
        </button>
        {connected && <span style={{ marginLeft: 8, color: '#10b981' }}>연결됨</span>}
      </div>

      {notifications.length === 0 && <div className="card" style={{ color: '#888' }}>알림이 없습니다</div>}

      {notifications.map((n, i) => (
        <div className="card" key={i}>
          <div style={{ fontWeight: 600, marginBottom: 4,
            color: n.type === 'TRANSFER_COMPLETED' ? '#10b981' : '#ef4444'
          }}>
            {n.type === 'TRANSFER_COMPLETED' ? '송금 완료' : '송금 실패'}
          </div>
          <div>{n.message}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            {new Date(n.timestamp).toLocaleString('ko-KR')}
          </div>
        </div>
      ))}
    </div>
  )
}

export default NotificationsPage
