import { useState } from 'react'
import Badge from './Badge'
import PayoutDrawer from './PayoutDrawer'
import { paiseToInr, formatDate } from '../utils/format'

export default function PayoutTable({ payouts, bankAccounts }) {
  const [selected, setSelected] = useState(null)

  if (!payouts.length) return (
    <div className="py-16 flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.07] flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-white/20">
          <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-400 dark:text-white/30">No payouts yet</p>
        <p className="text-xs text-gray-300 dark:text-white/15 mt-1">Payout history will appear here</p>
      </div>
    </div>
  )

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/[0.06]">
              {['Payout ID', 'Amount', 'Status', 'Attempts', 'Created', ''].map(h => (
                <th key={h} className="text-left py-3 pr-4 text-[11px] font-semibold text-gray-400 dark:text-white/25 uppercase tracking-wider last:pr-0">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payouts.map((p, i) => (
              <tr
                key={p.id}
                onClick={() => setSelected(p)}
                className={`border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.025] transition-colors cursor-pointer group ${i === payouts.length - 1 ? 'border-b-0' : ''}`}
              >
                <td className="py-4 pr-4">
                  <span className="font-mono text-xs text-gray-400 dark:text-white/25 group-hover:text-gray-600 dark:group-hover:text-white/40 transition-colors bg-gray-100 dark:bg-white/[0.04] px-2 py-1 rounded-md">
                    {p.id.slice(0, 8)}…
                  </span>
                </td>
                <td className="py-4 pr-4">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{paiseToInr(p.amount_paise)}</span>
                </td>
                <td className="py-4 pr-4"><Badge status={p.status} /></td>
                <td className="py-4 pr-4">
                  <span className="text-sm text-gray-400 dark:text-white/40 tabular-nums">{p.attempt_count}</span>
                </td>
                <td className="py-4 pr-4">
                  <span className="text-xs text-gray-400 dark:text-white/30">{formatDate(p.created_at)}</span>
                </td>
                <td className="py-4 text-right">
                  <span className="text-gray-300 dark:text-white/20 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <PayoutDrawer
          payout={selected}
          bankAccounts={bankAccounts}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
