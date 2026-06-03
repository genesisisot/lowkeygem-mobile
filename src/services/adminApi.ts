import { rawRequest } from '../lib/api'

export type DisputeResolutionType =
  | 'release_full'
  | 'refund_client'
  | 'split_payment'
  | 'final_revision'

export const adminApi = {
  dashboard: () => rawRequest<any>('/admin/dashboard'),

  // KYC (now under /api/kyc)
  listKyc: (status?: string) =>
    rawRequest<any[]>(`/api/kyc${status ? `?status=${status}` : ''}`),
  reviewKyc: (id: string, decision: 'approved' | 'rejected', reason?: string) =>
    decision === 'approved'
      ? rawRequest<any>(`/api/kyc/${id}/approve`, { method: 'POST' })
      : rawRequest<any>(`/api/kyc/${id}/reject`, {
          method: 'POST',
          body: { decision: 'rejected', reason },
        }),

  // Users
  listUsers: (userType?: string) =>
    rawRequest<any[]>(`/admin/users${userType ? `?user_type=${userType}` : ''}`),
  banUser: (id: string) => rawRequest<any>(`/admin/users/${id}/ban`, { method: 'POST' }),
  unbanUser: (id: string) => rawRequest<any>(`/admin/users/${id}/unban`, { method: 'POST' }),

  // Content
  listJobs: () => rawRequest<any[]>('/admin/jobs'),
  setJobStatus: (id: string, status: string) =>
    rawRequest<any>(`/admin/jobs/${id}/status?status=${status}`, { method: 'POST' }),
  listSkillProfiles: () => rawRequest<any[]>('/admin/skill-profiles'),

  // Money
  listPayments: () => rawRequest<any[]>('/admin/payments'),

  // Disputes (resolution now under /api/disputes)
  listDisputes: (status?: string) =>
    rawRequest<any[]>(`/api/disputes${status ? `?status=${status}` : ''}`),
  resolveDispute: (
    id: string,
    resolutionType: DisputeResolutionType,
    opts: { freelancerShare?: number; notes?: string } = {}
  ) =>
    rawRequest<any>(`/api/disputes/${id}/resolve`, {
      method: 'POST',
      body: {
        resolution_type: resolutionType,
        freelancer_share: opts.freelancerShare,
        notes: opts.notes,
      },
    }),

  // Reports
  listReports: (status?: string) =>
    rawRequest<any[]>(`/admin/reports${status ? `?status=${status}` : ''}`),
  resolveReport: (id: string, resolution: string) =>
    rawRequest<any>(`/admin/reports/${id}/resolve`, { method: 'POST', body: { resolution } }),
  dismissReport: (id: string) =>
    rawRequest<any>(`/admin/reports/${id}/dismiss`, { method: 'POST' }),

  // Support tickets
  listSupport: (status?: string) =>
    rawRequest<any[]>(`/admin/support${status ? `?status=${status}` : ''}`),
  replySupport: (id: string, message: string, status?: string) =>
    rawRequest<any>(`/admin/support/${id}/reply`, { method: 'POST', body: { message, status } }),

  // Profession / skill change-requests
  listProfessionRequests: (status?: string) =>
    rawRequest<any[]>(`/admin/profession-requests${status ? `?status=${status}` : ''}`),
  reviewProfessionRequest: (id: string, decision: 'approve' | 'reject') =>
    rawRequest<any>(`/admin/profession-requests/${id}/${decision}`, { method: 'POST' }),
  listSkillRequests: (status?: string) =>
    rawRequest<any[]>(`/admin/skill-requests${status ? `?status=${status}` : ''}`),
  reviewSkillRequest: (id: string, decision: 'approve' | 'reject') =>
    rawRequest<any>(`/admin/skill-requests/${id}/${decision}`, { method: 'POST' }),

  // Disputes
  listDisputesDetailed: (status?: string) =>
    rawRequest<any[]>(`/api/disputes${status ? `?status=${status}` : ''}`),
}
