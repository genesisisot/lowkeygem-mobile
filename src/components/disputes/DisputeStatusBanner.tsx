import { AlertTriangle, Clock, CheckCircle, MessageSquare, Scale } from 'lucide-react'
import type { Dispute } from '../../types/database'
import { DISPUTE_REASONS, DISPUTE_RESOLUTIONS } from '../../types/database'
import { useCountdown } from '../../hooks/useCountdown'

interface DisputeStatusBannerProps {
  dispute: Dispute
  userRole: 'client' | 'freelancer'
  onRespond?: () => void
}

export function DisputeStatusBanner({ dispute, userRole, onRespond }: DisputeStatusBannerProps) {
  const countdown = useCountdown(dispute.freelancer_response_deadline)

  // Pending Response - Waiting for freelancer
  if (dispute.status === 'pending_response') {
    if (userRole === 'freelancer') {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-orange-900">Dispute Opened Against You</h4>
              <p className="text-sm text-orange-700 mt-1">
                <strong>Reason:</strong> {DISPUTE_REASONS[dispute.reason].label}
              </p>
              <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {countdown.isExpired
                  ? 'Response deadline passed'
                  : `Time to respond: ${countdown.formatted}`
                }
              </p>
              {!countdown.isExpired && onRespond && (
                <button
                  onClick={onRespond}
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Submit Your Response
                </button>
              )}
            </div>
          </div>
        </div>
      )
    } else {
      // Client view
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-purple-900">Dispute Submitted</h4>
              <p className="text-sm text-purple-700 mt-1">
                <strong>Reason:</strong> {DISPUTE_REASONS[dispute.reason].label}
              </p>
              <p className="text-sm text-purple-700 mt-1">
                Waiting for freelancer's response before admin review.
              </p>
              <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {countdown.isExpired
                  ? 'Response deadline passed - Proceeding to admin review'
                  : `Freelancer has ${countdown.formatted} to respond`
                }
              </p>
            </div>
          </div>
        </div>
      )
    }
  }

  // Pending Review - Admin reviewing
  if (dispute.status === 'pending_review') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Scale className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900">Under Admin Review</h4>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Reason:</strong> {DISPUTE_REASONS[dispute.reason].label}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Both parties have submitted their evidence. Our admin team is reviewing the case.
            </p>
            <p className="text-xs text-blue-600 mt-2">
              You will be notified when a decision is made.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Resolved
  if (dispute.status === 'resolved' && dispute.resolution) {
    const isWinner =
      (userRole === 'client' && dispute.resolution === 'refund_client') ||
      (userRole === 'freelancer' && dispute.resolution === 'release_full')

    const isSplit = dispute.resolution === 'split_payment'
    const isFinalRevision = dispute.resolution === 'final_revision'

    let bgColor = 'bg-gray-50 border-gray-200'
    let textColor = 'text-gray-900'
    let Icon = CheckCircle

    if (isWinner) {
      bgColor = 'bg-green-50 border-green-200'
      textColor = 'text-green-900'
    } else if (isSplit) {
      bgColor = 'bg-yellow-50 border-yellow-200'
      textColor = 'text-yellow-900'
    } else if (isFinalRevision) {
      bgColor = 'bg-blue-50 border-blue-200'
      textColor = 'text-blue-900'
    } else {
      bgColor = 'bg-red-50 border-red-200'
      textColor = 'text-red-900'
    }

    return (
      <div className={`${bgColor} border rounded-xl p-4`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${textColor}`} />
          <div className="flex-1">
            <h4 className={`font-medium ${textColor}`}>Dispute Resolved</h4>
            <p className={`text-sm mt-1 ${textColor} opacity-80`}>
              <strong>Decision:</strong> {DISPUTE_RESOLUTIONS[dispute.resolution].label}
            </p>

            {isSplit && dispute.split_freelancer_amount && dispute.split_client_amount && (
              <div className={`text-sm mt-2 ${textColor} opacity-80`}>
                <p>Freelancer receives: ₦{dispute.split_freelancer_amount.toLocaleString()}</p>
                <p>Client refunded: ₦{dispute.split_client_amount.toLocaleString()}</p>
              </div>
            )}

            {dispute.admin_notes && (
              <div className="mt-2 p-2 bg-white/50 rounded-lg">
                <p className={`text-xs ${textColor} opacity-70`}>
                  <strong>Admin Notes:</strong> {dispute.admin_notes}
                </p>
              </div>
            )}

            {dispute.resolved_at && (
              <p className={`text-xs mt-2 ${textColor} opacity-60`}>
                Resolved on {new Date(dispute.resolved_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Compact version for match lists
export function DisputeStatusBadge({ dispute }: { dispute: Dispute }) {
  const statusColors = {
    pending_response: 'bg-orange-100 text-orange-700',
    pending_review: 'bg-blue-100 text-blue-700',
    resolved: 'bg-gray-100 text-gray-700'
  }

  const statusLabels = {
    pending_response: 'Awaiting Response',
    pending_review: 'Under Review',
    resolved: 'Resolved'
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[dispute.status]}`}>
      {statusLabels[dispute.status]}
    </span>
  )
}
