import { useState } from 'react'
import { useNotifications } from '../context/NotificationContext'

function NotificationsPage() {
  const { accountNumber: subscribedAccount, notifications, connected, subscribe } = useNotifications()
  const [inputAccount, setInputAccount] = useState(subscribedAccount)

  const handleSubscribe = () => {
    if (!inputAccount.trim()) return
    subscribe(inputAccount)
  }

  return (
    <div className="animate-fade">
      <p className="page-title">알림</p>

      {/* 구독 카드 */}
      <div className="card">
        <div className="flex items-center justify-between mb-8">
          <span className="section-title" style={{ margin: 0 }}>실시간 알림</span>
          {connected && (
            <span className="badge badge-success">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              연결됨
            </span>
          )}
        </div>
        <div className="input-group">
          <label>계좌번호</label>
          <input
            placeholder="알림을 받을 계좌번호"
            value={inputAccount}
            onChange={e => setInputAccount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
          />
        </div>
        <button
          className={`btn ${connected ? 'btn-secondary' : 'btn-primary'}`}
          onClick={handleSubscribe}
        >
          {connected ? '다른 계좌로 변경' : 'SSE 구독 시작'}
        </button>
      </div>

      {/* 알림 목록 */}
      {notifications.length > 0 && (
        <p className="section-title mt-16">알림 내역</p>
      )}

      {notifications.map((n, i) => {
        const isSuccess = n.type === 'TRANSFER_COMPLETED'
        return (
          <div className="notification-card" key={i}>
            <div className="list-icon" style={{
              background: isSuccess ? 'var(--success-bg)' : 'var(--danger-bg)',
              fontSize: 18,
            }}>
              {isSuccess ? '✅' : '❌'}
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex justify-between items-center">
                <span style={{ fontWeight: 700, fontSize: 14, color: isSuccess ? 'var(--success)' : 'var(--danger)' }}>
                  {isSuccess ? '송금 완료' : '송금 실패'}
                </span>
                <span className="text-sm text-muted">
                  {new Date(n.timestamp).toLocaleTimeString('ko-KR')}
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--gray-700)', marginTop: 4 }}>
                {n.message}
              </div>
              <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                {n.senderAccount} → {n.receiverAccount} · {Number(n.amount).toLocaleString()}원
              </div>
            </div>
          </div>
        )
      })}

      {/* 빈 상태 */}
      {notifications.length === 0 && (
        <div className="empty-state">
          <div className="icon">🔔</div>
          <div className="title">알림이 없습니다</div>
          <div className="desc">{connected ? '송금이 발생하면 여기에 표시됩니다' : '계좌번호를 입력하고 구독을 시작하세요'}</div>
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
