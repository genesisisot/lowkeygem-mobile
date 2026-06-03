import { createRoot } from 'react-dom/client'
import { StrictMode, type ReactNode } from 'react'
import { ToastProvider } from '../components/Toast'
import { LoadingScreen } from '../components/LoadingScreen'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useAuth } from '../hooks/useAuth'
import '../index.css'

interface PageEntryConfig {
  /** Which role is allowed to see this page */
  role?: 'client' | 'freelancer' | 'admin'
  /** The page content (inside ToastProvider + auth guard) */
  page: ReactNode
  /** Optional wrapper layout injected between ToastProvider and auth guard */
  layout?: (props: { children: ReactNode }) => ReactNode
}

function PageShell({ role, page, layout }: PageEntryConfig) {
  const { user, userProfile, isAuthLoading } = useAuth()

  if (isAuthLoading) {
    return <LoadingScreen onComplete={() => {}} />
  }

  if (role) {
    if (!user || !userProfile) {
      window.location.href = '/login'
      return null
    }
    if (userProfile.user_type !== role) {
      window.location.href = `/${userProfile.user_type}/dashboard`
      return null
    }
  }

  const content = layout
    ? (() => {
        const L = layout
        return <L>{page}</L>
      })()
    : page

  return (
    <ErrorBoundary>
      <div className="w-full overflow-x-hidden" style={{ fontFamily: 'var(--font-effra)' }}>{content}</div>
    </ErrorBoundary>
  )
}

export function createPageEntry(config: PageEntryConfig) {
  const root = document.getElementById('root')
  if (!root) {
    console.error('#root element not found')
    return
  }
  createRoot(root).render(
    <StrictMode>
      <ToastProvider>
        <PageShell {...config} />
      </ToastProvider>
    </StrictMode>,
  )
}
