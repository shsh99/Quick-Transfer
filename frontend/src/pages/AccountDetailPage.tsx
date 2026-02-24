import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAccount, getTransactions } from '../api/accountApi'
import type { Account, TransactionLog } from '../types/api'

const TX_CONFIG: Record<string, { icon: string; iconClass: string; amountClass: string; label: string }> = {
  DEBIT:    { icon: '↓', iconClass: 'tx-icon--debit',    amountClass: 'amount--debit',    label: '출금' },
  CREDIT:   { icon: '↑', iconClass: 'tx-icon--credit',   amountClass: 'amount--credit',   label: '입금' },
  ROLLBACK: { icon: '↩', iconClass: 'tx-icon--rollback', amountClass: 'amount--rollback', label: '롤백' },
}

function AccountDetailPage() {
  const { accountNumber } = useParams<{ accountNumber: string }>()
  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<TransactionLog[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountNumber) return
    const load = async () => {
      const [accRes, txRes] = await Promise.all([
        getAccount(accountNumber),
        getTransactions(accountNumber, 0),
      ])
      if (accRes.data.success) setAccount(accRes.data.data)
      if (txRes.data.success) {
        setTransactions(txRes.data.data.content)
        setHasMore(!txRes.data.data.last)
      }
      setLoading(false)
    }
    load()
  }, [accountNumber])

  const loadMore = async () => {
    if (!accountNumber) return
    const nextPage = page + 1
    const { data } = await getTransactions(accountNumber, nextPage)
    if (data.success) {
      setTransactions(prev => [...prev, ...data.data.content])
      setHasMore(!data.data.last)
      setPage(nextPage)
    }
  }

  if (loading) {
    return (
      <div className="page-enter">
        <Link to="/dashboard" className="back-link">대시보드</Link>
        <div className="skeleton skeleton--card" />
        <div className="card">
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--heading" />
          <div className="skeleton skeleton--text" />
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="page-enter">
        <Link to="/dashboard" className="back-link">대시보드</Link>
        <div className="empty-state">
          <div className="empty-state__title">계좌를 찾을 수 없습니다</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <Link to="/dashboard" className="back-link">대시보드</Link>

      {/* 계좌 정보 히어로 */}
      <div className="hero-card">
        <div className="hero-card__label">{account.ownerName}</div>
        <div className="hero-card__amount">
          {Number(account.balance).toLocaleString()}<span className="currency">원</span>
        </div>
        <div className="hero-card__sub">{account.accountNumber}</div>
      </div>

      {/* 거래 내역 */}
      <div className="card">
        <p className="section-title">거래 내역</p>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <span className="css-icon icon-clipboard" style={{ width: 28, height: 28 }} />
            </div>
            <div className="empty-state__title">거래 내역이 없습니다</div>
            <div className="empty-state__desc">송금을 하면 여기에 표시됩니다</div>
          </div>
        ) : (
          <>
            {transactions.map(tx => {
              const config = TX_CONFIG[tx.type] || TX_CONFIG.DEBIT
              return (
                <div className="tx-item" key={tx.id}>
                  <div className={`tx-icon ${config.iconClass}`}>
                    {config.icon}
                  </div>
                  <div className="tx-body">
                    <div className="title">
                      {tx.description || config.label}
                    </div>
                    <div className="subtitle">
                      {new Date(tx.createdAt).toLocaleString('ko-KR')}
                      {tx.transferId && ` · ${tx.transferId.substring(0, 8)}...`}
                    </div>
                  </div>
                  <div className="tx-trailing">
                    <div className={`amount ${config.amountClass}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{Number(tx.amount).toLocaleString()}원
                    </div>
                    <div className="balance">
                      잔액 {Number(tx.balanceAfter).toLocaleString()}원
                    </div>
                  </div>
                </div>
              )
            })}
            {hasMore && (
              <button className="btn-load-more" onClick={loadMore}>
                더 보기
              </button>
            )}
          </>
        )}
      </div>

      {/* 빠른 액션 */}
      <div className="mt-4">
        <Link to="/transfer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          이 계좌에서 송금하기
        </Link>
      </div>
    </div>
  )
}

export default AccountDetailPage
