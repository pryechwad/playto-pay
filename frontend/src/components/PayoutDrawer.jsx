import { useEffect } from 'react'
import Badge from './Badge'
import { paiseToInr, formatDate } from '../utils/format'

function Row({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-white/[0.06] last:border-0">
      <span className="text-xs font-medium text-gray-400 dark:text-white/35 uppercase tracking-wider shrink-0 mt-0.5">{label}</span>
      <span className={`text-sm text-right text-gray-800 dark:text-white/80 break-all ${mono ? 'font-mono text-xs leading-relaxed' : 'font-medium'}`}>{value}</span>
    </div>
  )
}

function TimelineStep({ label, sublabel, state }) {
  const dotClass = {
    done:    'bg-emerald-500 border-emerald-500',
    active:  'bg-violet-500 border-violet-500',
    pending: 'bg-transparent border-gray-200 dark:border-white/10',
    failed:  'bg-red-500 border-red-500',
  }[state]

  const labelClass = {
    done:    'text-gray-800 dark:text-white/80',
    active:  'text-violet-600 dark:text-violet-400 font-semibold',
    pending: 'text-gray-300 dark:text-white/20',
    failed:  'text-red-500 dark:text-red-400',
  }[state]

  const lineClass = state === 'done'
    ? 'bg-emerald-400/60'
    : state === 'failed'
    ? 'bg-red-400/40'
    : 'bg-gray-200 dark:bg-white/[0.07]'

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${dotClass}`}>
          {state === 'done' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
          {state === 'active' && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
          {state === 'failed' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
        </div>
        <div className={`w-0.5 flex-1 min-h-[20px] mt-1 rounded-full ${lineClass}`} />
      </div>
      <div className="pb-4">
        <p className={`text-sm ${labelClass}`}>{label}</p>
        {sublabel && <p className="text-xs text-gray-400 dark:text-white/25 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}

export default function PayoutDrawer({ payout, bankAccounts, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [])

  const bank = bankAccounts?.find(b => b.id === payout.bank_account_id)
  const isCompleted = payout.status === 'completed' || payout.status === 'paid'
  const isFailed = payout.status === 'failed'
  const isProcessing = payout.status === 'processing'
  const isPending = payout.status === 'pending'

  const steps = [
    {
      label: 'Transfer initiated',
      sublabel: formatDate(payout.created_at),
      state: 'done',
    },
    {
      label: 'Bank processing',
      sublabel: payout.processing_started_at ? formatDate(payout.processing_started_at) : null,
      state: isCompleted || isFailed ? 'done' : isProcessing ? 'active' : 'pending',
    },
    {
      label: isFailed ? 'Transfer failed — funds refunded' : 'Transfer complete',
      sublabel: isCompleted ? formatDate(payout.updated_at) : null,
      state: isCompleted ? 'done' : isFailed ? 'failed' : 'pending',
    },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — centered */}
      <div className="relative w-full max-w-md max-h-[90vh] bg-white dark:bg-[#13151f] border border-gray-100 dark:border-white/[0.08] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-pop">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06] shrink-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Transaction Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.07] text-gray-400 dark:text-white/40 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">

          {/* Amount hero */}
          <div className={`px-6 py-8 flex flex-col items-center gap-3 ${
            isCompleted ? 'bg-emerald-50 dark:bg-emerald-500/5' :
            isFailed    ? 'bg-red-50 dark:bg-red-500/5' :
                          'bg-violet-50 dark:bg-violet-500/5'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isCompleted ? 'bg-emerald-100 dark:bg-emerald-500/15' :
              isFailed    ? 'bg-red-100 dark:bg-red-500/15' :
                            'bg-violet-100 dark:bg-violet-500/15'
            }`}>
              {isCompleted && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
              {isFailed   && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
              {(isPending || isProcessing) && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{paiseToInr(payout.amount_paise)}</p>
            <div className="flex items-center gap-2">
              <Badge status={payout.status} />
            </div>
            {bank && (
              <p className="text-sm text-gray-500 dark:text-white/40 text-center">
                {isCompleted ? 'Sent to' : 'To'} <span className="font-medium text-gray-700 dark:text-white/60">{bank.account_holder_name}</span> •••• {bank.account_number.slice(-4)}
              </p>
            )}
          </div>

          <div className="px-6 py-5 flex flex-col gap-6">

            {/* Timeline */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-white/25 uppercase tracking-wider mb-4">Timeline</p>
              <div>
                {steps.map((s, i) => (
                  <div key={i} className={i === steps.length - 1 ? '[&>div>div:last-child]:hidden' : ''}>
                    <TimelineStep {...s} />
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction info */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-white/25 uppercase tracking-wider mb-2">Transaction Info</p>
              <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl px-4">
                <Row label="Payout ID"    value={payout.id} mono />
                <Row label="Amount"       value={paiseToInr(payout.amount_paise)} />
                <Row label="Attempts"     value={String(payout.attempt_count)} />
                <Row label="Created"      value={formatDate(payout.created_at)} />
                {payout.updated_at && <Row label="Updated" value={formatDate(payout.updated_at)} />}
              </div>
            </div>

            {/* Bank account */}
            {bank && (
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-white/25 uppercase tracking-wider mb-2">Destination Account</p>
                <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600 dark:text-violet-400">
                      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{bank.account_holder_name}</p>
                    <p className="text-xs text-gray-400 dark:text-white/35 font-mono mt-0.5">•••• {bank.account_number.slice(-4)} · {bank.ifsc_code}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reference IDs */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-white/25 uppercase tracking-wider mb-2">Reference IDs</p>
              <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl px-4">
                <Row label="Payout"    value={payout.id} mono />
                <Row label="Merchant"  value={payout.merchant_id} mono />
                <Row label="Bank Acct" value={payout.bank_account_id} mono />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.06] shrink-0">
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
