import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { MapPin, FileText, LayoutDashboard, Plus } from 'lucide-react'
import Dashboard   from './pages/Dashboard.jsx'
import MapView     from './pages/MapView.jsx'
import Report      from './pages/Report.jsx'
import IssuesList  from './pages/IssuesList.jsx'
import IssueDetail from './pages/IssueDetail.jsx'

const NAV = [
  { to: '/',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/map',    icon: MapPin,          label: 'Live Map'  },
  { to: '/issues', icon: FileText,        label: 'Issues'    },
  { to: '/report', icon: Plus,            label: 'Report'    },
]

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col z-50"
      style={{ background: '#0d0d14', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 16px rgba(16,185,129,0.4)' }}>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/>
    <circle cx="12" cy="9" r="2.5" fill="#059669"/>
    <path d="M8 20h8M9 17h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
</div>

          <div>
            <div className="font-bold text-white text-[15px] tracking-tight">NagarAI</div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>City Nervous System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 pt-4">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all ${
                isActive
                  ? 'text-emerald-300'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))',
              border: '1px solid rgba(16,185,129,0.25)',
              boxShadow: '0 0 12px rgba(16,185,129,0.1)'
            } : {}}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Built for citizens 🇮🇳
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
        <Sidebar />
        <main className="ml-60 flex-1 min-h-screen overflow-auto">
          <Routes>
            <Route path="/"          element={<Dashboard />}   />
            <Route path="/map"       element={<MapView />}     />
            <Route path="/issues"    element={<IssuesList />}  />
            <Route path="/issues/:id" element={<IssueDetail />} />
            <Route path="/report"    element={<Report />}      />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
