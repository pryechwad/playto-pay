import { paiseToInr, formatDate } from '../utils/format'

function EntryTypeBadge({ type }) {
  const cls = type === 'credit'
    ? 'bg-green-100 text-green-700'
    : 'bg-red-100 text-red-700'
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{type}</span>
  )
}

export default function LedgerTable({ entries }) {
  if (!entries.length) return <p className="text-gray-400 text-sm">No transactions yet.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b">
            <th className="pb-2 font-medium">Type</th>
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-2"><EntryTypeBadge type={e.entry_type} /></td>
              <td className={`py-2 font-medium ${e.entry_type === 'credit' ? 'text-green-700' : 'text-red-600'}`}>
                {e.entry_type === 'credit' ? '+' : '−'}{paiseToInr(e.amount_paise)}
              </td>
              <td className="py-2 text-gray-500 max-w-xs truncate">{e.description}</td>
              <td className="py-2 text-gray-400">{formatDate(e.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
