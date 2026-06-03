import { useState, useRef } from 'react'
import { AlertTriangle, Upload, X, FileText, Image, File, Loader2, ChevronDown } from 'lucide-react'
import type { DisputeReason, WorkSubmissionFile } from '../../types/database'
import { DISPUTE_REASONS } from '../../types/database'
import { storageService } from '../../services/storage'

interface DisputeInitiationFormProps {
  matchId: string
  contractAmount: number
  onSubmit: (reason: DisputeReason, explanation: string, evidence: WorkSubmissionFile[]) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function DisputeInitiationForm({
  matchId,
  contractAmount,
  onSubmit,
  onCancel,
  isLoading = false
}: DisputeInitiationFormProps) {
  const [reason, setReason] = useState<DisputeReason | ''>('')
  const [explanation, setExplanation] = useState('')
  const [evidence, setEvidence] = useState<WorkSubmissionFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

        const { url, error: uploadError } = await storageService.uploadDisputeEvidence(
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
    if (!reason) {
      setError('Please select a dispute reason.')
      return
    }

    if (explanation.trim().length < 100) {
      setError('Please provide at least 100 characters explaining the issue.')
      return
    }

    setError(null)
    await onSubmit(reason, explanation.trim(), evidence)
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

  return (
    <div className="sf-card rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 accent-bg">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-white" />
          <div>
            <h3 className="text-lg font-semibold text-white">Open a Dispute</h3>
            <p className="text-sm text-white">
              Escrow Amount: <span className="font-bold">₦{contractAmount.toLocaleString()}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="p-4 bg-pink-50 border-b border-pink-100">
        <p className="text-sm tx-red">
          <strong>Important:</strong> Disputes are reviewed by our admin team and decisions are final.
          Please provide accurate information and evidence to support your case.
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Reason Selection */}
        <div>
          <label className="block text-sm font-medium tx-soft mb-2">
            Dispute Reason <span className="tx-red">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full p-3 border bd-line rounded-xl text-left flex items-center justify-between accent-hover-border transition-colors"
            >
              <span className={reason ? 'tx-ink' : 'tx-faint'}>
                {reason ? DISPUTE_REASONS[reason].label : 'Select a reason...'}
              </span>
              <ChevronDown className={`w-5 h-5 tx-faint transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 sf-card border bd-line rounded-xl shadow-lg overflow-hidden">
                {(Object.keys(DISPUTE_REASONS) as DisputeReason[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setReason(key)
                      setShowDropdown(false)
                    }}
                    className={`w-full p-3 text-left hover-card2 transition-colors border-b bd-line last:border-0 ${
                      reason === key ? 'sf-purple' : ''
                    }`}
                  >
                    <p className="font-medium tx-ink">{DISPUTE_REASONS[key].label}</p>
                    <p className="text-xs tx-muted mt-0.5">{DISPUTE_REASONS[key].description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium tx-soft mb-2">
            Detailed Explanation <span className="tx-red">*</span>
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Please explain the issue in detail. Include specific examples, dates, and what you expected vs. what was delivered..."
            className="w-full p-4 border bd-line rounded-xl resize-none focus:outline-none focus:ring-2 accent-focus-ring focus:border-transparent"
            rows={5}
            minLength={100}
          />
          <p className="mt-1 text-xs tx-muted">
            {explanation.length}/100 characters minimum
          </p>
        </div>

        {/* Evidence Upload */}
        <div>
          <label className="block text-sm font-medium tx-soft mb-2">
            Evidence (Optional but Recommended)
          </label>
          <p className="text-xs tx-muted mb-2">
            Upload screenshots, documents, or any files that support your case.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full p-4 border-2 border-dashed bd-line rounded-xl accent-hover-border hover-red-bg transition-colors flex items-center justify-center gap-2 tx-muted"
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
                <div key={index} className="flex items-center gap-2 p-2 sf-card2 rounded-lg">
                  {getFileIcon(file.type)}
                  <span className="flex-1 text-sm tx-soft truncate">{file.name}</span>
                  <span className="text-xs tx-faint">{formatFileSize(file.size)}</span>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="p-1 tx-faint hover-red transition-colors"
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
          <div className="p-3 sf-red border bd-red rounded-xl">
            <p className="text-sm tx-red">{error}</p>
          </div>
        )}

        {/* Final Warning */}
        <div className="p-3 sf-amber border bd-amber rounded-xl">
          <p className="text-xs tx-amber">
            By opening this dispute, you confirm that the information provided is accurate.
            False disputes may affect your account standing.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 sf-card2 border-t bd-line flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 border bd-line tx-soft rounded-xl hover:sf-card transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || uploading || !reason || explanation.trim().length < 100}
          className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            isLoading || uploading || !reason || explanation.trim().length < 100
              ? 'sf-card2 tx-muted cursor-not-allowed'
              : 'accent-bg text-white accent-hover-darken hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Opening Dispute...</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5" />
              <span>Open Dispute</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
