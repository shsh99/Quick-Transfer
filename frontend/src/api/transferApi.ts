import api from './axiosInstance'
import type { ApiResponse, Transfer } from '../types/api'

export const createTransfer = (data: {
  senderAccount: string
  receiverAccount: string
  amount: number
}) => api.post<ApiResponse<Transfer>>('/transfers', data)

export const getTransfer = (transferId: string) =>
  api.get<ApiResponse<Transfer>>(`/transfers/${transferId}`)

export const getTransfers = (senderAccount: string, page = 0) =>
  api.get<ApiResponse<{ content: Transfer[] }>>(`/transfers?senderAccount=${senderAccount}&page=${page}`)
