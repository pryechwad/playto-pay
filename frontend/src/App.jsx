import { useState, useEffect } from 'react'
import { getMerchants } from './api/client'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import './index.css'

export default function App() {
  const [merchants, setMerchants] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMerchants().then(data => {
      setMerchants(data)
      if (data.length) setSelected(data[0])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header merchants={merchants} selectedId={selected?.id} onSelect={setSelected} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {selected
          ? <Dashboard key={selected.id} merchant={selected} />
          : <p className="text-gray-400">No merchants found. Run the seed command.</p>
        }
      </main>
    </div>
  )
}
