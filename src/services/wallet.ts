import { api } from '../lib/api'
import type { Wallet, Transaction } from '../types/database'

export const walletService = {
  // Current user's wallet (userId kept for signature compatibility).
  async getByUser(_userId: string) {
    return api.get<Wallet>('/api/wallet')
  },

  async create(_userId: string) {
    return api.post<Wallet>('/api/wallet')
  },

  async updateBankDetails(
    _userId: string,
    bankDetails: { bank_name: string; account_number: string; account_name: string }
  ) {
    return api.patch<Wallet>('/api/wallet/bank', bankDetails)
  },

  // Simulated credit top-up.
  async addFunds(_userId: string, amount: number, description: string, matchId?: string) {
    const { error } = await api.post('/api/wallet/credit', { amount, description, match_id: matchId })
    return { error }
  },

  async deductFunds(_userId: string, amount: number, description: string, matchId?: string) {
    const { error } = await api.post('/api/wallet/debit', { amount, description, match_id: matchId })
    return { error }
  },

  async fundEscrow(_userId: string, amount: number, matchId: string) {
    const { error } = await api.post('/api/wallet/fund-escrow', { amount, match_id: matchId })
    return { error }
  },

  async releaseEscrow(clientId: string, freelancerId: string, amount: number, matchId: string) {
    const { error } = await api.post('/api/wallet/release', {
      client_id: clientId,
      freelancer_id: freelancerId,
      amount,
      match_id: matchId,
    })
    return { error }
  },

  async refundEscrow(clientId: string, amount: number, matchId: string): Promise<{ error: Error | null }> {
    const { error } = await api.post('/api/wallet/refund', { client_id: clientId, amount, match_id: matchId })
    return { error }
  },

  async splitEscrow(
    clientId: string,
    freelancerId: string,
    clientAmount: number,
    freelancerAmount: number,
    matchId: string
  ): Promise<{ error: Error | null }> {
    const { error } = await api.post('/api/wallet/split', {
      client_id: clientId,
      freelancer_id: freelancerId,
      client_amount: clientAmount,
      freelancer_amount: freelancerAmount,
      match_id: matchId,
    })
    return { error }
  },

  async getTransactions(_userId: string, limit = 50) {
    return api.get<Transaction[]>(`/api/wallet/transactions?limit=${limit}`)
  },

  async initiateWithdrawal(_userId: string, amount: number) {
    const { error } = await api.post('/api/wallet/withdraw', { amount })
    return { error }
  },
}
