import { useState } from 'react'
import { CheckCircle, RefreshCw, DollarSign, Divide, Loader2, AlertTriangle } from 'lucide-react'
import type { DisputeResolution } from '../../types/database'
import { DISPUTE_RESOLUTIONS } from '../../types/database'

interface ResolutionFormProps {
  escrowAmount: number
  canResolve: boolean
  onResolve: (
    resolution: DisputeResolution,
    adminNotes: string,
    splitFreelancerAmount?: number,
    splitClientAmount?: number
  ) => Promise<void>
  isLoading?: boolean
}

export function ResolutionForm({
  escrowAmount,
  canResolve,
  onResolve,
  isLoading = false
}: ResolutionFormProps) {
  const [selectedResolution, setSelectedResolution] = useState<DisputeResolution | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [splitPercentage, setSplitPercentage] = useState(50) // Freelancer percentage
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const freelancerAmount = Math.round((escrowAmount * splitPercentage) / 100)
  const clientAmount = escrowAmount - freelancerAmount

  const resolutionOptions = [
    {
      key: 'release_full' as const,
      icon: CheckCircle,
      label: 'Release to Freelancer',
      description: 'Freelancer receives full payment',
      color: 'green',
      amount: `₦${escrowAmount.toLocaleString()}`
    },
    {
      key: 'refund_client' as const,
      icon: RefreshCw,
      label: 'Refund Client',
      description: 'Client receives full refund',
      color: 'red',
      amount: `₦${escrowAmount.toLocaleString()}`
    },
    {
      key: 'split_payment' as const,
      icon: Divide,
      label: 'Split Payment',
      description: 'Divide between both parties',
      color: 'yellow',
      amount: 'Custom split'
    },
    {
      key: 'final_revision' as const,
      icon: RefreshCw,
      label: 'Request Final Revision',
      description: 'Give freelancer one last chance',
      color: 'blue',
      amount: 'No payment change'
    }
  ]

  const handleSubmit = async () => {
    if (!selectedResolution) {
      setError('Please select a resolution')
      return
    }

    if (!adminNotes.trim()) {
      setError('Please provide admin notes explaining your decision')
      return
    }

    if (selectedResolution === 'split_payment' && splitPercentage === 0) {
      setError('Please set a valid split percentage')
      return
    }

    setError(null)
    await onResolve(
      selectedResolution,
      adminNotes.trim(),
      selectedResolution === 'split_payment' ? freelancerAmount : undefined,
      selectedResolution === 'split_payment' ? clientAmount : undefined
    )
  }

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { border: string; bg: string; text: string }> = {
      green: {
        border: isSelected ? 'border-green-500' : 'border-gray-200',
        bg: isSelected ? 'bg-green-50' : '',
        text: 'text-green-600'
      },
      red: {
        border: isSelected ? 'border-red-500' : 'border-gray-200',
        bg: isSelected ? 'bg-red-50' : '',
        text: 'text-red-600'
      },
      yellow: {
        border: isSelected ? 'border-yellow-500' : 'border-gray-200',
        bg: isSelected ? 'bg-yellow-50' : '',
        text: 'text-yellow-600'
      },
      blue: {
        border: isSelected ? 'border-blue-500' : 'border-gray-200',
        bg: isSelected ? 'bg-blue-50' : '',
        text: 'text-blue-600'
      }
    }
    return colors[color]
  }

  if (!canResolve) {
    return (
      <div className="bg-gray-100 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <h3 className="font-medium text-gray-900 mb-1">Cannot Resolve Yet</h3>
        <p className="text-sm text-gray-500">
          Waiting for freelancer's response before resolution is possible.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="font-semibold text-gray-900">Make a Decision</h3>
        <p className="text-sm text-gray-500">Select a resolution and provide your reasoning</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Resolution Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {resolutionOptions.map(option => {
            const isSelected = selectedResolution === option.key
            const colors = getColorClasses(option.color, isSelected)

            return (
              <button
                key={option.key}
                onClick={() => {
                  setSelectedResolution(option.key)
                  setShowConfirm(false)
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${colors.border} ${colors.bg} hover:border-gray-300`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.text} bg-white`}>
                    <option.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                    <p className={`text-sm font-semibold mt-1 ${colors.text}`}>
                      {option.amount}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle className={`w-5 h-5 ${colors.text}`} />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Split Payment Slider */}
        {selectedResolution === 'split_payment' && (
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <h4 className="font-medium text-gray-900 mb-4">Split Distribution</h4>

            <div className="mb-4">
              <input
                type="range"
                min="0"
                max="100"
                value={splitPercentage}
                onChange={(e) => setSplitPercentage(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">Freelancer Receives</p>
                <p className="text-lg font-bold text-green-600">
                  ₦{freelancerAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">{splitPercentage}%</p>
              </div>
              <div className="p-3 bg-white rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">Client Receives</p>
                <p className="text-lg font-bold text-red-600">
                  ₦{clientAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">{100 - splitPercentage}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Notes <span className="text-red-500">*</span>
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Explain your decision. This will be shared with both parties..."
            className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Confirmation */}
        {showConfirm ? (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <p className="text-sm text-orange-800 mb-3">
              <strong>Confirm Decision:</strong> This action is final and cannot be undone.
              {selectedResolution === 'release_full' && ' Full payment will be released to the freelancer.'}
              {selectedResolution === 'refund_client' && ' Full amount will be refunded to the client.'}
              {selectedResolution === 'split_payment' && ` Payment will be split: Freelancer ₦${freelancerAmount.toLocaleString()}, Client ₦${clientAmount.toLocaleString()}.`}
              {selectedResolution === 'final_revision' && ' Freelancer will be asked to submit one final revision.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-200 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirm Decision'
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              if (selectedResolution && adminNotes.trim()) {
                setShowConfirm(true)
              } else {
                setError('Please select a resolution and provide admin notes')
              }
            }}
            disabled={!selectedResolution || isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Decision
          </button>
        )}
      </div>
    </div>
  )
}
