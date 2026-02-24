import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { createAccount, getAllAccounts, getAccount } from '../api/accountApi'
import { useNotifications } from '../context/NotificationContext'
import type { Account } from '../types/api'

function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [ownerName, setOwnerName] = useState('')
  const [searchNumber, setSearchNumber] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [toast, setToast] = useState('')
  const { subscribe: sseSubscribe, accountNumber: subscribedAccount } = useNotifications()
  const autoSubscribedRef = useRef(false)

  useEffect(() => {
    getAllAccounts()
      .then(({ data }) => { if (data.success) setAccounts(data.data) })
      .catch(() => {})
      .finally(() => setLoadingAccounts(false))
  }, [])

  // 계좌가 로드되면 첫 번째 계좌로 자동 SSE 구독 (아직 구독 전일 때만)
  useEffect(() => {
    if (accounts.length > 0 && !subscribedAccount && !autoSubscribedRef.current) {
      autoSubscribedRef.current = true
      sseSubscribe(accounts[0].accountNumber)
    }
  }, [accounts, subscribedAccount, sseSubscribe])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handleCreate = async () => {
    if (!ownerName.trim()) return
    const { data } = await createAccount(ownerName)
    if (data.success) {
      setAccounts(prev => [...prev, data.data])
      setOwnerName('')
      setShowCreate(false)
      showToast(`${data.data.accountNumber} 계좌가 개설되었습니다`)
    }
  }

  const handleSearch = async () => {
    if (!searchNumber.trim()) return
    const { data } = await getAccount(searchNumber)
    if (data.success) {
      setAccounts(prev => {
        const exists = prev.find(a => a.accountNumber === data.data.accountNumber)
        return exists ? prev.map(a => a.accountNumber === data.data.accountNumber ? data.data : a) : [...prev, data.data]
      })
      setSearchNumber('')
      setShowSearch(false)
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

  return (
    <div className="page-enter">
      <header className="page-header">
        <h1 className="page-header__greeting">내 자산</h1>
        {accounts.length > 0 && (
          <p className="page-header__subtitle">총 {accounts.length}개의 계좌</p>
        )}
      </header>

      {/* 총 자산 히어로 카드 */}
      <div className="hero-card">
        <div className="hero-card__label">총 자산</div>
        <div className="hero-card__amount">
          {totalBalance.toLocaleString()}<span className="currency">원</span>
        </div>
        <div className="hero-card__sub">계좌 {accounts.length}개 보유</div>
      </div>

      {/* 빠른 액션 */}
      <div className="quick-actions">
        <button className="quick-action" onClick={() => setShowCreate(true)}>
          <span className="icon-circle icon-circle--primary">
            <span className="css-icon icon-bank" />
          </span>
          <span className="text">계좌 개설</span>
        </button>
        <Link to="/transfer" className="quick-action">
          <span className="icon-circle icon-circle--success">
            <span className="css-icon icon-send" />
          </span>
          <span className="text">송금</span>
        </Link>
        <button className="quick-action" onClick={() => setShowSearch(true)}>
          <span className="icon-circle icon-circle--warning">
            <span className="css-icon icon-search" />
          </span>
          <span className="text">계좌 조회</span>
        </button>
      </div>

      {/* 계좌 개설 바텀시트 */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title">새 계좌 개설</h2>
            <div className="input-group">
              <label>예금주명</label>
              <input
                placeholder="이름을 입력하세요"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" onClick={handleCreate}>계좌 개설하기</button>
          </div>
        </div>
      )}

      {/* 계좌 조회 바텀시트 */}
      {showSearch && (
        <div className="modal-overlay" onClick={() => setShowSearch(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title">계좌 조회</h2>
            <div className="input-group">
              <label>계좌번호</label>
              <input
                placeholder="예: 1000-0001"
                value={searchNumber}
                onChange={e => setSearchNumber(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" onClick={handleSearch}>조회하기</button>
          </div>
        </div>
      )}

      {/* 내 계좌 목록 */}
      {accounts.length > 0 && (
        <div className="card">
          <p className="section-title">내 계좌</p>
          {accounts.map(account => (
            <Link
              to={`/account/${account.accountNumber}`}
              className="list-item"
              key={account.accountNumber}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="account-avatar">
                {account.ownerName.charAt(0)}
              </div>
              <div className="list-content">
                <div className="title">{account.ownerName}</div>
                <div className="subtitle">{account.accountNumber}</div>
              </div>
              <div className="list-trailing">
                <div className="amount">
                  {Number(account.balance).toLocaleString()}원
                </div>
                <div className="text-sm text-muted">
                  {account.status === 'ACTIVE' ? '정상' : account.status}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 로딩 상태 - 스켈레톤 */}
      {loadingAccounts && accounts.length === 0 && (
        <div className="card">
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--heading" />
          <div className="flex items-center gap-3 mt-4">
            <div className="skeleton skeleton--avatar" />
            <div className="flex-col" style={{ flex: 1 }}>
              <div className="skeleton skeleton--text" />
              <div className="skeleton skeleton--text" style={{ width: '40%' }} />
            </div>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {!loadingAccounts && accounts.length === 0 && !showCreate && !showSearch && (
        <div className="empty-state">
          <div className="empty-state__icon">
            <span className="css-icon icon-bank" style={{ width: 28, height: 28 }} />
          </div>
          <div className="empty-state__title">등록된 계좌가 없습니다</div>
          <div className="empty-state__desc">계좌를 개설하거나 기존 계좌를 조회해보세요</div>
        </div>
      )}

      {/* 로컬 토스트 */}
      {toast && <div className="local-toast">{toast}</div>}
    </div>
  )
}

export default DashboardPage
