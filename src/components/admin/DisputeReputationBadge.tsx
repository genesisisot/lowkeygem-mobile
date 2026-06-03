import { useState, useEffect } from 'react'
import { AlertTriangle, Shield, TrendingUp, TrendingDown } from 'lucide-react'
import type { DisputeReputation } from '../../types/database'
import { disputeReputationService } from '../../services/disputeReputation'

interface DisputeReputationBadgeProps {
  userId: string
  compact?: boolean
}

export function DisputeReputationBadge({ userId, compact = false }: DisputeReputationBadgeProps) {
  const [reputation, setReputation] = useState<DisputeReputation | null>(null)
  const [isHighRisk, setIsHighRisk] = useState(false)
  const [riskReason, setRiskReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReputation()
  }, [userId])

  const loadReputation = async () => {
    setLoading(true)
    const [reputationResult, riskResult] = await Promise.all([
      disputeReputationService.getByUserId(userId),
      disputeReputationService.isHighRisk(userId)
    ])

    if (reputationResult.data) {
      setReputation(reputationResult.data)
    }

    setIsHighRisk(riskResult.isHighRisk)
    setRiskReason(riskResult.reason)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
      </div>
    )
  }

  // No dispute history
  if (!reputation || (reputation.disputes_won === 0 && reputation.disputes_lost === 0 && reputation.disputes_split === 0)) {
    if (compact) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Clean Record
        </span>
      )
    }

    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
        <Shield className="w-4 h-4 text-gray-400" />
        <div className="text-sm">
          <span className="text-gray-600">No dispute history</span>
        </div>
      </div>
    )
  }

  const totalDisputes = reputation.disputes_won + reputation.disputes_lost + reputation.disputes_split
  const winRate = totalDisputes > 0 ? Math.round((reputation.disputes_won / totalDisputes) * 100) : 0

  if (compact) {
    return (
      <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
        isHighRisk
          ? 'bg-red-100 text-red-700'
          : winRate >= 50
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
      }`}>
        {isHighRisk ? (
          <>
            <AlertTriangle className="w-3 h-3" />
            High Risk
          </>
        ) : winRate >= 50 ? (
          <>
            <TrendingUp className="w-3 h-3" />
            {winRate}% Win
          </>
        ) : (
          <>
            <TrendingDown className="w-3 h-3" />
            {winRate}% Win
          </>
        )}
      </span>
    )
  }

  return (
    <div className={`p-3 rounded-lg border ${
      isHighRisk
        ? 'bg-red-50 border-red-200'
        : 'bg-gray-50 border-gray-200'
    }`}>
      {/* High Risk Warning */}
      {isHighRisk && (
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-red-700">
            High Risk User
          </span>
          {riskReason && (
            <span className="text-xs text-red-500">({riskReason})</span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-gray-900">{totalDisputes}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div>
          <p className="text-lg font-bold text-green-600">{reputation.disputes_won}</p>
          <p className="text-xs text-gray-500">Won</p>
        </div>
        <div>
          <p className="text-lg font-bold text-red-600">{reputation.disputes_lost}</p>
          <p className="text-xs text-gray-500">Lost</p>
        </div>
        <div>
          <p className="text-lg font-bold text-yellow-600">{reputation.disputes_split}</p>
          <p className="text-xs text-gray-500">Split</p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div>
          Initiated: <span className="font-medium text-gray-700">{reputation.disputes_initiated}</span>
        </div>
        <div>
          Received: <span className="font-medium text-gray-700">{reputation.disputes_against}</span>
        </div>
      </div>

      {/* Win Rate Bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Win Rate</span>
          <span className={`font-medium ${
            winRate >= 50 ? 'text-green-600' : 'text-red-600'
          }`}>
            {winRate}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              winRate >= 50 ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>
    </div>
  )
}
