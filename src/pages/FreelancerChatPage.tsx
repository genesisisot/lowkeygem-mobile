import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FreelancerLayout } from '../components/FreelancerLayout'
import { ChatInterface } from '../components/ChatInterface'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { authService } from '../services/auth'
import { matchesService } from '../services/matches'
import { ratingsService } from '../services/ratings'
import type { DisputeReason, WorkSubmissionFile } from '../types/database'

export function FreelancerChatPage() {
  const { user } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const navigate = useNavigate()
  const { matchId } = useParams<{ matchId: string }>()
  const [matchData, setMatchData] = useState<any>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)

  useEffect(() => {
    if (!matchId || !user) return
    matchesService.getById(matchId).then(({ data }) => {
      if (data) setMatchData(data)
    })
  }, [matchId, user])

  const handleLogout = async () => {
    await authService.logout()
    localStorage.removeItem('app-profile-cache')
    navigate('/')
  }

  const handleRatingSubmit = async (rating: number, review: string) => {
    if (!matchData || !user?.id) return

    try {
      const match = matchData
      const { error } = await ratingsService.create({
        match_id: matchId!,
        rater_id: user.id,
        rated_id: match.client_id,
        rating,
        review: review || null,
      })

      if (error) {
        toastError('Failed to submit rating. Please try again.')
        return
      }

      await matchesService.delete(matchId!)

      setTimeout(() => {
        setShowRatingModal(false)
        navigate('/freelancer/matches')
      }, 1500)
    } catch (err) {
      console.error('Error submitting rating:', err)
      toastError('Failed to submit rating.')
    }
  }

  const handleCloseRatingModal = () => {
    setShowRatingModal(false)
    navigate('/freelancer/matches')
  }

  const handleOpenDispute = async (reason: DisputeReason, explanation: string, evidence: WorkSubmissionFile[]) => {
    try {
      const { error } = await matchesService.openDispute(matchId!, reason, explanation, evidence)
      if (error) {
        toastError('Failed to open dispute. Please try again.')
        return
      }
      toastSuccess('Dispute opened.')
      setMatchData((prev: any) => prev ? { ...prev, status: 'disputed' } : null)
    } catch (err) {
      console.error('Error opening dispute:', err)
      toastError('Failed to open dispute.')
    }
  }

  const handleRespondToDispute = async (response: string, evidence: WorkSubmissionFile[]) => {
    try {
      const { error } = await matchesService.respondToDispute(matchId!, response, evidence)
      if (error) {
        toastError('Failed to respond to dispute. Please try again.')
        return
      }
      toastSuccess('Response submitted.')
    } catch (err) {
      console.error('Error responding to dispute:', err)
      toastError('Failed to respond to dispute.')
    }
  }

  if (!matchId || !matchData) {
    return (
      <FreelancerLayout activeView="chat" onLogout={handleLogout}>
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--bx-muted)' }}>
          {!matchId ? 'No match selected' : 'Loading chat...'}
        </div>
      </FreelancerLayout>
    )
  }

  const otherUser = {
    name: matchData.client?.full_name || matchData.client?.company_name || 'Client',
    avatar: matchData.client?.avatar_url || null,
    isOnline: true,
  }
  const jobTitle = matchData.job?.title || 'Project'
  const userType = matchData.client_id === user?.id ? 'client' : 'freelancer'

  return (
    <FreelancerLayout activeView="chat" onLogout={handleLogout}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--bx-bg)', paddingTop: 0 }}>
        <ChatInterface
          otherUser={otherUser}
          jobTitle={jobTitle}
          onClose={() => { navigate('/freelancer/matches') }}
          onDelete={async () => {
            await matchesService.delete(matchId)
            navigate('/freelancer/matches')
          }}
          userType={userType as 'client' | 'freelancer'}
          paymentStatus={matchData.status || 'matched'}
          contractAmount={matchData.contract_amount || matchData.job?.budget || 0}
          onFundEscrow={async () => {}}
          onApproveRelease={async () => {}}
          showRatingModal={showRatingModal}
          onRatingSubmit={handleRatingSubmit}
          onCloseRatingModal={handleCloseRatingModal}
          matchId={matchId}
          match={matchData}
          revisionCount={matchData.revision_count || 0}
          reviewDeadline={matchData.review_deadline || null}
          workSubmissions={[]}
          onOpenDispute={handleOpenDispute}
          onRespondToDispute={handleRespondToDispute}
          currentUserId={user?.id}
          otherUserId={matchData.freelancer_id || matchData.client_id}
        />
      </div>
    </FreelancerLayout>
  )
}
