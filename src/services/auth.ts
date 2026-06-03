import { api, notifyAuthChanged, rawRequest, tokens } from '../lib/api'
import type { Profile, UserType } from '../types/database'

interface TokenPair {
  access_token: string
  refresh_token: string
  user: Profile
}

export interface SignupPayload {
  email: string
  password: string
  full_name: string
  user_type: UserType
  phone?: string
  profession?: string
  company_name?: string
  industry?: string
  location?: string
  bio?: string
}

export const authService = {
  async login(email: string, password: string): Promise<{ data: Profile | null; error: Error | null }> {
    try {
      const pair = await rawRequest<TokenPair>('/api/auth/login', {
        method: 'POST',
        noAuth: true,
        body: { email, password },
      })
      tokens.set({ access: pair.access_token, refresh: pair.refresh_token })
      notifyAuthChanged()
      return { data: pair.user, error: null }
    } catch (e) {
      return { data: null, error: e as Error }
    }
  },

  async signup(payload: SignupPayload): Promise<{ data: Profile | null; error: Error | null }> {
    try {
      const pair = await rawRequest<TokenPair>('/api/auth/signup', {
        method: 'POST',
        noAuth: true,
        body: payload,
      })
      tokens.set({ access: pair.access_token, refresh: pair.refresh_token })
      notifyAuthChanged()
      return { data: pair.user, error: null }
    } catch (e) {
      return { data: null, error: e as Error }
    }
  },

  async logout(): Promise<void> {
    try {
      await rawRequest('/api/auth/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
    tokens.clear()
    notifyAuthChanged()
  },

  me() {
    return api.get<Profile>('/api/auth/me')
  },

  isAuthenticated() {
    return !!tokens.access
  },

  // Email OTP (free signup verification). Returns dev_code only when no email provider is configured.
  async requestOtp(email: string): Promise<{ data: { sent: boolean; dev_code?: string } | null; error: Error | null }> {
    return api.post('/api/auth/otp/request', { email })
  },

  async verifyOtp(email: string, code: string): Promise<{ data: any; error: Error | null }> {
    return api.post('/api/auth/otp/verify', { email, code })
  },

  requestPasswordReset(email: string) {
    return api.post('/api/auth/password-reset/request', { email })
  },

  confirmPasswordReset(token: string, newPassword: string) {
    return api.post('/api/auth/password-reset/confirm', { token, new_password: newPassword })
  },
}
