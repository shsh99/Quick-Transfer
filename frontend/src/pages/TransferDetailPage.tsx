import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTransfer } from '../api/transferApi'
import type { Transfer } from '../types/api'

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; dotClass: string; heroClass: string }> = {
  PENDING:  { label: '처리중',   badgeClass: 'badge--warning', dotClass: 'timeline-dot--active',  heroClass: 'hero-card--pending' },
  DEBITED:  { label: '출금완료', badgeClass: 'badge--info',    dotClass: 'timeline-dot--active',  heroClass: 'hero-card--pending' },
  SUCCESS:  { label: '송금완료', badgeClass: 'badge--success', dotClass: 'timeline-dot--success', heroClass: 'hero-card--success' },
  FAILED:   { label: '실패',     badgeClass: 'badge--danger',  dotClass: 'timeline-dot--failed',  heroClass: 'hero-card--failed' },
}

function TransferDetailPage() {
  const { transferId } = useParams<{ transferId: string }>()
  const [transfer, setTransfer] = useState<Transfer | null>(null)

  useEffect(() => {
    if (!transferId) return
    const fetchTransfer = async () => {
      const { data } = await getTransfer(transferId)
      if (data.success) setTransfer(data.data)
    }
    fetchTransfer()
    const interval = setInterval(fetchTransfer, 2000)
    return () => clearInterval(interval)
  }, [transferId])

  if (!transfer) {
    return (
      <div className="page-enter">
        <header className="page-header">
          <h1 className="page-header__greeting">송금 상세</h1>
        </header>
        <div className="skeleton skeleton--card" />
        <div className="card">
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--heading" />
          <div className="skeleton skeleton--text" />
        </div>
      </div>
    )
  }

  const config = STATUS_CONFIG[transfer.status]
  const isTerminal = transfer.status === 'SUCCESS' || transfer.status === 'FAILED'
  const steps = [
    { key: 'PENDING', label: '송금 요청', desc: '송금 요청이 접수되었습니다' },
    { key: 'DEBITED', label: '출금 완료', desc: '출금 계좌에서 금액이 차감되었습니다' },
    { key: 'SUCCESS', label: '입금 완료', desc: '수취인 계좌에 입금되었습니다' },
  ]

  const currentIdx = steps.findIndex(s => s.key === transfer.status)

  const getDotClass = (idx: number) => {
    if (idx <= currentIdx) {
      return idx === currentIdx && !isTerminal ? 'timeline-dot--active' : 'timeline-dot--success'
    }
    return 'timeline-dot--pending'
  }

  const getIconForDot = (dotClass: string) => {
    if (dotClass === 'timeline-dot--success') return 'icon-check'
    if (dotClass === 'timeline-dot--failed') return 'icon-close'
    if (dotClass === 'timeline-dot--active') return 'icon-clock'
    return ''
  }

  return (
    <div className="page-enter">
      <header className="page-header">
        <h1 className="page-header__greeting">송금 상세</h1>
      </header>

      {/* 금액 + 상태 카드 */}
      <div className={`hero-card hero-card--center ${config.heroClass}`}>
        <div className="mb-3">
          <span className={`badge ${config.badgeClass}`}>{config.label}</span>
        </div>
        <div className="hero-card__amount">
          {Number(transfer.amount).toLocaleString()}<span className="currency">원</span>
        </div>
        <div className="account-flow mt-3">
          <span>{transfer.senderAccount}</span>
          <span className="account-flow__arrow" />
          <span>{transfer.receiverAccount}</span>
        </div>
        {!isTerminal && (
          <div className="hero-card__sub animate-fade" style={{ animation: 'pulse 2s infinite' }}>
            실시간 업데이트 중...
          </div>
        )}
      </div>

      {/* 상태 타임라인 */}
      <div className="card">
        <p className="section-title">진행 상태</p>
        <div className="timeline">
          {transfer.status === 'FAILED' ? (
            <>
              <div className="timeline-item timeline-item--completed">
                <div className="timeline-dot timeline-dot--success">
                  <span className="css-icon icon-check" />
                </div>
                <div className="timeline-content">
                  <div className="title">송금 요청</div>
                  <div className="desc">송금 요청이 접수되었습니다</div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot timeline-dot--failed">
                  <span className="css-icon icon-close" />
                </div>
                <div className="timeline-content">
                  <div className="title">송금 실패</div>
                  <div className="desc">{transfer.failReason || '처리 중 오류가 발생했습니다'}</div>
                </div>
              </div>
            </>
          ) : (
            steps.map((step, idx) => {
              const dotClass = getDotClass(idx)
              const iconClass = getIconForDot(dotClass)
              return (
                <div
                  className={`timeline-item${idx < currentIdx ? ' timeline-item--completed' : ''}`}
                  key={step.key}
                >
                  <div className={`timeline-dot ${dotClass}`}>
                    {iconClass && <span className={`css-icon ${iconClass}`} />}
                  </div>
                  <div className="timeline-content">
                    <div className="title">{step.label}</div>
                    <div className="desc">{step.desc}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="card">
        <p className="section-title">거래 정보</p>
        <div className="info-row">
          <span className="info-row__label">거래 ID</span>
          <span className="info-row__value info-row__value--mono">{transfer.transferId}</span>
        </div>
        <div className="info-row">
          <span className="info-row__label">요청일시</span>
          <span className="info-row__value">{new Date(transfer.createdAt).toLocaleString('ko-KR')}</span>
        </div>
        {transfer.completedAt && (
          <div className="info-row">
            <span className="info-row__label">완료일시</span>
            <span className="info-row__value">{new Date(transfer.completedAt).toLocaleString('ko-KR')}</span>
          </div>
        )}
      </div>

      {isTerminal && (
        <div className="mt-4">
          <Link to="/transfer" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            다시 송금하기
          </Link>
        </div>
      )}
    </div>
  )
}

export default TransferDetailPage
