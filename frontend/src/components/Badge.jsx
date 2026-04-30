const STATUS = {
  pending:    { dot: 'bg-amber-400',              cls: 'bg-amber-400/10 text-amber-400 border-amber-400/20'   },
  processing: { dot: 'bg-blue-400 animate-pulse', cls: 'bg-blue-400/10 text-blue-400 border-blue-400/20'     },
  completed:  { dot: 'bg-emerald-400',            cls: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  paid:       { dot: 'bg-emerald-400',            cls: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  failed:     { dot: 'bg-red-400',               cls: 'bg-red-400/10 text-red-400 border-red-400/20'         },
}

export default function Badge({ status }) {
  const s = STATUS[status] ?? { dot: 'bg-white/30', cls: 'bg-white/5 text-white/40 border-white/10' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  )
}
