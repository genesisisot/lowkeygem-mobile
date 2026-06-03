import { api, qs } from '../lib/api'
import type { KycSubmission, KycSubmissionInsert, KycStatus } from '../types/database'

export const kycService = {
  async getByUser(_userId: string) {
    return api.get<KycSubmission>('/api/kyc/me')
  },

  async submit(submission: KycSubmissionInsert) {
    // user_id comes from the token; send only the document fields.
    const { user_id, ...body } = submission as any
    return api.post<KycSubmission>('/api/kyc/submit', body)
  },

  async getPending() {
    return api.get<KycSubmission[]>('/api/kyc?status=pending')
  },

  async getAll(status?: KycStatus) {
    return api.get<KycSubmission[]>(`/api/kyc${qs({ status })}`)
  },

  async approve(submissionId: string, _reviewerId: string) {
    const { error } = await api.post(`/api/kyc/${submissionId}/approve`)
    return { error }
  },

  async reject(submissionId: string, _reviewerId: string, reason: string) {
    const { error } = await api.post(`/api/kyc/${submissionId}/reject`, { decision: 'rejected', reason })
    return { error }
  },

  async getById(id: string) {
    return api.get<KycSubmission>(`/api/kyc/${id}`)
  },
}
