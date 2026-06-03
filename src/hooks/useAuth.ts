import { useState, useEffect, useCallback } from 'react'
import { onAuthChanged, onAuthInvalidated, tokens } from '../lib/api'
import { authService, type SignupPayload } from '../services/auth'
import { profilesService } from '../services/profiles'
import type { Profile, UserType } from '../types/database'

const PROFILE_CACHE_KEY = 'app-profile-cache'

interface SignUpData {
  email: string
  password: string
  fullName: string
  phone?: string
  userType: UserType
  profession?: string
  companyName?: string
  industry?: string
}

export function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadSession = useCallback(async () => {
    if (!tokens.access) {
      setUser(null)
      setUserProfile(null)
      setIsAuthLoading(false)
      return
    }
    const { data: profile } = await authService.me()
    if (profile) {
      setUser({ id: profile.id, email: profile.email })
      setUserProfile(profile)
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile))
    } else {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY)
      if (cached) {
        const p = JSON.parse(cached)
        setUser({ id: p.id, email: p.email })
        setUserProfile(p)
      } else {
        setUser(null)
        setUserProfile(null)
      }
    }
    setIsAuthLoading(false)
  }, [])

  useEffect(() => {
    loadSession()
    const offChanged = onAuthChanged(() => loadSession())
    const offInvalid = onAuthInvalidated(() => {
      setUser(null)
      setUserProfile(null)
      localStorage.removeItem(PROFILE_CACHE_KEY)
    })
    return () => {
      offChanged()
      offInvalid()
    }
  }, [loadSession])

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    setError(null)
    setIsAuthLoading(true)
    const { error } = await authService.login(email, password)
    if (error) setError(error)
    setIsAuthLoading(false)
    return { error }
  }

  const signUp = async (data: SignUpData): Promise<{ error: Error | null }> => {
    setError(null)
    setIsAuthLoading(true)
    const payload: SignupPayload = {
      email: data.email,
      password: data.password,
      full_name: data.fullName,
      user_type: data.userType,
      phone: data.phone,
      profession: data.profession,
      company_name: data.companyName,
      industry: data.industry,
    }
    const { error } = await authService.signup(payload)
    if (error) setError(error)
    setIsAuthLoading(false)
    return { error }
  }

  const signOut = async () => {
    await authService.logout()
    localStorage.removeItem(PROFILE_CACHE_KEY)
    setUser(null)
    setUserProfile(null)
    setError(null)
  }

  const handleLogout = async () => {
    await authService.logout()
    localStorage.removeItem(PROFILE_CACHE_KEY)
    setUser(null)
    setUserProfile(null)
  }

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('No user logged in') }
    const { data, error } = await profilesService.update(user.id, updates as any)
    if (error) {
      // If the backend is unreachable, don't block the user — apply the change
      // locally (optimistic) so edits like bio persist for this session.
      if (/can't reach the server/i.test(error.message)) {
        setUserProfile(prev => {
          const merged = { ...(prev || {}), ...updates } as Profile
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(merged))
          return merged
        })
        return { error: null }
      }
      return { error }
    }
    if (data) {
      setUserProfile(data)
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data))
    }
    return { error: null }
  }

  const refreshProfile = async () => {
    if (!user) return
    const { data } = await authService.me()
    if (data) {
      setUserProfile(data)
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data))
    }
  }

  return {
    user,
    profile: userProfile,
    userProfile,
    session: tokens.access ? { access_token: tokens.access } : null,
    loading: isAuthLoading,
    isAuthLoading,
    error,
    signIn,
    signUp,
    signOut,
    handleLogout,
    updateProfile,
    refreshProfile,
  }
}
