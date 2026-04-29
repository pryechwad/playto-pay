import Badge from './Badge'
import { paiseToInr, formatDate } from '../utils/format'

export default function PayoutTable({ payouts }) {
  if (!payouts.length) return (
    <div className="py-12 text-center">
      <p className="text-sm text-gray-400">No payouts yet</p>
      <p className="text-xs text-gray-300 mt-1">Your payout history will appear here</p>
    </div>
  )

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left pb-3 px-1 text-xs font-medium text-gray-400 uppercase tracking-wide">ID</th>
            <th className="text-left pb-3 px-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Amount</th>
            <th className="text-left pb-3 px-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
            <th className="text-left pb-3 px-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Attempts</th>
            <th className="text-left pb-3 px-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {payouts.map(p => (
            <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
              <td className="py-3 px-1 font-mono text-xs text-gray-400">{p.id.slice(0, 8)}…</td>
              <td className="py-3 px-1 font-semibold text-gray-900">{paiseToInr(p.amount_paise)}</td>
              <td className="py-3 px-1"><Badge status={p.status} /></td>
              <td className="py-3 px-1 text-gray-500">{p.attempt_count}</td>
              <td className="py-3 px-1 text-gray-400 text-xs">{formatDate(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
