import { Clock, User, Briefcase, DollarSign, AlertTriangle, ChevronRight } from 'lucide-react'
import type { DisputeWithDetails } from '../../types/database'
import { DISPUTE_REASONS } from '../../types/database'
import { useCountdown } from '../../hooks/useCountdown'

interface DisputeCardProps {
  dispute: DisputeWithDetails
  onClick: () => void
}

export function DisputeCard({ dispute, onClick }: DisputeCardProps) {
  const countdown = useCountdown(
    dispute.status === 'pending_response' ? dispute.freelancer_response_deadline : null
  )

  const getStatusBadge = () => {
    switch (dispute.status) {
      case 'pending_response':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            Awaiting Response
          </span>
        )
      case 'pending_review':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Ready for Review
          </span>
        )
      case 'resolved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Resolved
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const escrowAmount = dispute.match?.contract_amount || 0

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl border border-gray-200 p-4 hover:border-purple-300 hover:shadow-md transition-all text-left"
    >
      <div className="flex items-start gap-4">
        {/* Priority Indicator */}
        <div className={`w-1 h-full min-h-[80px] rounded-full ${
          dispute.status === 'pending_review' ? 'bg-blue-500' :
          dispute.status === 'pending_response' ? 'bg-orange-500' :
          'bg-gray-300'
        }`} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">
                {DISPUTE_REASONS[dispute.reason].label}
              </h3>
              <p className="text-xs text-gray-500">
                Opened {formatDate(dispute.created_at)}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Job/Project Info */}
          {dispute.match?.job && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span className="truncate">{dispute.match.job.title}</span>
            </div>
          )}

          {/* Parties */}
          <div className="flex items-center gap-4 text-sm mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                <User className="w-3 h-3 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Client</p>
                <p className="font-medium text-gray-900 truncate max-w-[120px]">
                  {dispute.client?.full_name || 'Unknown'}
                </p>
              </div>
            </div>
            <div className="text-gray-300">vs</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                <User className="w-3 h-3 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Freelancer</p>
                <p className="font-medium text-gray-900 truncate max-w-[120px]">
                  {dispute.freelancer?.full_name || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Escrow Amount */}
              <div className="flex items-center gap-1 text-sm">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="font-medium text-gray-900">
                  ₦{escrowAmount.toLocaleString()}
                </span>
              </div>

              {/* Response Deadline (if pending response) */}
              {dispute.status === 'pending_response' && (
                <div className={`flex items-center gap-1 text-xs ${
                  countdown.isExpired ? 'text-red-600' : 'text-orange-600'
                }`}>
                  <Clock className="w-3 h-3" />
                  {countdown.isExpired ? 'Expired' : countdown.formatted}
                </div>
              )}

              {/* Evidence Indicators */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>
                  {dispute.client_evidence?.length || 0} client files
                </span>
                {dispute.freelancer_evidence && dispute.freelancer_evidence.length > 0 && (
                  <span>
                    {dispute.freelancer_evidence.length} freelancer files
                  </span>
                )}
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </button>
  )
}
