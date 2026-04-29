export default function Header({ merchants, selectedId, onSelect }) {
  return (
    <header className="bg-white border-b px-6 py-3 flex items-center gap-4">
      <span className="font-bold text-indigo-600 text-lg">Playto Pay</span>
      <nav className="flex gap-2 ml-4">
        {merchants.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedId === m.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {m.name}
          </button>
        ))}
      </nav>
    </header>
  )
}
