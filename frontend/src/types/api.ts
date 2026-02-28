export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: { code: string; message: string }
  timestamp: string
}

export interface Account {
  id: number
  accountNumber: string
  ownerName: string
  balance: number
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED'
  createdAt: string
}

export interface Transfer {
  id: number
  transferId: string
  senderAccount: string
  receiverAccount: string
  amount: number
  status: 'PENDING' | 'DEBITED' | 'SUCCESS' | 'FAILED'
  failReason?: string
  createdAt: string
  completedAt?: string
}

export interface TransactionLog {
  id: number
  type: 'DEBIT' | 'CREDIT' | 'ROLLBACK'
  amount: number
  balanceBefore: number
  balanceAfter: number
  transferId?: string
  description?: string
  createdAt: string
}

export interface Notification {
  type: 'TRANSFER_COMPLETED' | 'TRANSFER_FAILED'
  transferId: string
  senderAccount: string
  receiverAccount: string
  amount: number
  message: string
  timestamp: string
}
