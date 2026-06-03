import { api } from '../lib/api'
import type { WorkSubmission, WorkSubmissionFile } from '../types/database'

export const workSubmissionsService = {
  // Submissions are created via the match submit-work endpoint, which records the
  // submission AND advances the match. Direct create posts to that endpoint.
  async create(
    matchId: string,
    _freelancerId: string,
    _submissionNumber: number,
    notes: string,
    links: string[],
    files: WorkSubmissionFile[]
  ): Promise<{ data: WorkSubmission | null; error: Error | null }> {
    const { error } = await api.post(`/api/matches/${matchId}/submit-work`, { notes, links, files })
    if (error) return { data: null, error }
    return this.getLatest(matchId)
  },

  async getByMatchId(matchId: string): Promise<{ data: WorkSubmission[] | null; error: Error | null }> {
    return api.get<WorkSubmission[]>(`/api/matches/${matchId}/work-submissions`)
  },

  async getLatest(matchId: string): Promise<{ data: WorkSubmission | null; error: Error | null }> {
    return api.get<WorkSubmission | null>(`/api/matches/${matchId}/work-submissions/latest`)
  },

  async getById(id: string): Promise<{ data: WorkSubmission | null; error: Error | null }> {
    return api.get<WorkSubmission>(`/api/work-submissions/${id}`)
  },

  async getCount(matchId: string): Promise<{ count: number; error: Error | null }> {
    const { data, error } = await api.get<WorkSubmission[]>(`/api/matches/${matchId}/work-submissions`)
    return { count: data?.length || 0, error }
  },

  async delete(id: string): Promise<{ error: Error | null }> {
    const { error } = await api.del(`/api/work-submissions/${id}`)
    return { error }
  },
}
