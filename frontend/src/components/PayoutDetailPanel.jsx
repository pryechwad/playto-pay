import { useEffect } from 'react'
import Badge from './Badge'
import { paiseToInr, formatDate } from '../utils/format'

function Row({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-gray-100 dark:border-white/[0.06] last:border-0">
      <span className="text-xs font-medium text-gray-400 dark:text-white/35 uppercase tracking-wider shrink-0">{label}</span>
      <span className={`text-sm text-right text-gray-800 dark:text-white/80 font-medium break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

export default function PayoutDetailPanel({ payout, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-white dark:bg-[#13151f] border-l border-gray-100 dark:border-white/[0.07] flex flex-col shadow-2xl animate-slide-left overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.07]">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Payout Details</h2>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5 font-mono">{payout.id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.07] text-gray-400 dark:text-white/40 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Amount hero */}
        <div className="px-6 py-6 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.02]">
          <p className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-2">Amount</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">
            {paiseToInr(payout.amount_paise)}
          </p>
          <div className="mt-3">
            <Badge status={payout.status} />
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-2">
          <Row label="Payout ID"   value={payout.id}                    mono />
          <Row label="Amount"      value={paiseToInr(payout.amount_paise)} />
          <Row label="Status"      value={<Badge status={payout.status} />} />
          <Row label="Attempts"    value={payout.attempt_count} />
          <Row label="Created"     value={formatDate(payout.created_at)} />
          {payout.updated_at && <Row label="Last Updated" value={formatDate(payout.updated_at)} />}
          {payout.bank_account_id && <Row label="Bank Account" value={payout.bank_account_id} mono />}
          {payout.idempotency_key && <Row label="Idempotency Key" value={payout.idempotency_key} mono />}
          {payout.failure_reason && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Failure Reason</p>
              <p className="text-sm text-red-700 dark:text-red-300">{payout.failure_reason}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-100 dark:bg-white/[0.07] hover:bg-gray-200 dark:hover:bg-white/[0.10] text-gray-700 dark:text-white/70 font-semibold text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
