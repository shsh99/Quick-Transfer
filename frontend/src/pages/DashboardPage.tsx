import { useState, useEffect } from 'react'
import { createAccount, getAccount } from '../api/accountApi'
import type { Account } from '../types/api'

function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [ownerName, setOwnerName] = useState('')
  const [searchNumber, setSearchNumber] = useState('')

  const handleCreate = async () => {
    if (!ownerName.trim()) return
    const { data } = await createAccount(ownerName)
    if (data.success) {
      setAccounts(prev => [...prev, data.data])
      setOwnerName('')
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
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>대시보드</h2>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>계좌 생성</h3>
        <input placeholder="예금주명" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
        <button className="btn btn-primary" onClick={handleCreate}>생성</button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>계좌 조회</h3>
        <input placeholder="계좌번호 (예: 1000-0001)" value={searchNumber} onChange={e => setSearchNumber(e.target.value)} />
        <button className="btn btn-primary" onClick={handleSearch}>조회</button>
      </div>

      {accounts.map(account => (
        <div className="card" key={account.accountNumber}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{account.ownerName}</div>
              <div style={{ color: '#888', fontSize: 14 }}>{account.accountNumber}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>
              {account.balance.toLocaleString()}원
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default DashboardPage
