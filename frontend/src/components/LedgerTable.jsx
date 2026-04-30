import { paiseToInr, formatDate } from '../utils/format'

export default function LedgerTable({ entries }) {
  if (!entries.length) return (
    <div className="py-16 flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.07] flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-white/20">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-400 dark:text-white/30">No ledger entries</p>
        <p className="text-xs text-gray-300 dark:text-white/15 mt-1">Transaction history will appear here</p>
      </div>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/[0.06]">
            {['Type', 'Amount', 'Description', 'Date'].map(h => (
              <th key={h} className="text-left py-3 pr-4 text-[11px] font-semibold text-gray-400 dark:text-white/25 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={e.id} className={`border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.025] transition-colors ${i === entries.length - 1 ? 'border-b-0' : ''}`}>
              <td className="py-4 pr-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  e.entry_type === 'credit'
                    ? 'bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/20'
                    : 'bg-rose-50 dark:bg-rose-400/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-400/20'
                }`}>
                  {e.entry_type === 'credit' ? '↑' : '↓'} {e.entry_type}
                </span>
              </td>
              <td className="py-4 pr-4">
                <span className={`text-sm font-semibold tabular-nums ${e.entry_type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {e.entry_type === 'credit' ? '+' : '−'}{paiseToInr(e.amount_paise)}
                </span>
              </td>
              <td className="py-4 pr-4">
                <span className="text-sm text-gray-500 dark:text-white/40 max-w-xs truncate block">{e.description}</span>
              </td>
              <td className="py-4">
                <span className="text-xs text-gray-400 dark:text-white/30">{formatDate(e.created_at)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
