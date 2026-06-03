import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoadingScreen } from './components/LoadingScreen'
import type { UserType } from './types/database'

interface ProtectedRouteProps {
  role?: UserType
  children: ReactNode
}

export function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { user, userProfile, isAuthLoading, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthLoading) return

    if (!user || !userProfile) {
      navigate('/login', { replace: true })
      return
    }

    if (role && userProfile.user_type !== role) {
      navigate(`/${userProfile.user_type}/dashboard`, { replace: true })
      return
    }
  }, [user, userProfile, isAuthLoading, role, navigate])

  if (isAuthLoading) {
    return <LoadingScreen onComplete={() => {}} />
  }

  if (!user || !userProfile) {
    return null
  }

  if (role && userProfile.user_type !== role) {
    return null
  }

  return <>{children}</>
}
