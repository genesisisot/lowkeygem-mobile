import { api, qs } from '../lib/api'
import { realtime, type RealtimeChannel } from '../lib/realtime'
import type {
  Dispute,
  DisputeReason,
  DisputeResolution,
  DisputeStatus,
  DisputeWithDetails,
  WorkSubmissionFile,
} from '../types/database'

export type { RealtimeChannel }
export const DISPUTE_RESPONSE_HOURS = 48

export const disputesService = {
  async create(
    matchId: string,
    _clientId: string,
    freelancerId: string,
    reason: DisputeReason,
    explanation: string,
    evidence: WorkSubmissionFile[]
  ): Promise<{ data: Dispute | null; error: Error | null }> {
    return api.post<Dispute>('/api/disputes', {
      match_id: matchId,
      freelancer_id: freelancerId,
      reason,
      client_explanation: explanation,
      client_evidence: evidence,
    })
  },

  async respond(
    disputeId: string,
    response: string,
    evidence: WorkSubmissionFile[]
  ): Promise<{ data: Dispute | null; error: Error | null }> {
    return api.post<Dispute>(`/api/disputes/${disputeId}/respond`, {
      freelancer_response: response,
      freelancer_evidence: evidence,
    })
  },

  async getById(disputeId: string): Promise<{ data: Dispute | null; error: Error | null }> {
    return api.get<Dispute>(`/api/disputes/${disputeId}`)
  },

  async getByMatchId(matchId: string): Promise<{ data: Dispute | null; error: Error | null }> {
    return api.get<Dispute | null>(`/api/disputes/by-match/${matchId}`)
  },

  async getByUserId(userId: string): Promise<{ data: Dispute[] | null; error: Error | null }> {
    return api.get<Dispute[]>(`/api/disputes/by-user/${userId}`)
  },

  async getAllWithDetails(
    status?: DisputeStatus
  ): Promise<{ data: DisputeWithDetails[] | null; error: Error | null }> {
    return api.get<DisputeWithDetails[]>(`/api/disputes${qs({ status })}`)
  },

  async getByIdWithDetails(
    disputeId: string
  ): Promise<{ data: DisputeWithDetails | null; error: Error | null }> {
    return api.get<DisputeWithDetails>(`/api/disputes/${disputeId}/details`)
  },

  async resolve(
    disputeId: string,
    _adminId: string,
    resolution: DisputeResolution,
    adminNotes: string,
    splitFreelancerAmount?: number,
    splitClientAmount?: number
  ): Promise<{ data: Dispute | null; error: Error | null }> {
    let freelancerShare: number | undefined
    if (
      resolution === 'split_payment' &&
      splitFreelancerAmount !== undefined &&
      splitClientAmount !== undefined
    ) {
      const total = splitFreelancerAmount + splitClientAmount
      freelancerShare = total > 0 ? splitFreelancerAmount / total : 0
    }
    return api.post<Dispute>(`/api/disputes/${disputeId}/resolve`, {
      resolution_type: resolution,
      freelancer_share: freelancerShare,
      notes: adminNotes,
    })
  },

  async getExpiredUnresponded(): Promise<{ data: Dispute[] | null; error: Error | null }> {
    return { data: [], error: null }
  },

  async moveExpiredToPendingReview(): Promise<{ count: number; error: Error | null }> {
    return { count: 0, error: null }
  },

  async getCounts(): Promise<{
    pending_response: number
    pending_review: number
    resolved: number
    total: number
    error: Error | null
  }> {
    const { data, error } = await api.get<Record<string, number>>('/api/disputes/counts')
    if (error || !data) {
      return { pending_response: 0, pending_review: 0, resolved: 0, total: 0, error }
    }
    const pending_response = data.pending_response || 0
    const pending_review = data.pending_review || 0
    const resolved = data.resolved || 0
    return {
      pending_response,
      pending_review,
      resolved,
      total: pending_response + pending_review + resolved,
      error: null,
    }
  },

  async hasActiveDispute(matchId: string): Promise<boolean> {
    const { data } = await api.get<{ active: boolean }>(`/api/disputes/${matchId}/active`)
    return !!data?.active
  },

  // Dispute updates ride the user's notification channel (type starts with "dispute").
  subscribeToDispute(_disputeId: string, callback: (dispute: Dispute) => void): RealtimeChannel {
    return realtime.notifications((msg) => {
      if (msg.event === 'notification' && String(msg.notification?.type).startsWith('dispute')) {
        callback(msg.notification as unknown as Dispute)
      }
    })
  },

  subscribeToAllDisputes(callback: (dispute: Dispute, eventType: string) => void): RealtimeChannel {
    return realtime.notifications((msg) => {
      if (msg.event === 'notification' && String(msg.notification?.type).startsWith('dispute')) {
        callback(msg.notification as unknown as Dispute, 'UPDATE')
      }
    })
  },

  unsubscribe(channel: RealtimeChannel) {
    realtime.close(channel)
  },

  reconnectToDispute(
    oldChannel: RealtimeChannel | null,
    disputeId: string,
    callback: (dispute: Dispute) => void
  ): RealtimeChannel {
    if (oldChannel) this.unsubscribe(oldChannel)
    return this.subscribeToDispute(disputeId, callback)
  },
}
