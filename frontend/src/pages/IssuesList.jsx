import { useEffect, useState } from 'react'
import { getIssues } from '../api'
import { useNavigate } from 'react-router-dom'
import { Filter, ArrowRight, IndianRupee, Clock } from 'lucide-react'

const TYPE_ICONS = {
  pothole:'🕳️', garbage:'🗑️', streetlight:'💡', waterlogging:'🌊',
  road_damage:'🚧', sewage:'🚰', encroachment:'⛔', noise:'📢', other:'⚠️'
}
const SEV_CLASS = {
  critical:'badge-critical', high:'badge-high', medium:'badge-medium', low:'badge-low'
}
const STATUS_CLASS = {
  open:'text-red-400', in_progress:'text-yellow-400', resolved:'text-emerald-400'
}

export default function IssuesList() {
  const navigate = useNavigate()
  const [issues,  setIssues]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState({ status: '', issue_type: '' })

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filter.status)     params.status     = filter.status
    if (filter.issue_type) params.issue_type = filter.issue_type
    getIssues(params)
      .then(r => setIssues(r.data))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">All Issues</h1>
          <p className="text-gray-400 text-sm mt-1">{issues.length} issues found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-gray-500"/>
        {['', 'open', 'in_progress', 'resolved'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(f => ({...f, status: s}))}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter.status === s
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {s === '' ? 'All Status' : s.replace('_',' ')}
          </button>
        ))}
        <div className="h-4 w-px bg-gray-700"/>
        {['', 'pothole', 'garbage', 'streetlight', 'waterlogging', 'road_damage', 'sewage'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(f => ({...f, issue_type: t}))}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter.issue_type === t
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t === '' ? 'All Types' : `${TYPE_ICONS[t]} ${t.replace('_',' ')}`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map(issue => (
            <div
              key={issue.id}
              onClick={() => navigate(`/issues/${issue.id}`)}
              className="card hover:border-gray-600 cursor-pointer transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{TYPE_ICONS[issue.issue_type] || '⚠️'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors truncate">
                      {issue.title}
                    </h3>
                    <ArrowRight size={14} className="text-gray-600 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5"/>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={SEV_CLASS[issue.severity]}>{issue.severity}</span>
                    <span className={`text-xs font-medium ${STATUS_CLASS[issue.status]}`}>● {issue.status?.replace('_',' ')}</span>
                    <span className="text-xs text-gray-500">📍 {issue.ward}</span>
                    {issue.occurrence_count > 1 && (
                      <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
                        👻 {issue.occurrence_count}x recurring
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <IndianRupee size={10}/>{(issue.economic_loss||0).toLocaleString('en-IN')}/day
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={10}/>{issue.days_open}d open
                    </span>
                    <span className="text-xs text-gray-500">by {issue.reporter_name}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {issues.length === 0 && (
            <div className="text-center py-16 text-gray-500 text-sm">No issues found for this filter.</div>
          )}
        </div>
      )}
    </div>
  )
}
