import { useState, useRef } from 'react'
import { reportIssue, reportVoice } from '../api'
import { Mic, MicOff, Upload, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Report() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  // Form state
  const [form, setForm] = useState({
    description: '', reporter_name: '', reporter_phone: '', address: ''
  })
  const [photo,    setPhoto]    = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [location, setLocation] = useState(null)
  const [locErr,   setLocErr]   = useState('')

  // Voice state
  const [recording,   setRecording]   = useState(false)
  const [transcript,  setTranscript]  = useState('')
  const recogRef = useRef(null)

  // Submission state
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')

  // ── GPS ────────────────────────────────────
  function getLocation() {
    setLocErr('')
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => setLocErr('Could not get location. Please enter address manually.')
    )
  }

  // ── Photo ───────────────────────────────────
  function onPhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  // ── Voice ───────────────────────────────────
  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Voice not supported in this browser. Use Chrome.'); return }
    const recog = new SpeechRecognition()
    recog.lang = 'hi-IN'        // Hindi first; Gemini handles Hinglish
    recog.interimResults = true
    recog.continuous = true
    recog.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ')
      setTranscript(t)
    }
    recog.start()
    recogRef.current = recog
    setRecording(true)
  }

  function stopVoice() {
    recogRef.current?.stop()
    setRecording(false)
  }

  // ── Submit voice ─────────────────────────────
  async function submitVoice() {
    if (!transcript.trim()) return
    if (!location) { setLocErr('Please get GPS location first.'); return }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('transcript',    transcript)
      fd.append('latitude',      location.lat)
      fd.append('longitude',     location.lng)
      fd.append('reporter_name', form.reporter_name || 'Citizen')
      const res = await reportVoice(fd)
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error submitting voice report')
    } finally {
      setLoading(false)
    }
  }

  // ── Submit form ──────────────────────────────
  async function submitForm(e) {
    e.preventDefault()
    if (!form.description.trim()) { setError('Please describe the issue.'); return }
    if (!location) { setLocErr('Please get your GPS location.'); return }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('description',    form.description)
      fd.append('latitude',       location.lat)
      fd.append('longitude',      location.lng)
      fd.append('address',        form.address)
      fd.append('reporter_name',  form.reporter_name || 'Citizen')
      fd.append('reporter_phone', form.reporter_phone)
      if (photo) fd.append('photo', photo)
      const res = await reportIssue(fd)
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error submitting report')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────
  if (result) return (
    <div className="p-6 flex items-center justify-center min-h-screen">
      <div className="card max-w-md w-full text-center space-y-4">
        {result.merged ? (
          <>
            <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="text-blue-400" size={28}/>
            </div>
            <h2 className="text-xl font-bold text-white">Issue Already Exists</h2>
            <p className="text-gray-400 text-sm">{result.message}</p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-300">
              Occurrence count: <span className="font-bold">{result.occurrence_count}</span> — this location is flagged for monitoring
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="text-emerald-400" size={28}/>
            </div>
            <h2 className="text-xl font-bold text-white">Issue Reported!</h2>
            <p className="text-gray-400 text-sm">{result.message}</p>
            <div className="bg-gray-800 rounded-lg p-3 text-left space-y-1.5">
              <div className="text-xs text-gray-400">Gemini classified this as:</div>
              <div className="text-sm font-medium text-white capitalize">{result.issue_type?.replace('_',' ')} · {result.severity} severity</div>
              <div className="text-xs text-emerald-400 font-medium">₹{(result.economic_loss_per_day||0).toLocaleString('en-IN')}/day economic impact</div>
              <div className="text-xs text-gray-500">{result.economic_note}</div>
            </div>
            <p className="text-xs text-purple-400">🤖 NagarAI will autonomously escalate this if unresolved in 3 days</p>
          </>
        )}
        <div className="flex gap-2">
          <button onClick={() => navigate('/issues')} className="btn-secondary flex-1 text-sm">View All Issues</button>
          <button onClick={() => { setResult(null); setForm({ description:'',reporter_name:'',reporter_phone:'',address:'' }); setPhoto(null); setPreview(null); setTranscript('') }} className="btn-primary flex-1 text-sm">Report Another</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Report an Issue</h1>
        <p className="text-gray-400 text-sm mt-1">NagarAI will autonomously fight for resolution</p>
      </div>

      {/* GPS */}
      <div className="card space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white flex items-center gap-2"><MapPin size={14}/> Location</h3>
          <button onClick={getLocation} className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all">
            {location ? '✓ Got GPS' : 'Get GPS Location'}
          </button>
        </div>
        {location && (
          <div className="text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-2">
            📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </div>
        )}
        {locErr && <p className="text-xs text-red-400">{locErr}</p>}
        <input
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
          placeholder="Area / Street name (optional but helpful)"
          value={form.address}
          onChange={e => setForm(f => ({...f, address: e.target.value}))}
        />
      </div>

      {/* Voice Reporting */}
      <div className="card space-y-3">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Mic size={14}/> Voice Report
          <span className="text-xs text-gray-500 font-normal">Hindi / English / Hinglish supported</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={recording ? stopVoice : startVoice}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              recording
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                : 'bg-gray-800 text-gray-300 hover:text-white'
            }`}
          >
            {recording ? <><MicOff size={14}/> Stop Recording</> : <><Mic size={14}/> Hold to Record</>}
          </button>
          {transcript && (
            <button onClick={submitVoice} disabled={loading} className="btn-primary text-sm flex-1">
              {loading ? 'Processing...' : 'Submit Voice Report'}
            </button>
          )}
        </div>
        {transcript && (
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-300 leading-relaxed">
            <span className="text-gray-500 block mb-1">Transcript:</span>
            {transcript}
          </div>
        )}
      </div>

      {/* OR divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-800"/>
        <span className="text-xs text-gray-600">or fill the form</span>
        <div className="flex-1 h-px bg-gray-800"/>
      </div>

      {/* Form */}
      <form onSubmit={submitForm} className="card space-y-4">
        <h3 className="text-sm font-medium text-white">Issue Details</h3>

        <textarea
          required
          rows={4}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none resize-none"
          placeholder="Describe the issue... (Gemini will auto-classify type and severity)"
          value={form.description}
          onChange={e => setForm(f => ({...f, description: e.target.value}))}
        />

        {/* Photo upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500/50 transition-all"
        >
          {preview ? (
            <img src={preview} className="h-32 mx-auto rounded-lg object-cover"/>
          ) : (
            <>
              <Upload size={20} className="mx-auto text-gray-600 mb-1"/>
              <p className="text-xs text-gray-500">Upload photo (optional but helps Gemini classify)</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange}/>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            placeholder="Your name"
            value={form.reporter_name}
            onChange={e => setForm(f => ({...f, reporter_name: e.target.value}))}
          />
          <input
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            placeholder="Phone (optional)"
            value={form.reporter_phone}
            onChange={e => setForm(f => ({...f, reporter_phone: e.target.value}))}
          />
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              Gemini is analyzing...
            </span>
          ) : 'Report Issue — Let NagarAI Fight For You'}
        </button>
      </form>
    </div>
  )
}
