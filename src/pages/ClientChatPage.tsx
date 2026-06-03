import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ClientLayout } from '../components/ClientLayout'
import { ChatInterface } from '../components/ChatInterface'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { authService } from '../services/auth'
import { matchesService } from '../services/matches'
import { ratingsService } from '../services/ratings'
import type { DisputeReason, WorkSubmissionFile } from '../types/database'

export function ClientChatPage() {
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

  const handleFundEscrow = async () => {
    try {
      const amount = matchData?.job?.budget || matchData?.contract_amount || 0
      const { error } = await matchesService.fundProject(matchId!, amount)
      if (error) {
        toastError('Failed to fund escrow. Please try again.')
        return
      }
      toastSuccess('Payment secured in escrow!')
      setMatchData((prev: any) => prev ? { ...prev, status: 'funded' } : null)
    } catch (err) {
      console.error('Error funding escrow:', err)
      toastError('Failed to fund escrow. Please try again.')
    }
  }

  const handleApproveRelease = async () => {
    try {
      const { error } = await matchesService.approveWork(matchId!)
      if (error) {
        toastError('Failed to approve work. Please try again.')
        return
      }
      toastSuccess('Job completed — Payment released!')
      setShowRatingModal(true)
    } catch (err) {
      console.error('Error approving work:', err)
      toastError('Failed to approve work. Please try again.')
    }
  }

  const handleRatingSubmit = async (rating: number, review: string) => {
    try {
      const match = matchData
      if (!match || !user?.id) return

      await ratingsService.create({
        match_id: matchId!,
        rater_id: user.id,
        rated_id: match.freelancer_id,
        rating,
        review: review || null,
      })

      await matchesService.delete(matchId!)

      setTimeout(() => {
        setShowRatingModal(false)
        navigate('/client/matches')
      }, 1500)
    } catch (err) {
      console.error('Error submitting rating:', err)
      toastError('Failed to submit rating.')
    }
  }

  const handleCloseRatingModal = () => {
    setShowRatingModal(false)
    navigate('/client/matches')
  }

  const handleRequestRevision = async () => {
    try {
      const { error, maxRevisionsReached } = await matchesService.requestRevision(matchId!)
      if (error) {
        if (maxRevisionsReached) {
          toastError('Maximum revisions reached.')
        } else {
          toastError('Failed to request revision. Please try again.')
        }
        return
      }
      toastSuccess('Revision requested!')
      setMatchData((prev: any) => prev ? { ...prev, revision_count: (prev.revision_count || 0) + 1 } : null)
    } catch (err) {
      console.error('Error requesting revision:', err)
      toastError('Failed to request revision.')
    }
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
      <ClientLayout activeView="chat" onLogout={handleLogout}>
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--bx-muted)' }}>
          {!matchId ? 'No match selected' : 'Loading chat...'}
        </div>
      </ClientLayout>
    )
  }

  const otherUser = {
    name: matchData.freelancer?.full_name || matchData.client?.full_name || 'User',
    avatar: matchData.freelancer?.avatar_url || matchData.client?.avatar_url || null,
    isOnline: true,
  }
  const jobTitle = matchData.skill_profile?.headline || matchData.job?.title || 'Project'
  const userType = matchData.client_id === user?.id ? 'client' : 'freelancer'

  return (
    <ClientLayout activeView="chat" onLogout={handleLogout}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--bx-bg)', paddingTop: 0 }}>
        <ChatInterface
          otherUser={otherUser}
          jobTitle={jobTitle}
          onClose={() => { navigate('/client/matches') }}
          onDelete={async () => {
            await matchesService.delete(matchId)
            navigate('/client/matches')
          }}
          userType={userType as 'client' | 'freelancer'}
          paymentStatus={matchData.status || 'matched'}
          contractAmount={matchData.contract_amount || matchData.job?.budget || 0}
          onFundEscrow={handleFundEscrow}
          onApproveRelease={handleApproveRelease}
          showRatingModal={showRatingModal}
          onRatingSubmit={handleRatingSubmit}
          onCloseRatingModal={handleCloseRatingModal}
          matchId={matchId}
          match={matchData}
          revisionCount={matchData.revision_count || 0}
          reviewDeadline={matchData.review_deadline || null}
          workSubmissions={[]}
          onRequestRevision={handleRequestRevision}
          onOpenDispute={handleOpenDispute}
          onRespondToDispute={handleRespondToDispute}
          currentUserId={user?.id}
          otherUserId={matchData.freelancer_id || matchData.client_id}
        />
      </div>
    </ClientLayout>
  )
}
