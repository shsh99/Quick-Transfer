import api from './axiosInstance'
import type { ApiResponse, Account, TransactionLog } from '../types/api'

export const createAccount = (ownerName: string) =>
  api.post<ApiResponse<Account>>('/accounts', { ownerName })

export const getAllAccounts = () =>
  api.get<ApiResponse<Account[]>>('/accounts')

export const getAccount = (accountNumber: string) =>
  api.get<ApiResponse<Account>>(`/accounts/${accountNumber}`)

export const getTransactions = (accountNumber: string, page = 0) =>
  api.get<ApiResponse<{ content: TransactionLog[] }>>(`/accounts/${accountNumber}/transactions?page=${page}`)
