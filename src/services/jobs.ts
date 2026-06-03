import { api, qs } from '../lib/api'
import type { Job, JobInsert, JobUpdate, JobWithClient } from '../types/database'

export const jobsService = {
  // Get all active jobs (for freelancer discovery)
  async getActive() {
    return api.get<JobWithClient[]>('/api/jobs?status=active')
  },

  // Discovery feed: active jobs the freelancer hasn't swiped, filtered by skill/category overlap.
  async getForDiscovery(
    _freelancerId: string,
    options: { limit?: number; skills?: string[]; categories?: string[] } = {}
  ) {
    const { limit = 20, skills = [], categories = [] } = options
    const { data, error } = await api.get<JobWithClient[]>(`/api/jobs/discovery${qs({ limit })}`)
    if (error || !data) return { data, error }

    let jobs = data
    const skillSet = new Set(skills.map((s) => s.toLowerCase().trim()))
    const categorySet = new Set(categories.map((c) => c.toLowerCase().trim()))
    if (skillSet.size > 0 || categorySet.size > 0) {
      // Symmetric with the client side: category must match AND at least 2 of
      // the job's required skills must overlap the freelancer's profile skills.
      // Jobs with a single required skill fall back to requiring that one match.
      const matched = jobs.filter((job) => {
        const categoryOk = !!job.category && categorySet.has(job.category.toLowerCase().trim())
        if (!categoryOk) return false
        const overlaps = (job.required_skills || [])
          .filter((rs) => skillSet.has(rs.toLowerCase().trim())).length
        return overlaps >= Math.min(2, (job.required_skills || []).length || 1)
      })
      if (matched.length > 0) jobs = matched
    }
    return { data: jobs.slice(0, limit), error: null }
  },

  async getByClient(clientId: string) {
    return api.get<Job[]>(`/api/jobs/by-client/${clientId}`)
  },

  async getById(id: string) {
    return api.get<JobWithClient>(`/api/jobs/${id}`)
  },

  async create(job: JobInsert) {
    return api.post<Job>('/api/jobs', job)
  },

  async update(id: string, updates: JobUpdate) {
    return api.patch<Job>(`/api/jobs/${id}`, updates)
  },

  async delete(id: string) {
    const { error } = await api.del(`/api/jobs/${id}`)
    return { error }
  },

  async toggleStatus(id: string, status: 'active' | 'paused') {
    return this.update(id, { status })
  },

  async markAsFilled(id: string) {
    return this.update(id, { status: 'filled' })
  },

  async search(query: string, category?: string) {
    return api.get<JobWithClient[]>(`/api/jobs${qs({ q: query, category, status: 'active' })}`)
  },

  async getByCategory(category: string) {
    return api.get<JobWithClient[]>(`/api/jobs${qs({ category, status: 'active' })}`)
  },

  async incrementViews(id: string) {
    const { error } = await api.post(`/api/jobs/${id}/view`)
    return { error }
  },

  async incrementProposals(id: string) {
    const { error } = await api.post(`/api/jobs/${id}/proposal`)
    return { error }
  },

  // Admin: Get all jobs
  async getAll() {
    return api.get<JobWithClient[]>('/api/jobs?all=true')
  },
}
