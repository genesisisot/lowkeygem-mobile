import { useState } from 'react'
import { FileText, Image, File, Link, Download, ExternalLink, ChevronDown, ChevronUp, Clock, User } from 'lucide-react'
import type { DisputeWithDetails, WorkSubmission, WorkSubmissionFile } from '../../types/database'
import { DISPUTE_REASONS } from '../../types/database'

interface EvidencePanelProps {
  dispute: DisputeWithDetails
  submissions: WorkSubmission[]
}

export function EvidencePanel({ dispute, submissions }: EvidencePanelProps) {
  const [showAllSubmissions, setShowAllSubmissions] = useState(false)

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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderFiles = (files: WorkSubmissionFile[] | null | undefined, label: string) => {
    if (!files || files.length === 0) {
      return (
        <p className="text-sm text-gray-400 italic">No files attached</p>
      )
    }

    return (
      <div className="space-y-2">
        {files.map((file, index) => (
          <a
            key={index}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            {getFileIcon(file.type)}
            <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
            <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
            <Download className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Side-by-Side Evidence Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client's Case */}
        <div className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden">
          <div className="p-3 bg-purple-50 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Client's Case</h3>
                <p className="text-xs text-purple-600">{dispute.client?.full_name}</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            {/* Reason */}
            <div className="mb-4">
              <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded mb-2">
                {DISPUTE_REASONS[dispute.reason].label}
              </span>
              <p className="text-xs text-gray-500">
                {DISPUTE_REASONS[dispute.reason].description}
              </p>
            </div>

            {/* Explanation */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Explanation</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {dispute.client_explanation}
                </p>
              </div>
            </div>

            {/* Evidence Files */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Evidence ({dispute.client_evidence?.length || 0} files)
              </h4>
              {renderFiles(dispute.client_evidence, 'Client')}
            </div>
          </div>
        </div>

        {/* Freelancer's Response */}
        <div className="bg-white rounded-xl border-2 border-pink-200 overflow-hidden">
          <div className="p-3 bg-pink-50 border-b border-pink-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                <User className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-pink-900">Freelancer's Response</h3>
                <p className="text-xs text-pink-600">{dispute.freelancer?.full_name}</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            {dispute.freelancer_response ? (
              <>
                {/* Response */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Response</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {dispute.freelancer_response}
                    </p>
                  </div>
                  {dispute.freelancer_responded_at && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Responded {formatDate(dispute.freelancer_responded_at)}
                    </p>
                  )}
                </div>

                {/* Evidence Files */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Counter-Evidence ({dispute.freelancer_evidence?.length || 0} files)
                  </h4>
                  {renderFiles(dispute.freelancer_evidence, 'Freelancer')}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">No response yet</p>
                <p className="text-sm text-gray-400">
                  {dispute.freelancer_response_deadline && (
                    <>Deadline: {formatDate(dispute.freelancer_response_deadline)}</>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Work Submission History */}
      {submissions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowAllSubmissions(!showAllSubmissions)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Work Submission History</h3>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {submissions.length} submission{submissions.length > 1 ? 's' : ''}
              </span>
            </div>
            {showAllSubmissions ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showAllSubmissions && (
            <div className="border-t border-gray-100 p-4 space-y-4">
              {submissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className={`p-4 rounded-lg border ${
                    index === submissions.length - 1
                      ? 'border-purple-200 bg-purple-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === submissions.length - 1
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {submission.submission_number}
                      </span>
                      <span className="font-medium text-gray-900">
                        Submission #{submission.submission_number}
                      </span>
                      {index === submissions.length - 1 && (
                        <span className="px-2 py-0.5 bg-purple-200 text-purple-700 text-xs rounded-full">
                          Latest
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(submission.submitted_at)}
                    </span>
                  </div>

                  {submission.notes && (
                    <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                      {submission.notes}
                    </p>
                  )}

                  {/* Links */}
                  {submission.links && submission.links.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Links:</p>
                      <div className="flex flex-wrap gap-2">
                        {submission.links.map((link, linkIndex) => (
                          <a
                            key={linkIndex}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 bg-white rounded text-xs text-purple-600 hover:bg-purple-50"
                          >
                            <Link className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{link}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files */}
                  {submission.files && submission.files.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Files:</p>
                      <div className="flex flex-wrap gap-2">
                        {submission.files.map((file, fileIndex) => (
                          <a
                            key={fileIndex}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 bg-white rounded text-xs text-gray-600 hover:bg-gray-100"
                          >
                            {getFileIcon(file.type)}
                            <span className="truncate max-w-[100px]">{file.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
