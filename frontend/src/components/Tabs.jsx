export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-4 border-b mb-4">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`pb-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
            active === t
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
