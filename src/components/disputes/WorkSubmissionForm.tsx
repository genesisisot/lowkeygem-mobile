import { useState, useRef } from 'react'
import { Upload, Link, X, FileText, Image, File, Loader2, CheckCircle } from 'lucide-react'
import type { WorkSubmissionFile } from '../../types/database'
import { storageService } from '../../services/storage'
import { MAX_REVISIONS } from '../../services/matches'

interface WorkSubmissionFormProps {
  matchId: string
  freelancerId: string
  currentRevisionCount: number
  onSubmit: (notes: string, links: string[], files: WorkSubmissionFile[]) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function WorkSubmissionForm({
  matchId,
  freelancerId,
  currentRevisionCount,
  onSubmit,
  onCancel,
  isLoading = false
}: WorkSubmissionFormProps) {
  const [notes, setNotes] = useState('')
  const [links, setLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState('')
  const [files, setFiles] = useState<WorkSubmissionFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const submissionNumber = currentRevisionCount + 1
  const isFinalSubmission = submissionNumber >= MAX_REVISIONS

  const handleAddLink = () => {
    if (newLink.trim()) {
      // Basic URL validation
      try {
        new URL(newLink.trim())
        setLinks([...links, newLink.trim()])
        setNewLink('')
        setError(null)
      } catch {
        setError('Please enter a valid URL')
      }
    }
  }

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setError(null)

    try {
      for (const file of Array.from(selectedFiles)) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError(`File "${file.name}" is too large. Maximum size is 10MB.`)
          continue
        }

        // Upload to storage
        const url = await storageService.uploadWorkSubmission(
          matchId,
          freelancerId,
          file
        )

        if (!url) {
          setError(`Failed to upload "${file.name}". Please try again.`)
          continue
        }

        setFiles(prev => [...prev, {
          url,
          name: file.name,
          type: file.type,
          size: file.size
        }])
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
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (notes.trim().length < 50) {
      setError('Please provide at least 50 characters describing your work.')
      return
    }

    setError(null)
    await onSubmit(notes.trim(), links, files)
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
    <div className="sf-card rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold tx-ink">Submit Your Work</h3>
          <p className="text-sm tx-muted">
            Submission {submissionNumber} of {MAX_REVISIONS}
            {isFinalSubmission && (
              <span className="ml-2 tx-amber font-medium">(Final Submission)</span>
            )}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 tx-faint accent-hover-text transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Warning for final submission */}
      {isFinalSubmission && (
        <div className="mb-4 p-3 sf-amber border bd-amber rounded-xl">
          <p className="text-sm tx-amber">
            This is your final submission. After this, the client can only approve or open a dispute.
          </p>
        </div>
      )}

      {/* Notes Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium tx-soft mb-2">
          Work Description <span className="tx-red">*</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe the work you've completed, any important details, and how to review it..."
          className="w-full p-4 border bd-line rounded-xl resize-none focus:outline-none focus:ring-2 accent-focus-ring focus:border-transparent"
          rows={4}
          minLength={50}
        />
        <p className="mt-1 text-xs tx-muted">
          {notes.length}/50 characters minimum
        </p>
      </div>

      {/* Links Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium tx-soft mb-2">
          External Links (Optional)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="url"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="https://example.com/your-work"
            className="flex-1 p-3 border bd-line rounded-xl focus:outline-none focus:ring-2 accent-focus-ring focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleAddLink()}
          />
          <button
            onClick={handleAddLink}
            className="px-4 py-3 sf-purple tx-purple rounded-xl hover-accent-bg transition-colors"
          >
            <Link className="w-5 h-5" />
          </button>
        </div>
        {links.length > 0 && (
          <div className="space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex items-center gap-2 p-2 sf-card2 rounded-lg">
                <Link className="w-4 h-4 tx-faint" />
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm tx-purple hover:underline truncate"
                >
                  {link}
                </a>
                <button
                  onClick={() => handleRemoveLink(index)}
                  className="p-1 tx-faint hover-red transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium tx-soft mb-2">
          Attachments (Optional)
        </label>
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
          className="w-full p-4 border-2 border-dashed bd-line rounded-xl accent-hover-border hover-accent-bg transition-colors flex items-center justify-center gap-2 tx-muted"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Click to upload files (max 10MB each)</span>
            </>
          )}
        </button>
        {files.length > 0 && (
          <div className="mt-2 space-y-2">
            {files.map((file, index) => (
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
        <div className="mb-4 p-3 sf-red border bd-red rounded-xl">
          <p className="text-sm tx-red">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 border bd-line tx-soft rounded-xl hover-card2 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || uploading || notes.trim().length < 50}
          className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            isLoading || uploading || notes.trim().length < 50
              ? 'sf-card2 tx-muted cursor-not-allowed'
              : 'accent-bg text-white accent-hover-darken hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Submit Work</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
