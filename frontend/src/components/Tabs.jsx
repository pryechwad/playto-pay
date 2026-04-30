export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-white/[0.07] mb-5">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 pb-3 text-sm font-medium capitalize border-b-2 -mb-px transition-all ${
            active === t
              ? 'border-violet-500 text-white'
              : 'border-transparent text-white/30 hover:text-white/60'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
