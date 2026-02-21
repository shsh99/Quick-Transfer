import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTransfer } from '../api/transferApi'
import type { Transfer } from '../types/api'

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string; icon: string }> = {
  PENDING:  { label: '처리중',   badge: 'badge-warning', dot: 'active', icon: '⏳' },
  DEBITED:  { label: '출금완료', badge: 'badge-info',    dot: 'active', icon: '💳' },
  SUCCESS:  { label: '송금완료', badge: 'badge-success',  dot: 'success', icon: '✅' },
  FAILED:   { label: '실패',     badge: 'badge-danger',   dot: 'failed', icon: '❌' },
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
      <div className="animate-fade" style={{ paddingTop: 40 }}>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div className="animate-pulse" style={{ fontSize: 32 }}>💸</div>
          <p className="text-muted mt-8">송금 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const config = STATUS_CONFIG[transfer.status]
  const isTerminal = transfer.status === 'SUCCESS' || transfer.status === 'FAILED'
  const steps = [
    { key: 'PENDING', label: '송금 요청', desc: '송금 요청이 접수되었습니다', icon: '📋' },
    { key: 'DEBITED', label: '출금 완료', desc: '출금 계좌에서 금액이 차감되었습니다', icon: '💳' },
    { key: 'SUCCESS', label: '입금 완료', desc: '수취인 계좌에 입금되었습니다', icon: '✅' },
  ]

  const currentIdx = steps.findIndex(s => s.key === transfer.status)

  return (
    <div className="animate-fade">
      <p className="page-title">송금 상세</p>

      {/* 금액 + 상태 카드 */}
      <div className="card-hero" style={{ textAlign: 'center' }}>
        <span className={`badge ${config.badge}`} style={{ marginBottom: 12 }}>
          {config.icon} {config.label}
        </span>
        <div className="balance" style={{ marginTop: 8 }}>
          {Number(transfer.amount).toLocaleString()}원
        </div>
        <div className="account-number" style={{ marginTop: 12 }}>
          {transfer.senderAccount} → {transfer.receiverAccount}
        </div>
        {!isTerminal && (
          <div className="animate-pulse" style={{ marginTop: 8, fontSize: 12, color: 'var(--gray-400)' }}>
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
              <div className="timeline-item">
                <div className="timeline-dot success">📋</div>
                <div className="timeline-content">
                  <div className="title">송금 요청</div>
                  <div className="desc">송금 요청이 접수되었습니다</div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot failed">❌</div>
                <div className="timeline-content">
                  <div className="title">송금 실패</div>
                  <div className="desc">{transfer.failReason || '처리 중 오류가 발생했습니다'}</div>
                </div>
              </div>
            </>
          ) : (
            steps.map((step, idx) => {
              const dotClass = idx <= currentIdx ? (idx === currentIdx && !isTerminal ? 'active' : 'success') : 'pending'
              return (
                <div className="timeline-item" key={step.key}>
                  <div className={`timeline-dot ${dotClass}`}>{step.icon}</div>
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
        <div className="list-item">
          <div className="list-content"><div className="subtitle">거래 ID</div></div>
          <div className="text-sm text-muted" style={{ fontFamily: 'monospace', fontSize: 11 }}>{transfer.transferId}</div>
        </div>
        <div className="list-item">
          <div className="list-content"><div className="subtitle">요청일시</div></div>
          <div className="text-sm">{new Date(transfer.createdAt).toLocaleString('ko-KR')}</div>
        </div>
        {transfer.completedAt && (
          <div className="list-item">
            <div className="list-content"><div className="subtitle">완료일시</div></div>
            <div className="text-sm">{new Date(transfer.completedAt).toLocaleString('ko-KR')}</div>
          </div>
        )}
      </div>

      {isTerminal && (
        <div className="mt-16">
          <Link to="/transfer" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex' }}>
            다시 송금하기
          </Link>
        </div>
      )}
    </div>
  )
}

export default TransferDetailPage
