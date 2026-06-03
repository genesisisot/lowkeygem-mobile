import { api } from '../lib/api'

export const reportsService = {
  create(payload: {
    target_type: 'user' | 'job' | 'skill_profile' | 'message'
    target_id?: string
    reason: string
    description?: string
  }) {
    return api.post('/api/reports', payload)
  },
}
