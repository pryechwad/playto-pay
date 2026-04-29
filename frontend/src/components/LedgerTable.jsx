import { paiseToInr, formatDate } from '../utils/format'

export default function LedgerTable({ entries }) {
  if (!entries.length) return (
    <div className="py-12 text-center">
      <p className="text-sm text-gray-400">No transactions yet</p>
      <p className="text-xs text-gray-300 mt-1">Ledger entries will appear here</p>
    </div>
  )

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left pb-3 px-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Type</th>
            <th className="text-left pb-3 px-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Amount</th>
            <th className="text-left pb-3 px-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Description</th>
            <th className="text-left pb-3 px-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {entries.map(e => (
            <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
              <td className="py-3 px-1">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  e.entry_type === 'credit'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {e.entry_type === 'credit' ? '↑' : '↓'} {e.entry_type}
                </span>
              </td>
              <td className={`py-3 px-1 font-semibold ${e.entry_type === 'credit' ? 'text-emerald-700' : 'text-rose-600'}`}>
                {e.entry_type === 'credit' ? '+' : '−'}{paiseToInr(e.amount_paise)}
              </td>
              <td className="py-3 px-1 text-gray-500 max-w-xs truncate">{e.description}</td>
              <td className="py-3 px-1 text-gray-400 text-xs">{formatDate(e.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
