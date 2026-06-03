import { api } from '../lib/api'
import type { DisputeReputation, DisputeResolution } from '../types/database'

// Reputation counters are now maintained server-side on dispute create/resolve.
// The client read methods hit the API; the mutating helpers are no-ops kept for
// signature compatibility (the server is the source of truth).
export const disputeReputationService = {
  async initialize(userId: string): Promise<{ data: DisputeReputation | null; error: Error | null }> {
    return api.get<DisputeReputation>(`/api/dispute-reputation/${userId}`)
  },

  async getByUserId(userId: string): Promise<{ data: DisputeReputation | null; error: Error | null }> {
    return api.get<DisputeReputation>(`/api/dispute-reputation/${userId}`)
  },

  async incrementInitiated(_clientId: string): Promise<{ error: Error | null }> {
    return { error: null }
  },
  async incrementAgainst(_freelancerId: string): Promise<{ error: Error | null }> {
    return { error: null }
  },
  async incrementWon(_userId: string): Promise<{ error: Error | null }> {
    return { error: null }
  },
  async incrementLost(_userId: string): Promise<{ error: Error | null }> {
    return { error: null }
  },
  async incrementSplit(_userId: string): Promise<{ error: Error | null }> {
    return { error: null }
  },
  async updateAfterResolution(
    _clientId: string,
    _freelancerId: string,
    _resolution: DisputeResolution
  ): Promise<{ error: Error | null }> {
    return { error: null }
  },
  async recordDisputeInitiation(_clientId: string, _freelancerId: string): Promise<{ error: Error | null }> {
    return { error: null }
  },

  async getDisputeRate(userId: string): Promise<{ rate: number; total: number; error: Error | null }> {
    const { data, error } = await api.get<{ rate: number; total: number }>(
      `/api/dispute-reputation/${userId}/rate`
    )
    if (error || !data) return { rate: 0, total: 0, error }
    return { rate: data.rate, total: data.total, error: null }
  },

  async isHighRisk(userId: string): Promise<{ isHighRisk: boolean; reason: string | null }> {
    const { data } = await api.get<{ high_risk: boolean }>(`/api/dispute-reputation/${userId}/high-risk`)
    return { isHighRisk: !!data?.high_risk, reason: data?.high_risk ? 'Flagged by dispute history' : null }
  },
}
