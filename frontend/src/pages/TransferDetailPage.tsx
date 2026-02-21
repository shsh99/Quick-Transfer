import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getTransfer } from '../api/transferApi'
import type { Transfer } from '../types/api'

const STATUS_LABEL: Record<string, string> = {
  PENDING: '처리중',
  DEBITED: '출금완료',
  SUCCESS: '송금완료',
  FAILED: '실패',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b',
  DEBITED: '#3b82f6',
  SUCCESS: '#10b981',
  FAILED: '#ef4444',
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

  if (!transfer) return <div className="card">로딩중...</div>

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>송금 상세</h2>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{
            padding: '6px 16px',
            borderRadius: 20,
            background: STATUS_COLOR[transfer.status] + '20',
            color: STATUS_COLOR[transfer.status],
            fontWeight: 600,
          }}>
            {STATUS_LABEL[transfer.status]}
          </span>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>
          {transfer.amount.toLocaleString()}원
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#666' }}>
          <div>거래 ID: {transfer.transferId}</div>
          <div>출금계좌: {transfer.senderAccount}</div>
          <div>입금계좌: {transfer.receiverAccount}</div>
          <div>요청일시: {new Date(transfer.createdAt).toLocaleString('ko-KR')}</div>
          {transfer.failReason && <div style={{ color: 'red' }}>실패사유: {transfer.failReason}</div>}
        </div>
      </div>
    </div>
  )
}

export default TransferDetailPage
