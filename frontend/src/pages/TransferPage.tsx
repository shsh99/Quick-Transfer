import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTransfer } from '../api/transferApi'

function TransferPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ senderAccount: '', receiverAccount: '', amount: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.senderAccount || !form.receiverAccount || !form.amount) {
      setError('모든 필드를 입력해주세요')
      return
    }

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
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>송금하기</h2>
      <form className="card" onSubmit={handleSubmit}>
        <input
          placeholder="출금 계좌번호"
          value={form.senderAccount}
          onChange={e => setForm({ ...form, senderAccount: e.target.value })}
        />
        <input
          placeholder="입금 계좌번호"
          value={form.receiverAccount}
          onChange={e => setForm({ ...form, receiverAccount: e.target.value })}
        />
        <input
          type="number"
          placeholder="금액"
          value={form.amount}
          onChange={e => setForm({ ...form, amount: e.target.value })}
        />
        {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          송금하기
        </button>
      </form>
    </div>
  )
}

export default TransferPage
