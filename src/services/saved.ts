import { api, qs } from '../lib/api'
import type { SavedItem, JobWithClient, SkillProfileWithFreelancer } from '../types/database'

export const savedService = {
  async save(_userId: string, itemId: string, itemType: 'job' | 'freelancer') {
    return api.post<SavedItem>('/api/saved', { item_id: itemId, item_type: itemType })
  },

  async unsave(_userId: string, itemId: string) {
    const { error } = await api.del(`/api/saved/${itemId}`)
    return { error }
  },

  async isSaved(_userId: string, itemId: string) {
    const { data, error } = await api.get<SavedItem[]>('/api/saved')
    return { isSaved: !!(data || []).find((s) => s.item_id === itemId), error }
  },

  async getAll(_userId: string) {
    return api.get<SavedItem[]>('/api/saved')
  },

  async getSavedJobs(_userId: string) {
    return api.get<JobWithClient[]>('/api/saved/jobs')
  },

  async getSavedFreelancers(_userId: string) {
    return api.get<SkillProfileWithFreelancer[]>('/api/saved/freelancers')
  },

  async toggle(userId: string, itemId: string, itemType: 'job' | 'freelancer') {
    const { isSaved } = await this.isSaved(userId, itemId)
    return isSaved ? this.unsave(userId, itemId) : this.save(userId, itemId, itemType)
  },

  async getCount(_userId: string, itemType?: 'job' | 'freelancer') {
    const { data, error } = await api.get<{ count: number }>(`/api/saved/count${qs({ item_type: itemType })}`)
    return { count: data?.count || 0, error }
  },
}
