import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
})

// ── Issues ──────────────────────────────────────────
export const reportIssue = (formData) =>
  api.post('/api/issues/report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const reportVoice = (formData) =>
  api.post('/api/issues/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const getIssues  = (params) => api.get('/api/issues/', { params })
export const getIssue   = (id)     => api.get(`/api/issues/${id}`)
export const resolveIssue   = (id) => api.patch(`/api/issues/${id}/resolve`)
export const unresolveIssue = (id) => api.patch(`/api/issues/${id}/unresolve`)

// ── Agentic Actions ──────────────────────────────────
export const getActions     = (issueId) => api.get(`/api/actions/issue/${issueId}`)
export const downloadRTI    = (actionId) => `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/actions/rti/${actionId}/download`
export const demoTrigger    = (issueId, days) =>
  api.post(`/api/actions/demo/trigger/${issueId}?simulate_days=${days}`)

// ── Dashboard ────────────────────────────────────────
export const getCityHealth  = () => api.get('/api/dashboard/city-health')
export const getHeatmap     = () => api.get('/api/dashboard/heatmap')
export const getStats       = () => api.get('/api/dashboard/stats')