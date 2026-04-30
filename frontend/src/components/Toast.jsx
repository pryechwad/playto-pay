import { useEffect, useState } from 'react'

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, toast.duration ?? 4000)
    return () => clearTimeout(t)
  }, [])

  const styles = {
    success: 'bg-white dark:bg-[#0d1f17] border-emerald-200 dark:border-emerald-500/30',
    error:   'bg-white dark:bg-[#1f0d0d] border-red-200 dark:border-red-500/30',
    info:    'bg-white dark:bg-[#13151f] border-gray-200 dark:border-white/10',
  }
  const iconColors = { success: '#10b981', error: '#ef4444', info: '#8b5cf6' }
  const icons = {
    success: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconColors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    error:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconColors.error} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    info:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconColors.info} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  }

  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-lg shadow-black/10 min-w-[300px] max-w-sm transition-all duration-300
      ${styles[toast.type]}
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
    >
      <span className="mt-0.5 shrink-0">{icons[toast.type]}</span>
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-semibold text-sm leading-tight text-gray-900 dark:text-white">{toast.title}</p>}
        <p className="text-sm text-gray-500 dark:text-white/50 leading-snug mt-0.5">{toast.message}</p>
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300) }}
        className="text-gray-300 dark:text-white/20 hover:text-gray-500 dark:hover:text-white/50 shrink-0 mt-0.5 transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 sm:right-6 z-[200] flex flex-col gap-2 items-end">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  )
}
