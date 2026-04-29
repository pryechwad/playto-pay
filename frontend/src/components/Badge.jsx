const STATUS = {
  pending:    { dot: 'bg-amber-400',   cls: 'bg-amber-50 text-amber-700 border-amber-200'   },
  processing: { dot: 'bg-blue-400 animate-pulse', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed:  { dot: 'bg-emerald-400', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed:     { dot: 'bg-red-400',     cls: 'bg-red-50 text-red-700 border-red-200'         },
}

export default function Badge({ status }) {
  const s = STATUS[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-50 text-gray-600 border-gray-200' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}
