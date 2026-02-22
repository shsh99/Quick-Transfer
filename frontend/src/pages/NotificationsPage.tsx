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
    <div className="page-enter">
      <header className="page-header">
        <h1 className="page-header__greeting">알림</h1>
      </header>

      {/* 구독 카드 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="section-title" style={{ margin: 0 }}>실시간 알림</span>
          {connected && (
            <span className="badge badge--success">
              <span className="status-dot status-dot--connected" />
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
          {connected ? '다른 계좌로 변경' : '구독 시작'}
        </button>
      </div>

      {/* 알림 목록 */}
      {notifications.length > 0 && (
        <p className="section-title mt-4">알림 내역</p>
      )}

      {notifications.map((n, i) => {
        const isSuccess = n.type === 'TRANSFER_COMPLETED'
        return (
          <div
            className={`notification-card ${isSuccess ? 'notification-card--success' : 'notification-card--failed'}`}
            key={i}
          >
            <div className={`notification-icon ${isSuccess ? 'notification-icon--success' : 'notification-icon--failed'}`}>
              <span className={`css-icon ${isSuccess ? 'icon-check' : 'icon-close'}`} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex justify-between items-center">
                <span className={`text-bold text-sm ${isSuccess ? 'text-success' : 'text-danger'}`}>
                  {isSuccess ? '송금 완료' : '송금 실패'}
                </span>
                <span className="text-sm text-muted">
                  {new Date(n.timestamp).toLocaleTimeString('ko-KR')}
                </span>
              </div>
              <div className="text-sm mt-2" style={{ color: 'var(--gray-700)' }}>
                {n.message}
              </div>
              <div className="account-flow mt-2" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                <span>{n.senderAccount}</span>
                <span className="account-flow__arrow" />
                <span>{n.receiverAccount}</span>
                <span className="text-muted"> · {Number(n.amount).toLocaleString()}원</span>
              </div>
            </div>
          </div>
        )
      })}

      {/* 빈 상태 */}
      {notifications.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">
            <span className="css-icon nav-icon-bell" style={{ width: 28, height: 28 }} />
          </div>
          <div className="empty-state__title">알림이 없습니다</div>
          <div className="empty-state__desc">
            {connected ? '송금이 발생하면 여기에 표시됩니다' : '계좌번호를 입력하고 구독을 시작하세요'}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
