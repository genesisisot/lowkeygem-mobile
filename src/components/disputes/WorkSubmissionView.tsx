import { useState } from 'react'
import { FileText, Image, File, Link, ExternalLink, Download, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import type { WorkSubmission } from '../../types/database'

interface WorkSubmissionViewProps {
  submissions: WorkSubmission[]
  showAll?: boolean
}

export function WorkSubmissionView({ submissions, showAll = false }: WorkSubmissionViewProps) {
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(
    new Set(submissions.length > 0 ? [submissions[submissions.length - 1].id] : [])
  )

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedSubmissions)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSubmissions(newExpanded)
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // If not showing all, only show the latest submission
  const displaySubmissions = showAll ? submissions : submissions.slice(-1)

  if (displaySubmissions.length === 0) {
    return (
      <div className="sf-card2 rounded-2xl p-8 text-center">
        <FileText className="w-12 h-12 tx-faint mx-auto mb-3" />
        <p className="tx-muted">No work has been submitted yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {displaySubmissions.map((submission, index) => {
        const isExpanded = expandedSubmissions.has(submission.id)
        const isLatest = index === displaySubmissions.length - 1
        const linkCount = submission.links?.length || 0
        const fileCount = submission.files?.length || 0

        return (
          <div
            key={submission.id}
            className={`sf-card rounded-2xl border ${isLatest ? 'bd-purple' : 'bd-line'} overflow-hidden`}
          >
            {/* Header */}
            <button
              onClick={() => toggleExpanded(submission.id)}
              className="w-full flex items-center justify-between p-4 hover-card2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${isLatest ? 'sf-purple tx-purple' : 'sf-card2 tx-soft'}`}>
                  {submission.submission_number}
                </div>
                <div className="text-left">
                  <p className="font-semibold tx-ink">
                    Submission #{submission.submission_number}
                    {isLatest && <span className="ml-2 text-xs tx-purple font-normal">(Latest)</span>}
                  </p>
                  <p className="text-xs tx-muted flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(submission.submitted_at)}
                    {(linkCount > 0 || fileCount > 0) && (
                      <span className="flex items-center gap-2 ml-1">
                        {fileCount > 0 && <span className="flex items-center gap-1"><File className="w-3 h-3" />{fileCount}</span>}
                        {linkCount > 0 && <span className="flex items-center gap-1"><Link className="w-3 h-3" />{linkCount}</span>}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 tx-muted flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 tx-muted flex-shrink-0" />
              )}
            </button>

            {/* Content */}
            {isExpanded && (
              <div className="px-4 pb-5 border-t bd-line space-y-5">
                {/* Notes */}
                <div className="mt-5">
                  <h4 className="text-xs font-semibold tx-soft uppercase tracking-wide mb-2">Work Description</h4>
                  <p className="text-sm tx-ink whitespace-pre-wrap sf-card2 p-4 rounded-xl leading-relaxed">
                    {submission.notes || 'No description provided.'}
                  </p>
                </div>

                {/* Links */}
                {linkCount > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold tx-soft uppercase tracking-wide mb-2">Links ({linkCount})</h4>
                    <div className="space-y-2">
                      {submission.links!.map((link, linkIndex) => (
                        <a
                          key={linkIndex}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 sf-card2 rounded-xl hover-card2 transition-colors group"
                        >
                          <Link className="w-4 h-4 tx-purple flex-shrink-0" />
                          <span className="flex-1 text-sm tx-purple truncate group-hover:underline">
                            {link}
                          </span>
                          <ExternalLink className="w-4 h-4 tx-muted flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                {fileCount > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold tx-soft uppercase tracking-wide mb-2">Files ({fileCount})</h4>
                    <div className="space-y-2">
                      {submission.files!.map((file, fileIndex) => (
                        <div
                          key={fileIndex}
                          className="flex items-center gap-3 p-3 sf-card2 rounded-xl"
                        >
                          <span className="tx-purple flex-shrink-0">{getFileIcon(file.type)}</span>
                          <span className="flex-1 text-sm tx-ink truncate">
                            {file.name}
                          </span>
                          <span className="text-xs tx-muted flex-shrink-0">
                            {formatFileSize(file.size)}
                          </span>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 tx-purple hover-card2 rounded-lg transition-colors flex-shrink-0"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No attachments message */}
                {linkCount === 0 && fileCount === 0 && (
                  <p className="text-sm tx-faint italic">
                    No links or files attached to this submission.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Component to show just the latest submission in a compact view
export function LatestSubmissionPreview({ submission }: { submission: WorkSubmission }) {
  return (
    <div className="sf-purple rounded-2xl p-4 border bd-purple">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full sf-card flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 tx-purple" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold tx-ink">
            Work Submitted (Revision #{submission.submission_number})
          </p>
          <p className="text-sm tx-soft mt-1 line-clamp-2">
            {submission.notes || 'No description provided.'}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs tx-muted">
            {submission.files && submission.files.length > 0 && (
              <span className="flex items-center gap-1">
                <File className="w-3 h-3" />
                {submission.files.length} file{submission.files.length > 1 ? 's' : ''}
              </span>
            )}
            {submission.links && submission.links.length > 0 && (
              <span className="flex items-center gap-1">
                <Link className="w-3 h-3" />
                {submission.links.length} link{submission.links.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
