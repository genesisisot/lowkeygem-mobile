import { useState, useEffect } from 'react'
import { ArrowLeft, User, Briefcase, DollarSign, Clock, FileText, Link, Download, ExternalLink, AlertTriangle } from 'lucide-react'
import type { DisputeWithDetails, WorkSubmission, Profile } from '../../types/database'
import { DISPUTE_REASONS } from '../../types/database'
import { disputesService } from '../../services/disputes'
import { workSubmissionsService } from '../../services/workSubmissions'
import { disputeReputationService } from '../../services/disputeReputation'
import { useCountdown } from '../../hooks/useCountdown'
import { EvidencePanel } from './EvidencePanel'
import { ResolutionForm } from './ResolutionForm'
import { DisputeReputationBadge } from './DisputeReputationBadge'

interface DisputeDetailViewProps {
  disputeId: string
  adminId: string
  onBack: () => void
  onResolved: () => void
}

export function DisputeDetailView({
  disputeId,
  adminId,
  onBack,
  onResolved
}: DisputeDetailViewProps) {
  const [dispute, setDispute] = useState<DisputeWithDetails | null>(null)
  const [submissions, setSubmissions] = useState<WorkSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)

  const countdown = useCountdown(
    dispute?.status === 'pending_response' ? dispute.freelancer_response_deadline : null
  )

  useEffect(() => {
    loadDispute()
  }, [disputeId])

  const loadDispute = async () => {
    setLoading(true)
    const { data } = await disputesService.getByIdWithDetails(disputeId)

    if (data) {
      setDispute(data)

      // Load work submissions for this match
      const { data: subs } = await workSubmissionsService.getByMatchId(data.match_id)
      if (subs) {
        setSubmissions(subs)
      }
    }

    setLoading(false)
  }

  const handleResolve = async (
    resolution: 'release_full' | 'refund_client' | 'split_payment' | 'final_revision',
    adminNotes: string,
    splitFreelancerAmount?: number,
    splitClientAmount?: number
  ) => {
    if (!dispute) return

    setResolving(true)
    const { error } = await disputesService.resolve(
      disputeId,
      adminId,
      resolution,
      adminNotes,
      splitFreelancerAmount,
      splitClientAmount
    )

    if (!error) {
      // Update reputation tracking
      await disputeReputationService.updateAfterResolution(
        dispute.client_id,
        dispute.freelancer_id,
        resolution
      )

      onResolved()
    }

    setResolving(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading dispute...</p>
        </div>
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Dispute not found</h3>
          <button
            onClick={onBack}
            className="mt-4 text-purple-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  const escrowAmount = dispute.match?.contract_amount || 0

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Dispute Review</h1>
          <p className="text-sm text-gray-500">
            {DISPUTE_REASONS[dispute.reason].label}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          dispute.status === 'pending_response' ? 'bg-orange-100 text-orange-700' :
          dispute.status === 'pending_review' ? 'bg-blue-100 text-blue-700' :
          'bg-green-100 text-green-700'
        }`}>
          {dispute.status === 'pending_response' ? 'Awaiting Response' :
           dispute.status === 'pending_review' ? 'Ready for Review' :
           'Resolved'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Overview Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Escrow Amount */}
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">₦{escrowAmount.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Escrow Amount</p>
            </div>

            {/* Opened Date */}
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Clock className="w-6 h-6 text-gray-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-gray-900">{formatDate(dispute.created_at)}</p>
              <p className="text-xs text-gray-500">Opened</p>
            </div>

            {/* Revisions */}
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{submissions.length}</p>
              <p className="text-xs text-gray-500">Work Submissions</p>
            </div>

            {/* Response Deadline */}
            {dispute.status === 'pending_response' && (
              <div className={`text-center p-3 rounded-lg ${
                countdown.isExpired ? 'bg-red-50' : 'bg-orange-50'
              }`}>
                <Clock className={`w-6 h-6 mx-auto mb-1 ${
                  countdown.isExpired ? 'text-red-600' : 'text-orange-600'
                }`} />
                <p className={`text-sm font-bold ${
                  countdown.isExpired ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {countdown.isExpired ? 'Expired' : countdown.formatted}
                </p>
                <p className="text-xs text-gray-500">Response Time</p>
              </div>
            )}
          </div>
        </div>

        {/* Parties Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Client */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                {dispute.client?.avatar_url ? (
                  <img src={dispute.client.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-purple-600" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{dispute.client?.full_name}</p>
                <p className="text-xs text-gray-500">Client (Complainant)</p>
              </div>
            </div>
            <DisputeReputationBadge userId={dispute.client_id} />
          </div>

          {/* Freelancer */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                {dispute.freelancer?.avatar_url ? (
                  <img src={dispute.freelancer.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-pink-600" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{dispute.freelancer?.full_name}</p>
                <p className="text-xs text-gray-500">Freelancer (Respondent)</p>
              </div>
            </div>
            <DisputeReputationBadge userId={dispute.freelancer_id} />
          </div>
        </div>

        {/* Job/Project Info */}
        {dispute.match?.job && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Job Details</h3>
            </div>
            <p className="text-lg font-medium text-gray-900">{dispute.match.job.title}</p>
            {dispute.match.job.description && (
              <p className="text-sm text-gray-600 mt-2">{dispute.match.job.description}</p>
            )}
          </div>
        )}

        {/* Evidence Section - Side by Side */}
        <EvidencePanel
          dispute={dispute}
          submissions={submissions}
        />

        {/* Resolution Section */}
        {dispute.status !== 'resolved' && (
          <div className="mt-6">
            <ResolutionForm
              escrowAmount={escrowAmount}
              canResolve={dispute.status === 'pending_review' || countdown.isExpired}
              onResolve={handleResolve}
              isLoading={resolving}
            />
          </div>
        )}

        {/* Already Resolved */}
        {dispute.status === 'resolved' && dispute.resolution && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-2">Resolution</h3>
            <p className="text-green-800">
              <strong>Decision:</strong>{' '}
              {dispute.resolution === 'release_full' && 'Full payment released to freelancer'}
              {dispute.resolution === 'refund_client' && 'Full refund issued to client'}
              {dispute.resolution === 'split_payment' && `Split payment: Freelancer ₦${dispute.split_freelancer_amount?.toLocaleString()}, Client ₦${dispute.split_client_amount?.toLocaleString()}`}
              {dispute.resolution === 'final_revision' && 'Final revision requested'}
            </p>
            {dispute.admin_notes && (
              <p className="text-sm text-green-700 mt-2">
                <strong>Notes:</strong> {dispute.admin_notes}
              </p>
            )}
            <p className="text-xs text-green-600 mt-2">
              Resolved on {formatDate(dispute.resolved_at!)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
