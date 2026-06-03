import { api, qs, rawRequest } from '../lib/api'
import { poll, type RealtimeChannel } from '../lib/realtime'
import type {
  Match,
  MatchInsert,
  MatchUpdate,
  MatchWithProfiles,
  SwipeInsert,
  SwipeDirection,
  SwipeType,
  WorkSubmissionFile,
} from '../types/database'

export type { RealtimeChannel }

// Constants for review timers (mirror the backend).
export const REVIEW_DEADLINE_DAYS = 3
export const MAX_REVISIONS = 2

interface SwipeResult {
  swipe: any
  matched: boolean
  match: Match | null
}

export const swipesService = {
  async create(swipe: SwipeInsert) {
    const { data, error } = await api.post<SwipeResult>('/api/swipes', {
      swiped_id: swipe.swiped_id ?? null,
      swipe_type: swipe.swipe_type,
      target_id: swipe.target_id,
      context_id: swipe.context_id ?? null,
      direction: swipe.direction,
    })
    return { data: data?.swipe ?? null, error }
  },

  async hasSwipedOn(swiperId: string, targetId: string) {
    const { data, error } = await api.get<any[]>(`/api/swipes/by-user/${swiperId}`)
    const match = (data || []).find((s) => s.target_id === targetId)
    return { hasSwiped: !!match, data: match || null, error }
  },

  async getByUser(userId: string) {
    return api.get<any[]>(`/api/swipes/by-user/${userId}`)
  },

  async getOnUser(userId: string) {
    return api.get<any[]>(`/api/swipes/on-user/${userId}`)
  },

  // Mutual matching is computed server-side on POST /api/swipes; kept for API compatibility.
  async checkMutualMatch(
    _swiperId: string,
    _swipedId: string,
    _reverseSwipeType: SwipeType,
    _jobId: string,
    _jobField: 'target_id' | 'context_id'
  ) {
    return { isMutualMatch: false, swipes: [] as any[] }
  },
}

