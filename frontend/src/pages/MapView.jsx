import { useEffect, useRef, useState } from 'react'
import { getIssues, getHeatmap } from '../api'
import { useNavigate } from 'react-router-dom'

const SEVERITY_COLORS = { critical:'#ef4444', high:'#f97316', medium:'#facc15', low:'#60a5fa' }
const TYPE_ICONS = {
  pothole:'🕳️', garbage:'🗑️', streetlight:'💡', waterlogging:'🌊',
  road_damage:'🚧', sewage:'🚰', encroachment:'⛔', noise:'📢', other:'⚠️'
}

export default function MapView() {
  const mapRef   = useRef(null)
  const mapObj   = useRef(null)
  const [issues,  setIssues]  = useState([])
  const [heatmap, setHeatmap] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getIssues(), getHeatmap()]).then(([issRes, heatRes]) => {
      setIssues(issRes.data)
      initMap(issRes.data, heatRes.data)
      setLoading(false)
    })
  }, [])

  function initMap(issues, heatData) {
    if (!window.google || !mapRef.current) {
      setTimeout(() => initMap(issues, heatData), 500)
      return
    }

    const center = issues.length > 0
      ? { lat: issues[0].latitude, lng: issues[0].longitude }
      : { lat: 25.4358, lng: 81.8463 } // Prayagraj default

    const map = new window.google.maps.Map(mapRef.current, {
      center, zoom: 13,
      styles: [
        { elementType:'geometry', stylers:[{ color:'#1a1a2e' }] },
        { elementType:'labels.text.stroke', stylers:[{ color:'#1a1a2e' }] },
        { elementType:'labels.text.fill', stylers:[{ color:'#746855' }] },
        { featureType:'road', elementType:'geometry', stylers:[{ color:'#2d2d44' }] },
        { featureType:'water', elementType:'geometry', stylers:[{ color:'#17263c' }] },
      ]
    })
    mapObj.current = map

    // Issue markers
    issues.forEach(issue => {
      if (!issue.latitude || !issue.longitude) return
      const marker = new window.google.maps.Marker({
        position: { lat: issue.latitude, lng: issue.longitude },
        map,
        title: issue.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: issue.severity === 'critical' ? 10 : issue.severity === 'high' ? 8 : 6,
          fillColor: SEVERITY_COLORS[issue.severity] || '#9ca3af',
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 1.5,
        }
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="background:#111827;color:#fff;padding:12px;border-radius:8px;min-width:200px;font-family:sans-serif">
            <div style="font-size:13px;font-weight:600;margin-bottom:6px">${TYPE_ICONS[issue.issue_type] || '⚠️'} ${issue.title}</div>
            <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">📍 ${issue.address || 'Unknown location'}</div>
            <div style="font-size:11px;color:#9ca3af;margin-bottom:6px">🕐 ${issue.days_open} days open</div>
            <div style="font-size:12px;color:#10b981;font-weight:500">₹${(issue.economic_loss||0).toLocaleString('en-IN')}/day loss</div>
            <div style="margin-top:8px;font-size:11px;color:#6366f1;cursor:pointer" onclick="window.location.href='/issues/${issue.id}'">View details →</div>
          </div>
        `
      })
      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })
    })

    // Heatmap layer
    if (heatData.length > 0) {
      const heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
        data: heatData.map(p => ({
          location: new window.google.maps.LatLng(p.lat, p.lng),
          weight: p.weight
        })),
        map: null, // off by default
        radius: 40,
        gradient: ['rgba(0,0,0,0)', 'rgba(16,185,129,0.4)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,1)']
      })
      window._nagarHeatmap = heatmapLayer
    }
  }

  function toggleHeatmap() {
    if (window._nagarHeatmap) {
      const newState = !heatmap
      window._nagarHeatmap.setMap(newState ? mapObj.current : null)
      setHeatmap(newState)
    }
  }

  return (
    <div className="relative h-screen flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 z-10">
        <div>
          <h2 className="text-sm font-semibold text-white">Live Issue Map</h2>
          <p className="text-xs text-gray-500">{issues.length} active issues · Prayagraj</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleHeatmap}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${heatmap ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {heatmap ? '🔥 Heatmap ON' : '🗺️ Heatmap'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-4 z-10 bg-gray-900/90 backdrop-blur border border-gray-700 rounded-xl p-3 text-xs space-y-1.5">
        <div className="text-gray-300 font-medium mb-2">Severity</div>
        {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
          <div key={sev} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: color }}/>
            <span className="text-gray-400 capitalize">{sev}</span>
          </div>
        ))}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"/>
            <div className="text-gray-400 text-sm">Loading map...</div>
          </div>
        </div>
      )}

      <div ref={mapRef} className="flex-1 w-full" />
    </div>
  )
}
