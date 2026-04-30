import { useState, useEffect } from 'react'
import { getMerchants } from './api/client'
import Sidebar from './components/Header'
import Dashboard from './pages/Dashboard'
import ToastContainer from './components/Toast'
import { useToast } from './hooks/useToast'
import { ThemeProvider, useTheme } from './hooks/useTheme'
import './index.css'

function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all
        bg-white border-gray-200 text-gray-500 hover:bg-gray-50
        dark:bg-white/[0.05] dark:border-white/[0.08] dark:text-white/50 dark:hover:bg-white/[0.09]"
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}

function AppInner() {
  const [merchants, setMerchants] = useState([])
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { toasts, addToast, removeToast } = useToast()

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
    <div className="min-h-screen flex items-center justify-center bg-[#0c0e18]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </div>
        <p className="font-bold text-white text-sm tracking-tight">Playto Pay</p>
        <p className="text-[10px] text-white/30">Payout Engine</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1117] px-4">
      <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="font-bold text-gray-900 dark:text-white text-base">Backend unreachable</p>
        <p className="text-gray-400 dark:text-white/40 text-sm mt-1 mb-6">{error}</p>
        <button onClick={load} className="w-full px-4 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-500 transition-colors">
          Retry Connection
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex">
      <Sidebar merchants={merchants} selectedId={selected?.id} onSelect={m => { setSelected(m); setActiveTab('overview') }} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top navbar */}
        <header className="hidden md:flex h-14 shrink-0 border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#0f1117] items-center justify-between px-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-white/30">
            <span>Dashboard</span>
            {selected && (
              <>
                <span className="text-gray-300 dark:text-white/20">/</span>
                <span className="text-gray-700 dark:text-white/70 font-medium">{selected.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.07] rounded-lg px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-gray-500 dark:text-white/40 font-medium">Live</span>
            </div>
            <ThemeToggle />
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              {selected?.name?.charAt(0) ?? 'M'}
            </div>
          </div>
        </header>

        <div className="h-14 md:hidden" />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="px-6 md:px-8 py-8 max-w-7xl mx-auto w-full">
            {selected
              ? <Dashboard key={selected.id} merchant={selected} addToast={addToast} activeTab={activeTab} onTabChange={setActiveTab} />
              : <p className="text-sm text-gray-400 dark:text-white/30">No merchants found. Run the seed command.</p>
            }
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
