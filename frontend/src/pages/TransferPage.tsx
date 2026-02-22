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
    <div className="page-enter">
      <header className="page-header">
        <h1 className="page-header__greeting">송금</h1>
      </header>

      {/* 금액 표시 히어로 */}
      <div className="hero-card hero-card--center">
        <div className="hero-card__label">보내는 금액</div>
        <div className="hero-card__amount">
          {formattedAmount}<span className="currency">원</span>
        </div>
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

          <div className="transfer-direction">
            <div className="transfer-direction__icon">
              <span className="css-icon icon-arrow-down" />
            </div>
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
              className="input-amount"
            />
          </div>

          {/* 금액 프리셋 */}
          <div className="amount-presets">
            {[10000, 50000, 100000, 500000].map(v => (
              <button
                key={v}
                type="button"
                className="amount-preset"
                onClick={() => setForm({ ...form, amount: String(v) })}
              >
                +{(v / 10000)}만
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="alert alert--danger">{error}</div>
        )}

        <button
          type="submit"
          className={`btn btn-primary${loading ? ' btn-loading' : ''}`}
          disabled={loading}
        >
          {loading ? '송금 처리중' : '송금하기'}
        </button>
      </form>
    </div>
  )
}

export default TransferPage
