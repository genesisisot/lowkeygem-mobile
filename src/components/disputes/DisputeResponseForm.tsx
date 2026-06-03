import { useState, useRef } from 'react'
import { MessageSquare, Upload, X, FileText, Image, File, Loader2, Clock, AlertCircle } from 'lucide-react'
import type { Dispute, WorkSubmissionFile } from '../../types/database'
import { DISPUTE_REASONS } from '../../types/database'
import { useCountdown, getUrgencyLevel } from '../../hooks/useCountdown'
import { storageService } from '../../services/storage'

interface DisputeResponseFormProps {
  dispute: Dispute
  matchId: string
  onSubmit: (response: string, evidence: WorkSubmissionFile[]) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function DisputeResponseForm({
  dispute,
  matchId,
  onSubmit,
  onCancel,
  isLoading = false
}: DisputeResponseFormProps) {
  const [response, setResponse] = useState('')
  const [evidence, setEvidence] = useState<WorkSubmissionFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const countdown = useCountdown(dispute.freelancer_response_deadline)
  const urgencyLevel = getUrgencyLevel(countdown)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setError(null)

    try {
      for (const file of Array.from(selectedFiles)) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`File "${file.name}" is too large. Maximum size is 10MB.`)
          continue
        }

        const { url, error: uploadError } = await storageService.uploadWorkSubmission(
          matchId,
          file
        )

        if (uploadError) {
          setError(`Failed to upload "${file.name}": ${uploadError.message}`)
          continue
        }

        if (url) {
          setEvidence(prev => [...prev, {
            url,
            name: file.name,
            type: file.type,
            size: file.size
          }])
        }
      }
    } catch (err) {
      setError('Failed to upload files. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveFile = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (response.trim().length < 100) {
      setError('Please provide at least 100 characters in your response.')
      return
    }

    setError(null)
    await onSubmit(response.trim(), evidence)
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

  const getTimerColor = () => {
    switch (urgencyLevel) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-purple-600 bg-purple-50 border-purple-200'
    }
  }

  if (countdown.isExpired) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Period Expired</h3>
        <p className="text-gray-500">
          The 48-hour response window has passed. The dispute will be reviewed by admin based on available evidence.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6" />
          <div>
            <h3 className="text-lg font-semibold">Respond to Dispute</h3>
            <p className="text-sm text-purple-100">
              Provide your side of the story
            </p>
          </div>
        </div>
      </div>

      {/* Timer Banner */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${getTimerColor()}`}>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">
            Time to respond: {countdown.formatted}
          </span>
        </div>
        {urgencyLevel === 'critical' && (
          <span className="text-xs font-medium px-2 py-1 bg-white/20 rounded-full">
            Urgent
          </span>
        )}
      </div>

      {/* Client's Complaint */}
      <div className="p-4 bg-gray-50 border-b">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Client's Complaint</h4>
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
              {DISPUTE_REASONS[dispute.reason].label}
            </span>
          </div>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {dispute.client_explanation}
          </p>
          {dispute.client_evidence && dispute.client_evidence.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">
                {dispute.client_evidence.length} evidence file(s) attached
              </p>
              <div className="flex flex-wrap gap-2">
                {dispute.client_evidence.map((file, index) => (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    {getFileIcon(file.type)}
                    <span className="truncate max-w-[100px]">{file.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Response */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Response <span className="text-red-500">*</span>
          </label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Explain your side of the story. Address the client's concerns and provide context for your work..."
            className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={5}
            minLength={100}
          />
          <p className="mt-1 text-xs text-gray-500">
            {response.length}/100 characters minimum
          </p>
        </div>

        {/* Evidence Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Counter-Evidence (Recommended)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Upload any files that support your case - work files, communication screenshots, etc.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.zip,.rar"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-gray-500"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Click to upload evidence files</span>
              </>
            )}
          </button>

          {evidence.length > 0 && (
            <div className="mt-2 space-y-2">
              {evidence.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  {getFileIcon(file.type)}
                  <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs text-blue-800">
            Your response and evidence will be reviewed by our admin team alongside the client's complaint.
            Make sure to provide all relevant information to support your case.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-white transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || uploading || response.trim().length < 100}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              <span>Submit Response</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
