import { useState, useEffect } from 'react'
import { getMerchants } from './api/client'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import './index.css'

export default function App() {
  const [merchants, setMerchants] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function load() {
    setError(null)
    setLoading(true)
    getMerchants()
      .then(data => { setMerchants(data); if (data.length) setSelected(data[0]) })
      .catch(err => setError(err.message || 'Failed to connect to backend'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading merchants…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-sm w-full text-center shadow-sm">
        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="font-semibold text-gray-900 text-sm">Backend unreachable</p>
        <p className="text-gray-400 text-xs mt-1 mb-5">{error}</p>
        <button onClick={load} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          Retry
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Header merchants={merchants} selectedId={selected?.id} onSelect={setSelected} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {selected
            ? <Dashboard key={selected.id} merchant={selected} />
            : <p className="text-sm text-gray-400">No merchants found. Run the seed command.</p>
          }
        </div>
      </main>
    </div>
  )
}
