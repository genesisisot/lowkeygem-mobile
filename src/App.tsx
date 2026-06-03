import { useEffect } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useAuth } from './hooks/useAuth'
import { useCapacitor } from './hooks/useCapacitor'
import { authService } from './services/auth'
import { ProtectedRoute } from './ProtectedRoute'
import { ThemeProvider } from './hooks/useTheme'
import { Landing } from './pages/Landing'
import { Login } from './components/Login'
import { Onboarding } from './components/Onboarding'
import { ClientPortal } from './components/ClientPortal'
import { FreelancerPortal } from './components/FreelancerPortal'
import { AdminPortal } from './components/AdminPortal'
import { ClientChatPage } from './pages/ClientChatPage'
import { FreelancerChatPage } from './pages/FreelancerChatPage'
import './index.css'

const isNative = Capacitor.isNativePlatform()

function LandingOrRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    if (isNative) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  if (isNative) return null
  return <Landing />
}

function LoginPage() {
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && userProfile) {
      navigate(`/${userProfile.user_type}/dashboard`, { replace: true })
    }
  }, [user, userProfile, navigate])

  return (
    <Login
      onClose={() => navigate('/')}
      onSignUp={() => navigate('/signup')}
      onLoginSuccess={(userType) => {
        navigate(`/${userType}/dashboard`)
      }}
    />
  )
}

function SignupPage() {
  const navigate = useNavigate()

  return (
    <Onboarding
      onComplete={() => navigate('/login')}
    />
  )
}

function ClientRoute() {
  const { view } = useParams<{ view: string }>()
  const navigate = useNavigate()

  const viewMap: Record<string, string> = {
    dashboard: 'dashboard',
    discover: 'discover',
    matches: 'matches',
    saved: 'saved',
    'my-jobs': 'myJobs',
    'add-job': 'addJob',
    'my-profile': 'myProfile',
    'profile-detail': 'profileDetail',
    wallet: 'wallet',
    support: 'support',
  }

  const handleLogout = async () => {
    await authService.logout()
    localStorage.removeItem('app-profile-cache')
    navigate('/')
  }

  const defaultView = (view && viewMap[view]) || 'dashboard'

  return (
    <ClientPortal onLogout={handleLogout} defaultView={defaultView} />
  )
}

function FreelancerRoute() {
  const { view } = useParams<{ view: string }>()
  const navigate = useNavigate()

  const viewMap: Record<string, string> = {
    dashboard: 'dashboard',
    discover: 'discover',
    matches: 'matches',
    saved: 'saved',
    'my-profile': 'myProfile',
    'my-skills': 'mySkills',
    'add-skill-profile': 'addSkillProfile',
    'profile-detail': 'profileDetail',
    wallet: 'wallet',
    support: 'support',
  }

  const handleLogout = async () => {
    await authService.logout()
    localStorage.removeItem('app-profile-cache')
    navigate('/')
  }

  const defaultView = (view && viewMap[view]) || 'dashboard'

  return (
    <FreelancerPortal onLogout={handleLogout} defaultView={defaultView} />
  )
}

function AdminRoute() {
  const { view } = useParams<{ view: string }>()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authService.logout()
    localStorage.removeItem('app-profile-cache')
    navigate('/')
  }

  const defaultView = view || 'dashboard'

  return (
    <AdminPortal onLogout={handleLogout} defaultView={defaultView} />
  )
}

export default function App() {
  useCapacitor()

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LandingOrRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/client/chat/:matchId" element={<ProtectedRoute role="client"><ClientChatPage /></ProtectedRoute>} />
        <Route path="/client/:view" element={<ProtectedRoute role="client"><ClientRoute /></ProtectedRoute>} />
        <Route path="/client" element={<ProtectedRoute role="client"><ClientRoute /></ProtectedRoute>} />
        <Route path="/freelancer/chat/:matchId" element={<ProtectedRoute role="freelancer"><FreelancerChatPage /></ProtectedRoute>} />
        <Route path="/freelancer/:view" element={<ProtectedRoute role="freelancer"><FreelancerRoute /></ProtectedRoute>} />
        <Route path="/freelancer" element={<ProtectedRoute role="freelancer"><FreelancerRoute /></ProtectedRoute>} />
        <Route path="/admin/:view" element={<ProtectedRoute role="admin"><AdminRoute /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminRoute /></ProtectedRoute>} />
        <Route path="*" element={<LandingOrRedirect />} />
      </Routes>
    </ThemeProvider>
  )
}
