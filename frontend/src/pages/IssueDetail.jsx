import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getIssue, getActions, resolveIssue, unresolveIssue, demoTrigger, downloadRTI } from '../api'
import { Mail, Twitter, FileText, Clock, IndianRupee, ArrowLeft, Zap, CheckCircle, AlertCircle } from 'lucide-react'

const SEV_CLASS = { critical:'badge-critical', high:'badge-high', medium:'badge-medium', low:'badge-low' }

function ActionCard({ action, apiUrl }) {
  const [expanded, setExpanded] = useState(false)
  const icons = { complaint_email: Mail, twitter_thread: Twitter, rti_pdf: FileText }
  const labels = { complaint_email: 'Complaint Email', twitter_thread: 'Twitter/X Thread', rti_pdf: 'RTI Application PDF' }
  const colors = {
    complaint_email: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    twitter_thread:  'text-sky-400 bg-sky-500/10 border-sky-500/20',
    rti_pdf:         'text-purple-400 bg-purple-500/10 border-purple-500/20',
  }
  const Icon = icons[action.type]

  return (
    <div className={`border rounded-xl p-4 ${colors[action.type]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={15}/>
          <span className="text-sm font-medium">{labels[action.type]}</span>
          <span className="text-xs opacity-60">Day {action.day_trigger}</span>
        </div>
        <div className="flex gap-2">
          {action.type === 'rti_pdf' && action.pdf_available ? (
            <a
              href={`${apiUrl}/api/actions/rti/${action.id}/download`}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all"
            >
              Download PDF
            </a>
          ) : action.content ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
            >
              {expanded ? 'Hide' : 'View'}
            </button>
          ) : null}
          {action.content && action.type !== 'rti_pdf' && (
            <button
              onClick={() => navigator.clipboard.writeText(action.content)}
              className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
            >
              Copy
            </button>
          )}
        </div>
      </div>
      {expanded && action.content && (
        <pre className="mt-3 text-xs text-gray-300 whitespace-pre-wrap bg-black/20 rounded-lg p-3 leading-relaxed max-h-64 overflow-y-auto">
          {action.content}
        </pre>
      )}
    </div>
  )
}

function PendingAction({ label, daysLeft, color }) {
  return (
    <div className={`border border-dashed rounded-xl p-3 flex items-center gap-3 opacity-50 ${color}`}>
      <Clock size={14}/>
      <div>
        <div className="text-xs font-medium">{label}</div>
        <div className="text-xs opacity-70">Triggers in {daysLeft} days</div>
      </div>
    </div>
  )
}

export default function IssueDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const [issue,   setIssue]   = useState(null)
  const [actions, setActions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resolving,   setResolving]   = useState(false)
  const [unresolving, setUnresolving] = useState(false)
  const [demoing,   setDemoing]   = useState(false)

  useEffect(() => {
    Promise.all([getIssue(id), getActions(id)])
      .then(([i, a]) => { setIssue(i.data); setActions(a.data) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleResolve() {
    setResolving(true)
    await resolveIssue(id)
    const [i, a] = await Promise.all([getIssue(id), getActions(id)])
    setIssue(i.data); setActions(a.data)
    setResolving(false)
  }

  async function handleUnresolve() {
    setUnresolving(true)
    await unresolveIssue(id)
    const [i, a] = await Promise.all([getIssue(id), getActions(id)])
    setIssue(i.data); setActions(a.data)
    setUnresolving(false)
  }

  async function handleDemo(days) {
    setDemoing(true)
    await demoTrigger(id, days)
    const [i, a] = await Promise.all([getIssue(id), getActions(id)])
    setIssue(i.data); setActions(a.data)
    setDemoing(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!issue) return <div className="p-6 text-gray-400">Issue not found.</div>

  const daysOpen = actions?.days_open ?? issue.days_open ?? 0
  const triggeredTypes = (actions?.actions || []).map(a => a.type)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/issues')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={14}/> Back to Issues
      </button>

      {/* Issue header */}
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg font-bold text-white">{issue.title}</h1>
          <span className={SEV_CLASS[issue.severity]}>{issue.severity}</span>
        </div>

        {issue.photo_url && (
          <img src={`${apiUrl}${issue.photo_url}`} alt="Issue" className="w-full h-48 object-cover rounded-lg"/>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <div className={`font-medium capitalize ${issue.status === 'resolved' ? 'text-emerald-400' : issue.status === 'in_progress' ? 'text-yellow-400' : 'text-red-400'}`}>
              ● {issue.status?.replace('_',' ')}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Days Open</div>
            <div className="font-medium text-white">{daysOpen} days</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Daily Loss</div>
            <div className="font-medium text-emerald-400">₹{(issue.economic_loss||0).toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Total Loss So Far</div>
            <div className="font-medium text-red-400">₹{((issue.economic_loss||0) * daysOpen).toLocaleString('en-IN')}</div>
          </div>
        </div>

        {issue.economic_note && (
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2 text-xs text-emerald-300">
            💡 {issue.economic_note}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          {issue.description && <p>{issue.description}</p>}
          <p>📍 {issue.address || issue.ward} · Reported by {issue.reporter_name}</p>
        </div>

        {issue.status !== 'resolved' ? (
          <button onClick={handleResolve} disabled={resolving} className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
            <CheckCircle size={14}/> {resolving ? 'Marking resolved...' : 'Mark as Resolved'}
          </button>
        ) : (
          <button onClick={handleUnresolve} disabled={unresolving} className="btn-secondary w-full text-sm flex items-center justify-center gap-2" style={{borderColor:'rgba(239,68,68,0.3)',color:'#f87171'}}>
            <AlertCircle size={14}/> {unresolving ? 'Reopening...' : 'Reopen Issue'}
          </button>
        )}
      </div>

      {/* Agentic Loop */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-purple-400"/>
          <h2 className="text-sm font-semibold text-white">Civic Agentic Loop</h2>
          <span className="text-xs text-gray-500 ml-auto">{actions?.next_action}</span>
        </div>

        {/* Triggered actions */}
        {actions?.actions?.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Actions Taken Autonomously</div>
            {actions.actions.map(a => (
              <ActionCard key={a.id} action={a} apiUrl={apiUrl}/>
            ))}
          </div>
        )}

        {/* Pending actions */}
        {(actions?.pending?.complaint_email || actions?.pending?.twitter_thread || actions?.pending?.rti_pdf) && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Upcoming Actions</div>
            {!triggeredTypes.includes('complaint_email') && daysOpen < 3 && (
              <PendingAction label="Complaint Email to Ward Councillor" daysLeft={3 - daysOpen} color="border-blue-500/30 text-blue-400"/>
            )}
            {!triggeredTypes.includes('twitter_thread') && daysOpen < 7 && (
              <PendingAction label="Twitter/X Thread for Public Pressure" daysLeft={7 - daysOpen} color="border-sky-500/30 text-sky-400"/>
            )}
            {!triggeredTypes.includes('rti_pdf') && daysOpen < 14 && (
              <PendingAction label="RTI Application PDF" daysLeft={14 - daysOpen} color="border-purple-500/30 text-purple-400"/>
            )}
          </div>
        )}

        {actions?.actions?.length === 0 && !actions?.pending?.complaint_email && !actions?.pending?.twitter_thread && !actions?.pending?.rti_pdf && (
          <div className="text-xs text-gray-500 py-2">No actions triggered yet. Issue is being monitored.</div>
        )}

        {/* Demo trigger */}
        {issue.status !== 'resolved' && (
          <div className="border-t border-gray-800 pt-4">
            <div className="text-xs text-yellow-500 font-medium mb-2">⚡ Demo Mode — Simulate days for presentation</div>
            <div className="flex gap-2">
              {[3, 7, 14].map(d => (
                <button
                  key={d}
                  onClick={() => handleDemo(d)}
                  disabled={demoing}
                  className="text-xs px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-all disabled:opacity-50"
                >
                  {demoing ? '...' : `Simulate Day ${d}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
