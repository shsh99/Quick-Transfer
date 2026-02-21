import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createAccount, getAllAccounts, getAccount } from '../api/accountApi'
import type { Account } from '../types/api'

function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [ownerName, setOwnerName] = useState('')
  const [searchNumber, setSearchNumber] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    getAllAccounts()
      .then(({ data }) => { if (data.success) setAccounts(data.data) })
      .catch(() => {})
      .finally(() => setLoadingAccounts(false))
  }, [])

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
    <div className="animate-fade">
      <p className="page-title">내 자산</p>

      {/* 총 자산 히어로 카드 */}
      <div className="card-hero">
        <div className="label">총 자산</div>
        <div className="balance">{totalBalance.toLocaleString()}원</div>
        <div className="account-number">계좌 {accounts.length}개</div>
      </div>

      {/* 빠른 액션 */}
      <div className="quick-actions">
        <button className="quick-action" onClick={() => setShowCreate(true)}>
          <span className="icon" style={{ background: '#e8f0fe' }}>🏦</span>
          <span className="text">계좌 개설</span>
        </button>
        <Link to="/transfer" className="quick-action">
          <span className="icon" style={{ background: '#e8faf0' }}>💸</span>
          <span className="text">송금</span>
        </Link>
        <button className="quick-action" onClick={() => setShowSearch(true)}>
          <span className="icon" style={{ background: '#fff8e6' }}>🔍</span>
          <span className="text">계좌 조회</span>
        </button>
      </div>

      {/* 계좌 개설 모달 */}
      {showCreate && (
        <div className="card animate-slide">
          <div className="flex justify-between items-center mb-8">
            <span className="section-title" style={{ margin: 0 }}>새 계좌 개설</span>
            <button className="btn btn-sm btn-outline" onClick={() => setShowCreate(false)}>닫기</button>
          </div>
          <div className="input-group">
            <label>예금주명</label>
            <input
              placeholder="이름을 입력하세요"
              value={ownerName}
              onChange={e => setOwnerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>계좌 개설하기</button>
        </div>
      )}

      {/* 계좌 조회 모달 */}
      {showSearch && (
        <div className="card animate-slide">
          <div className="flex justify-between items-center mb-8">
            <span className="section-title" style={{ margin: 0 }}>계좌 조회</span>
            <button className="btn btn-sm btn-outline" onClick={() => setShowSearch(false)}>닫기</button>
          </div>
          <div className="input-group">
            <label>계좌번호</label>
            <input
              placeholder="예: 1000-0001"
              value={searchNumber}
              onChange={e => setSearchNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>조회하기</button>
        </div>
      )}

      {/* 내 계좌 목록 */}
      {accounts.length > 0 && (
        <div className="card">
          <p className="section-title">내 계좌</p>
          {accounts.map(account => (
            <div className="list-item" key={account.accountNumber}>
              <div className="list-icon" style={{ background: '#e8f0fe' }}>🏦</div>
              <div className="list-content">
                <div className="title">{account.ownerName}</div>
                <div className="subtitle">{account.accountNumber}</div>
              </div>
              <div className="list-trailing">
                <div className="amount" style={{ color: '#191f28' }}>
                  {Number(account.balance).toLocaleString()}원
                </div>
                <div className="text-sm text-muted">
                  {account.status === 'ACTIVE' ? '정상' : account.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 로딩 상태 */}
      {loadingAccounts && accounts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div className="animate-pulse" style={{ fontSize: 32 }}>🏦</div>
          <p className="text-muted mt-8">계좌 정보를 불러오는 중...</p>
        </div>
      )}

      {/* 빈 상태 */}
      {!loadingAccounts && accounts.length === 0 && !showCreate && !showSearch && (
        <div className="empty-state">
          <div className="icon">💳</div>
          <div className="title">등록된 계좌가 없습니다</div>
          <div className="desc">계좌를 개설하거나 기존 계좌를 조회해보세요</div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="toast animate-slide">{toast}</div>
      )}
    </div>
  )
}

export default DashboardPage