export const matchesService = {
  async create(match: MatchInsert) {
    return api.post<Match>('/api/matches', match)
  },

  async getByUser(userId: string) {
    return api.get<MatchWithProfiles[]>(`/api/matches${qs({ user_id: userId })}`)
  },

  async getById(id: string) {
    return api.get<MatchWithProfiles>(`/api/matches/${id}`)
  },

  async updateStatus(id: string, status: Match['status']) {
    return api.post<Match>(`/api/matches/${id}/status`, { status })
  },

  async update(id: string, updates: MatchUpdate) {
    if (updates.status) return api.post<Match>(`/api/matches/${id}/status`, { status: updates.status })
    return this.getById(id)
  },

  async fundProject(id: string, amount: number) {
    return api.post<Match>(`/api/matches/${id}/fund`, { amount })
  },

  async startWork(id: string) {
    return this.updateStatus(id, 'in_progress')
  },

  async submitWork(id: string) {
    return this.updateStatus(id, 'pending_approval')
  },

  async approveWork(id: string) {
    return api.post<Match>(`/api/matches/${id}/approve`)
  },

  async dispute(id: string) {
    return api.post<Match>(`/api/matches/${id}/dispute`)
  },

  // Open a formal dispute (client). Resolves the freelancer from the match.
  async openDispute(
    matchId: string,
    reason: any,
    explanation: string,
    evidence: any[] = []
  ): Promise<{ data: any; error: Error | null }> {
    const { data: match, error: matchErr } = await this.getById(matchId)
    if (matchErr || !match) return { data: null, error: matchErr || new Error('Match not found') }
    const { disputesService } = await import('./disputes')
    return disputesService.create(
      matchId,
      match.client_id,
      match.freelancer_id,
      reason,
      explanation,
      evidence
    )
  },

  // Freelancer responds to the active dispute on a match.
  async respondToDispute(
    matchId: string,
    response: string,
    evidence: any[] = []
  ): Promise<{ data: any; error: Error | null }> {
    const { disputesService } = await import('./disputes')
    const { data: dispute, error } = await disputesService.getByMatchId(matchId)
    if (error || !dispute) return { data: null, error: error || new Error('Dispute not found') }
    return disputesService.respond(dispute.id, response, evidence)
  },

  async cancel(id: string) {
    return api.post<Match>(`/api/matches/${id}/cancel`)
  },

  async delete(id: string) {
    const { error } = await api.del(`/api/matches/${id}`)
    return { data: null, error }
  },

  async submitWorkWithEvidence(
    matchId: string,
    _freelancerId: string,
    notes: string,
    links: string[],
    files: WorkSubmissionFile[]
  ): Promise<{ data: Match | null; error: Error | null }> {
    return api.post<Match>(`/api/matches/${matchId}/submit-work`, { notes, links, files })
  },

  async requestRevision(
    matchId: string
  ): Promise<{ data: Match | null; error: Error | null; maxRevisionsReached?: boolean }> {
    const { data, error } = await api.post<Match>(`/api/matches/${matchId}/request-revision`)
    if (error && /maximum revisions/i.test(error.message)) {
      return { data: null, error, maxRevisionsReached: true }
    }
    return { data, error }
  },

  async getPendingPastDeadline(): Promise<{ data: MatchWithProfiles[] | null; error: Error | null }> {
    // Server-side cron concern; not exposed to the client.
    return { data: [], error: null }
  },

  async autoReleaseExpired(): Promise<{ processedCount: number; error: Error | null }> {
    return { processedCount: 0, error: null }
  },

  async isRevisionCapReached(matchId: string): Promise<boolean> {
    const { data } = await this.getById(matchId)
    return (data?.revision_count || 0) >= MAX_REVISIONS
  },

  async getRemainingRevisions(matchId: string): Promise<number> {
    const { data } = await this.getById(matchId)
    return Math.max(0, MAX_REVISIONS - (data?.revision_count || 0))
  },

  async getByStatus(userId: string, status: Match['status']) {
    return api.get<MatchWithProfiles[]>(`/api/matches${qs({ user_id: userId, status })}`)
  },

  async getUnreadCount(matchId: string, _userId: string) {
    const { data, error } = await api.get<{ count: number }>(`/api/matches/${matchId}/unread`)
    return { count: data?.count || 0, error }
  },

  async getAll() {
    return api.get<MatchWithProfiles[]>('/api/matches?all=true')
  },

  // Fires `callback(match, isNew)` whenever a match first appears (isNew=true)
  // or an existing match's state changes (isNew=false) — status, revision_count,
  // submitted_at or review_deadline. The signature lets callers react live to
  // escrow funding, work submission, approvals, etc. instead of only new matches.
  subscribeToUserMatches(
    userId: string,
    callback: (match: MatchWithProfiles, isNew: boolean) => void
  ): RealtimeChannel {
    const signatures = new Map<string, string>()
    let primed = false
    const sig = (m: MatchWithProfiles) =>
      `${m.status}:${m.revision_count ?? 0}:${m.submitted_at ?? ''}:${m.review_deadline ?? ''}`
    return poll(async () => {
      const rows = await rawRequest<MatchWithProfiles[]>(`/api/matches${qs({ user_id: userId })}`)
      for (const m of rows) {
        const prev = signatures.get(m.id)
        const next = sig(m)
        if (prev === next) continue
        const isNew = prev === undefined
        signatures.set(m.id, next)
        if (primed) callback(m, isNew)
      }
      primed = true
    }, 3000)
  },

  unsubscribe(channel: RealtimeChannel) {
    channel?.close()
  },
}

// Record a swipe and let the server resolve mutual matches.
export async function handleSwipe(
  _swiperId: string,
  swipedId: string | null,
  targetId: string,
  swipeType: 'job' | 'freelancer',
  direction: SwipeDirection,
  contextId: string | null = null
): Promise<{ match: Match | null; error: Error | null }> {
  const { data, error } = await api.post<SwipeResult>('/api/swipes', {
    swiped_id: swipedId,
    swipe_type: swipeType,
    target_id: targetId,
    context_id: contextId,
    direction,
  })
  if (error) return { match: null, error }
  return { match: data?.match ?? null, error: null }
}
