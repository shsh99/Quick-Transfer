import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllAccounts } from '../api/accountApi'
import { getTransfers } from '../api/transferApi'
import type { Account, Transfer } from '../types/api'

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: '처리중', cls: 'badge--warning' },
  DEBITED: { label: '출금완료', cls: 'badge--info' },
  SUCCESS: { label: '완료', cls: 'badge--success' },
  FAILED:  { label: '실패', cls: 'badge--danger' },
}

function HistoryPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingTransfers, setLoadingTransfers] = useState(false)

  useEffect(() => {
    getAllAccounts()
      .then(({ data }) => {
        if (data.success && data.data.length > 0) {
          setAccounts(data.data)
          setSelectedAccount(data.data[0].accountNumber)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedAccount) return
    setLoadingTransfers(true)
    setPage(0)
    getTransfers(selectedAccount, 0)
      .then(({ data }) => {
        if (data.success) {
          setTransfers(data.data.content)
          setHasMore(!data.data.last)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTransfers(false))
  }, [selectedAccount])

  const loadMore = async () => {
    const nextPage = page + 1
    const { data } = await getTransfers(selectedAccount, nextPage)
    if (data.success) {
      setTransfers(prev => [...prev, ...data.data.content])
      setHasMore(!data.data.last)
      setPage(nextPage)
    }
  }

  return (
    <div className="page-enter">
      <header className="page-header">
        <h1 className="page-header__greeting">송금 내역</h1>
      </header>

      {/* 계좌 선택 */}
      {loading ? (
        <div className="skeleton skeleton--text" />
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <span className="css-icon icon-bank" style={{ width: 28, height: 28 }} />
          </div>
          <div className="empty-state__title">등록된 계좌가 없습니다</div>
          <div className="empty-state__desc">대시보드에서 계좌를 개설해주세요</div>
        </div>
      ) : (
        <>
          <select
            className="account-select"
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
          >
            {accounts.map(a => (
              <option key={a.accountNumber} value={a.accountNumber}>
                {a.ownerName} · {a.accountNumber} ({Number(a.balance).toLocaleString()}원)
              </option>
            ))}
          </select>

          {/* 로딩 */}
          {loadingTransfers && (
            <div className="card">
              <div className="skeleton skeleton--text" />
              <div className="skeleton skeleton--heading" />
              <div className="skeleton skeleton--text" />
            </div>
          )}

          {/* 송금 목록 */}
          {!loadingTransfers && transfers.length === 0 && (
            <div className="empty-state">
              <div className="empty-state__icon">
                <span className="css-icon icon-send" style={{ width: 28, height: 28 }} />
              </div>
              <div className="empty-state__title">송금 내역이 없습니다</div>
              <div className="empty-state__desc">이 계좌에서 보낸 송금이 없습니다</div>
            </div>
          )}

          {!loadingTransfers && transfers.map(t => {
            const badge = STATUS_BADGE[t.status] || STATUS_BADGE.PENDING
            return (
              <Link
                to={`/transfer/${t.transferId}`}
                className="transfer-card"
                key={t.transferId}
              >
                <div className="transfer-card__body">
                  <div className="transfer-card__row">
                    <span className="transfer-card__amount">
                      {Number(t.amount).toLocaleString()}원
                    </span>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <div className="transfer-card__flow">
                    <span className="account-flow">
                      <span>{t.senderAccount}</span>
                      <span className="account-flow__arrow" />
                      <span>{t.receiverAccount}</span>
                    </span>
                  </div>
                  <div className="transfer-card__date">
                    {new Date(t.createdAt).toLocaleString('ko-KR')}
                    {t.failReason && ` · ${t.failReason}`}
                  </div>
                </div>
              </Link>
            )
          })}

          {!loadingTransfers && hasMore && (
            <button className="btn-load-more" onClick={loadMore}>
              더 보기
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default HistoryPage
