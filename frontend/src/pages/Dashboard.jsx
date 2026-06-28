import { useEffect, useState } from 'react'
import { getCityHealth, getStats } from '../api'
import { TrendingUp, AlertCircle, CheckCircle, Zap, IndianRupee } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const TYPE_COLORS = {
  pothole:'#f97316', garbage:'#84cc16', streetlight:'#facc15',
  waterlogging:'#38bdf8', road_damage:'#ef4444', sewage:'#a78bfa',
  encroachment:'#f472b6', noise:'#94a3b8', other:'#6b7280'
}

function ScoreRing({ score }) {
  const r = 54, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  const glow  = score >= 70 ? 'rgba(16,185,129,0.3)' : score >= 40 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'
  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease', filter: `drop-shadow(0 0 8px ${glow})` }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-xs text-gray-400 mt-0.5">City Score</span>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, gradient, sub }) {
  return (
    <div className="card relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 rounded-2xl" style={{ background: gradient }}/>
      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: gradient, boxShadow: `0 0 20px ${gradient.includes('239') ? 'rgba(239,68,68,0.3)' : gradient.includes('16,185') ? 'rgba(16,185,129,0.3)' : gradient.includes('139') ? 'rgba(139,92,246,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-gray-400">{label}</div>
          {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'10px 14px' }}>
        <p style={{ color:'#fff', fontSize:'13px', fontWeight:600 }}>{label}</p>
        <p style={{ color:'#10b981', fontSize:'13px' }}>{payload[0].value} issues</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [health,  setHealth]  = useState(null)
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCityHealth(), getStats()])
      .then(([h, s]) => { setHealth(h.data); setStats(s.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"
          style={{ boxShadow: '0 0 16px rgba(16,185,129,0.4)' }}/>
        <div className="text-gray-400 text-sm">Loading city data...</div>
      </div>
    </div>
  )

  const pieData = health?.issue_type_breakdown
    ? Object.entries(health.issue_type_breakdown).map(([k,v]) => ({ name: k, value: v }))
    : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">City Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1.5">Real-time civic health monitoring — Prayagraj</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={AlertCircle}  label="Open Issues"       value={stats?.open ?? 0}
          gradient="linear-gradient(135deg,#ef4444,#dc2626)" />
        <StatCard icon={CheckCircle}  label="Resolved"          value={stats?.resolved ?? 0}
          gradient="linear-gradient(135deg,#10b981,#059669)" />
        <StatCard icon={Zap}          label="AI Actions Taken"  value={stats?.agentic_actions_taken ?? 0}
          gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)" sub="emails · threads · RTIs"/>
        <StatCard icon={IndianRupee}  label="Daily Eco Loss"
          value={`₹${((stats?.daily_economic_loss_inr ?? 0)/1000).toFixed(1)}K`}
          gradient="linear-gradient(135deg,#3b82f6,#2563eb)" sub="est. from open issues"/>
      </div>

      {/* City Score + Ward Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card flex flex-col items-center justify-center gap-5 py-6">
          <ScoreRing score={health?.city_score ?? 0} />
          <div className="text-center">
            <div className="text-base font-semibold text-white">
              {health?.city_score >= 70 ? '✅ Healthy City' : health?.city_score >= 40 ? '⚠️ Needs Attention' : '🔴 Critical State'}
            </div>
            <div className="text-sm text-gray-500 mt-1">{health?.total_issues} total issues tracked</div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="text-base font-semibold text-white mb-5">Ward Leaderboard</h3>
          <div className="space-y-4">
            {health?.wards?.map((w, i) => (
              <div key={w.ward} className="flex items-center gap-3">
                <span className={`text-sm font-bold w-6 flex-shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-orange-600'}`}>
                  #{i+1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white font-medium">{w.ward}</span>
                    <span className={`font-bold ${w.score >= 70 ? 'text-emerald-400' : w.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {w.score}/100
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${w.score}%`,
                        background: w.score >= 70 ? 'linear-gradient(90deg,#10b981,#34d399)' : w.score >= 40 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)',
                        boxShadow: w.score >= 70 ? '0 0 8px rgba(16,185,129,0.5)' : w.score >= 40 ? '0 0 8px rgba(245,158,11,0.5)' : '0 0 8px rgba(239,68,68,0.5)'
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {w.open} open · {w.resolution_rate}% resolved · top issue: {w.top_issue?.replace('_',' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-5">Issues by Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pieData} margin={{ top:0, right:0, left:-15, bottom:0 }}>
              <XAxis dataKey="name" tick={{ fontSize:12, fill:'#d1d5db' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:12, fill:'#d1d5db' }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.04)' }}/>
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-white mb-5">Issue Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={35} dataKey="value" paddingAngle={2}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />}/>
              <Legend
                formatter={(value) => <span style={{ color:'#d1d5db', fontSize:'12px' }}>{value.replace('_',' ')}</span>}
                iconSize={10} iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
