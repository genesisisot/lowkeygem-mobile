import { api, qs } from '../lib/api'
import type { Profile, ProfileUpdate, SkillProfile, SkillProfileInsert, SkillProfileUpdate } from '../types/database'

export const profilesService = {
  // Get profile by ID
  async getById(id: string) {
    return api.get<Profile>(`/api/profiles/${id}`)
  },

  // Get profile by email
  async getByEmail(email: string) {
    const { data, error } = await api.get<Profile[]>(`/api/profiles${qs({ email })}`)
    return { data: data && data.length ? data[0] : null, error }
  },

  // Update profile
  async update(id: string, updates: ProfileUpdate) {
    return api.patch<Profile>(`/api/profiles/${id}`, updates)
  },

  // Get all freelancers (for client discovery)
  async getFreelancers(excludeIds: string[] = []) {
    const { data, error } = await api.get<Profile[]>('/api/profiles/freelancers')
    if (error || !data) return { data, error }
    const exclude = new Set(excludeIds)
    return { data: data.filter((p) => !exclude.has(p.id)), error: null }
  },

  // Get all clients (for admin)
  async getClients() {
    return api.get<Profile[]>('/api/profiles/clients')
  },

  // Admin: Get all users
  async getAllUsers() {
    return api.get<Profile[]>('/api/profiles')
  },

  // Search profiles
  async search(query: string, userType?: 'freelancer' | 'client') {
    return api.get<Profile[]>(`/api/profiles${qs({ q: query, user_type: userType })}`)
  },
}

// Skill Profiles Service (Freelancer service offerings)
export const skillProfilesService = {
  async getByFreelancer(freelancerId: string) {
    return api.get<SkillProfile[]>(`/api/skill-profiles${qs({ freelancer_id: freelancerId })}`)
  },

  async getById(id: string) {
    return api.get<SkillProfile>(`/api/skill-profiles/${id}`)
  },

  async create(profile: SkillProfileInsert) {
    return api.post<SkillProfile>('/api/skill-profiles', profile)
  },

  async update(id: string, updates: SkillProfileUpdate) {
    return api.patch<SkillProfile>(`/api/skill-profiles/${id}`, updates)
  },

  async delete(id: string) {
    const { error } = await api.del(`/api/skill-profiles/${id}`)
    return { error }
  },

  // Discovery feed (server randomizes + caps); excludeIds applied as query.
  async getForDiscovery(excludeIds: string[] = [], limit = 10) {
    const exclude = excludeIds.map((id) => `exclude=${encodeURIComponent(id)}`).join('&')
    const path = `/api/skill-profiles?discovery=true&limit=${limit}${exclude ? `&${exclude}` : ''}`
    return api.get<SkillProfile[]>(path)
  },

  async incrementViews(id: string) {
    const { error } = await api.post(`/api/skill-profiles/${id}/view`)
    return { error }
  },

  async incrementInterests(id: string) {
    const { error } = await api.post(`/api/skill-profiles/${id}/interest`)
    return { error }
  },
}
