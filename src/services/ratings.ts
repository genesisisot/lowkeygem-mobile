import { api } from '../lib/api'
import type { Rating, RatingInsert } from '../types/database'

export const ratingsService = {
  async create(rating: RatingInsert) {
    // rater_id comes from the token.
    const { rater_id, ...body } = rating as any
    return api.post<Rating>('/api/ratings', body)
  },

  async getByUser(userId: string) {
    return api.get<Rating[]>(`/api/ratings/by-user/${userId}`)
  },

  async getAverageRating(
    userId: string
  ): Promise<{ average: number | null; count: number; error: any }> {
    const { data, error } = await api.get<{ average: number; count: number }>(
      `/api/ratings/average/${userId}`
    )
    if (error || !data) return { average: null, count: 0, error }
    return { average: data.count ? data.average : null, count: data.count, error: null }
  },

  async getRatingsByUser(userId: string) {
    return api.get<Rating[]>(`/api/ratings/by-rater/${userId}`)
  },

  async getRatingForMatch(matchId: string, _raterId: string) {
    return api.get<Rating | null>(`/api/ratings/for-match/${matchId}`)
  },

  async getByUserWithProfiles(userId: string) {
    return api.get<Rating[]>(`/api/ratings/by-user/${userId}`)
  },

  async getBatchAverageRatings(
    userIds: string[]
  ): Promise<{ ratings: Record<string, { average: number; count: number }>; error: any }> {
    if (userIds.length === 0) return { ratings: {}, error: null }
    const { data, error } = await api.post<Record<string, { average: number; count: number }>>(
      '/api/ratings/batch-average',
      { user_ids: userIds }
    )
    return { ratings: data || {}, error }
  },
}
