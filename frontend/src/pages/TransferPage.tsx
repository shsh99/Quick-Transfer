import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllAccounts } from '../api/accountApi'
import { createTransfer } from '../api/transferApi'
import type { Account } from '../types/api'

function TransferPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState({ senderAccount: '', receiverAccount: '', amount: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getAllAccounts().then(({ data }) => {
      if (data.success) setAccounts(data.data)
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.senderAccount || !form.receiverAccount || !form.amount) {
      setError('모든 필드를 입력해주세요')
      return
    }

    setLoading(true)
    try {
      const { data } = await createTransfer({
        senderAccount: form.senderAccount,
        receiverAccount: form.receiverAccount,
        amount: Number(form.amount),
      })
      if (data.success) {
        navigate(`/transfer/${data.data.transferId}`)
      } else {
        setError(data.error?.message || '송금 요청 실패')
      }
    } catch {
      setError('송금 요청 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const formattedAmount = form.amount ? Number(form.amount).toLocaleString() : '0'

  return (
    <div className="animate-fade">
      <p className="page-title">송금</p>

      {/* 금액 표시 */}
      <div className="card-hero" style={{ textAlign: 'center' }}>
        <div className="label">보내는 금액</div>
        <div className="balance">{formattedAmount}원</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="input-group">
            <label>출금 계좌</label>
            {accounts.length > 0 ? (
              <select
                value={form.senderAccount}
                onChange={e => setForm({ ...form, senderAccount: e.target.value })}
              >
                <option value="">계좌를 선택하세요</option>
                {accounts.map(a => (
                  <option key={a.accountNumber} value={a.accountNumber}>
                    {a.ownerName} ({a.accountNumber}) - {Number(a.balance).toLocaleString()}원
                  </option>
                ))}
              </select>
            ) : (
              <input
                placeholder="출금 계좌번호를 입력하세요"
                value={form.senderAccount}
                onChange={e => setForm({ ...form, senderAccount: e.target.value })}
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 16px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#e8f0fe', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>↓</div>
          </div>

          <div className="input-group">
            <label>입금 계좌</label>
            {accounts.length > 0 ? (
              <select
                value={form.receiverAccount}
                onChange={e => setForm({ ...form, receiverAccount: e.target.value })}
              >
                <option value="">계좌를 선택하세요</option>
                {accounts.map(a => (
                  <option key={a.accountNumber} value={a.accountNumber}>
                    {a.ownerName} ({a.accountNumber}) - {Number(a.balance).toLocaleString()}원
                  </option>
                ))}
              </select>
            ) : (
              <input
                placeholder="입금 계좌번호를 입력하세요"
                value={form.receiverAccount}
                onChange={e => setForm({ ...form, receiverAccount: e.target.value })}
              />
            )}
          </div>

          <div className="input-group">
            <label>금액</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="보낼 금액을 입력하세요"
              value={form.amount}
              onChange={e => {
                const v = e.target.value.replaceAll(/\D/g, '')
                setForm({ ...form, amount: v })
              }}
              style={{ fontSize: 18, fontWeight: 700 }}
            />
          </div>
        </div>

        {error && (
          <div className="card animate-slide" style={{
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            fontSize: 14,
            fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '송금 처리중...' : '송금하기'}
        </button>
      </form>
    </div>
  )
}

export default TransferPage
