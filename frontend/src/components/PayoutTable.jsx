import Badge from './Badge'
import { paiseToInr, formatDate } from '../utils/format'

export default function PayoutTable({ payouts }) {
  if (!payouts.length) return <p className="text-gray-400 text-sm">No payouts yet.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b">
            <th className="pb-2 font-medium">ID</th>
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Attempts</th>
            <th className="pb-2 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map(p => (
            <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-2 font-mono text-xs text-gray-500">{p.id.slice(0, 8)}…</td>
              <td className="py-2 font-medium">{paiseToInr(p.amount_paise)}</td>
              <td className="py-2"><Badge status={p.status} /></td>
              <td className="py-2 text-gray-500">{p.attempt_count}</td>
              <td className="py-2 text-gray-400">{formatDate(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
