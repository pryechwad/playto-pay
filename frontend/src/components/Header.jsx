export default function Header({ merchants, selectedId, onSelect }) {
  return (
    <aside className="w-56 shrink-0 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm tracking-tight">Playto Pay</span>
        </div>
      </div>

      <div className="px-3 pt-4 pb-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-1">Merchants</p>
        <nav className="flex flex-col gap-0.5">
          {merchants.map(m => (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedId === m.id
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="block truncate">{m.name}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto px-5 py-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400">Payout Engine v1.0</p>
      </div>
    </aside>
  )
}
