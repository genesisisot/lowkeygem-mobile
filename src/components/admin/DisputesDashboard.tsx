import { useState, useEffect } from 'react'
import { Scale, Clock, CheckCircle, AlertTriangle, Filter, Search, RefreshCw } from 'lucide-react'
import type { DisputeWithDetails, DisputeStatus } from '../../types/database'
import { disputesService } from '../../services/disputes'
import { DisputeCard } from './DisputeCard'

interface DisputesDashboardProps {
  onSelectDispute: (disputeId: string) => void
}

export function DisputesDashboard({ onSelectDispute }: DisputesDashboardProps) {
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<DisputeStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [counts, setCounts] = useState({
    pending_response: 0,
    pending_review: 0,
    resolved: 0,
    total: 0
  })

  const loadDisputes = async () => {
    setLoading(true)
    const [disputesResult, countsResult] = await Promise.all([
      disputesService.getAllWithDetails(filter === 'all' ? undefined : filter),
      disputesService.getCounts()
    ])

    if (disputesResult.data) {
      setDisputes(disputesResult.data)
    }
    if (!countsResult.error) {
      setCounts(countsResult)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDisputes()
  }, [filter])

  // Filter disputes by search query
  const filteredDisputes = disputes.filter(dispute => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      dispute.client?.full_name?.toLowerCase().includes(search) ||
      dispute.freelancer?.full_name?.toLowerCase().includes(search) ||
      dispute.match?.job?.title?.toLowerCase().includes(search) ||
      dispute.reason.toLowerCase().includes(search)
    )
  })

  const filterTabs = [
    { key: 'all', label: 'All', count: counts.total, icon: Scale },
    { key: 'pending_response', label: 'Awaiting Response', count: counts.pending_response, icon: Clock, color: 'orange' },
    { key: 'pending_review', label: 'Under Review', count: counts.pending_review, icon: AlertTriangle, color: 'blue' },
    { key: 'resolved', label: 'Resolved', count: counts.resolved, icon: CheckCircle, color: 'green' },
  ] as const

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
            <p className="text-gray-500">Review and resolve payment disputes</p>
          </div>
          <button
            onClick={loadDisputes}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                filter === tab.key ? 'bg-purple-200' : 'bg-gray-200'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, job title, or reason..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Dispute List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading disputes...</p>
            </div>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Scale className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No disputes found</h3>
            <p className="text-gray-500">
              {filter === 'all'
                ? 'There are no disputes to review.'
                : `No disputes with status "${filter.replace('_', ' ')}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map(dispute => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                onClick={() => onSelectDispute(dispute.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-4 bg-white border-t">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            <p className="text-xs text-gray-500">Total Disputes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{counts.pending_response}</p>
            <p className="text-xs text-gray-500">Awaiting Response</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{counts.pending_review}</p>
            <p className="text-xs text-gray-500">Under Review</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{counts.resolved}</p>
            <p className="text-xs text-gray-500">Resolved</p>
          </div>
        </div>
      </div>
    </div>
  )
}
