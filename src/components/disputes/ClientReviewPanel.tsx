import { useState } from 'react'
import { CheckCircle, RefreshCw, AlertTriangle, Clock, Loader2, FileText, ChevronDown } from 'lucide-react'
import type { WorkSubmission, MatchWithProfiles } from '../../types/database'
import { useCountdown, getUrgencyLevel } from '../../hooks/useCountdown'
import { WorkSubmissionView } from './WorkSubmissionView'
import { MAX_REVISIONS } from '../../services/matches'

interface ClientReviewPanelProps {
  match: MatchWithProfiles
  submissions: WorkSubmission[]
  onApprove: () => Promise<void>
  onRequestRevision: () => Promise<void>
  onOpenDispute: () => void
  isLoading?: boolean
}

export function ClientReviewPanel({
  match,
  submissions,
  onApprove,
  onRequestRevision,
  onOpenDispute,
  isLoading = false
}: ClientReviewPanelProps) {
  const [action, setAction] = useState<'approve' | 'revision' | null>(null)
  // Expanded by default — when work has been submitted, reviewing it is the focus.
  const [isCollapsed, setIsCollapsed] = useState(false)

  const countdown = useCountdown(match.review_deadline)
  const urgencyLevel = getUrgencyLevel(countdown)
  const revisionCapReached = (match.revision_count || 0) >= MAX_REVISIONS
  const latestSubmission = submissions[submissions.length - 1]

  // Approve opens the parent's confirmation modal (amount + irreversibility),
  // so this just delegates upward.
  const handleApprove = async () => {
    await onApprove()
  }

  const handleRequestRevision = async () => {
    setAction('revision')
    await onRequestRevision()
    setAction(null)
  }

  const getTimerColor = () => {
    switch (urgencyLevel) {
      case 'critical': return 'tx-red sf-red bd-red'
      case 'warning': return 'tx-amber sf-amber bd-amber'
      default: return 'tx-green sf-green bd-green'
    }
  }

  return (
    <div className="sf-card border-b bd-line shadow-sm">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-4 py-3 accent-bg text-white flex items-center justify-between accent-hover-darken transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <div className="text-left">
            <h3 className="text-sm font-semibold">Review Submitted Work</h3>
            <p className="text-xs text-pink-100">
              {countdown.isExpired ? (
                'Review period expired'
              ) : (
                `Time remaining: ${countdown.formatted}`
              )}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
      </button>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Work Submission */}
          {latestSubmission ? (
            <WorkSubmissionView submissions={[latestSubmission]} />
          ) : (
            <div className="text-center tx-muted py-6 text-sm sf-card2 rounded-2xl">
              No submission to review
            </div>
          )}

          {/* View all submissions link */}
          {submissions.length > 1 && (
            <details>
              <summary className="text-sm accent-text cursor-pointer hover:underline">
                View all {submissions.length} submissions
              </summary>
              <div className="mt-3">
                <WorkSubmissionView submissions={submissions} showAll />
              </div>
            </details>
          )}

          {/* Revision Counter */}
          <div className="flex items-center justify-between p-3 sf-card2 rounded-xl">
            <span className="text-xs font-medium tx-soft">Revisions Used</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: MAX_REVISIONS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i < (match.revision_count || 0) ? 'accent-bg' : 'sf-solid'
                  }`}
                />
              ))}
              <span className="ml-2 text-xs font-semibold tx-ink">
                {match.revision_count || 0}/{MAX_REVISIONS}
              </span>
            </div>
          </div>
          {revisionCapReached && (
            <p className="text-xs tx-amber text-center -mt-1">
              Maximum revisions reached — approve the work or open a dispute.
            </p>
          )}

          {/* Actions */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleApprove}
              disabled={isLoading || action !== null}
              className="w-full sf-green-solid text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <CheckCircle className="w-5 h-5" />
              Approve & Release Payment
            </button>
            <div className="flex gap-2">
              {!revisionCapReached && (
                <button
                  onClick={handleRequestRevision}
                  disabled={isLoading || action !== null}
                  className="flex-1 sf-card border-2 bd-amber hover-card2 tx-amber px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {action === 'revision' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Request Revision
                </button>
              )}
              <button
                onClick={onOpenDispute}
                disabled={isLoading || action !== null}
                className="flex-1 sf-card border-2 bd-red hover-red-bg tx-red px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <AlertTriangle className="w-4 h-4" />
                Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
