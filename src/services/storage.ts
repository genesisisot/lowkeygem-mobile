import { api } from '../lib/api'

// Storage bucket names (files still live in Supabase Storage; uploads go via the Python API).
const BUCKETS = {
  AVATARS: 'avatars',
  PORTFOLIOS: 'portfolios',
  KYC_DOCUMENTS: 'kyc-documents',
  WORK_SUBMISSIONS: 'work-submissions',
  CHAT_ATTACHMENTS: 'chat-attachments',
} as const

export const storageService = {
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      const ext = file.name.split('.').pop()
      const { url } = await api.upload(BUCKETS.AVATARS, file, `${userId}/avatar-${Date.now()}.${ext}`)
      return url
    } catch (e) {
      console.error('Error uploading avatar:', e)
      return null
    }
  },

  async uploadPortfolioImage(userId: string, file: File): Promise<string | null> {
    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const { url } = await api.upload(BUCKETS.PORTFOLIOS, file, path)
      return url
    } catch (e) {
      console.error('Error uploading portfolio image:', e)
      return null
    }
  },

  async uploadPortfolioImages(userId: string, files: File[]): Promise<string[]> {
    const results = await Promise.all(files.map((f) => this.uploadPortfolioImage(userId, f)))
    return results.filter((url): url is string => url !== null)
  },

  async deletePortfolioImage(url: string): Promise<boolean> {
    try {
      const parts = url.split('/portfolios/')
      if (parts.length < 2) return false
      const path = parts[1].split('?')[0]
      await api.del(`/api/storage/${BUCKETS.PORTFOLIOS}?path=${encodeURIComponent(path)}`)
      return true
    } catch {
      return false
    }
  },

  async uploadKYCDocument(
    userId: string,
    file: File,
    documentType: 'id_front' | 'id_back' | 'selfie'
  ): Promise<string | null> {
    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${documentType}-${Date.now()}.${ext}`
      const { url } = await api.upload(BUCKETS.KYC_DOCUMENTS, file, path)
      return url
    } catch (e) {
      console.error('Error uploading KYC document:', e)
      return null
    }
  },

  // Signed URLs are issued by the server at upload time; callers persist them.
  async getKYCDocumentUrl(path: string): Promise<string | null> {
    return path || null
  },

  async uploadWorkSubmission(matchId: string, freelancerId: string, file: File): Promise<string | null> {
    try {
      const path = `${matchId}/${freelancerId}/${Date.now()}-${file.name}`
      const { url } = await api.upload(BUCKETS.WORK_SUBMISSIONS, file, path)
      return url
    } catch (e) {
      console.error('Error uploading work submission:', e)
      return null
    }
  },

  async uploadDisputeEvidence(
    matchId: string,
    file: File
  ): Promise<{ url: string | null; error: Error | null }> {
    try {
      const path = `${matchId}/dispute/${Date.now()}-${file.name}`
      const { url } = await api.upload(BUCKETS.WORK_SUBMISSIONS, file, path)
      return { url, error: null }
    } catch (e) {
      console.error('Error uploading dispute evidence:', e)
      return { url: null, error: e as Error }
    }
  },

  async uploadChatAttachment(
    matchId: string,
    senderId: string,
    file: File
  ): Promise<{ url: string; type: string } | null> {
    try {
      const path = `${matchId}/${senderId}/${Date.now()}-${file.name}`
      const { url } = await api.upload(BUCKETS.CHAT_ATTACHMENTS, file, path)
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
      return { url, type: isImage ? 'image' : 'file' }
    } catch (e) {
      console.error('Error uploading chat attachment:', e)
      return null
    }
  },

  async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      await api.del(`/api/storage/${bucket}?path=${encodeURIComponent(path)}`)
      return true
    } catch {
      return false
    }
  },

  // URLs are returned by the server at upload time.
  getPublicUrl(_bucket: string, path: string): string {
    return path
  },

  async listFiles() {
    return { data: [], error: null }
  },
}

export { BUCKETS }
