import { paiseToInr } from '../utils/format'

const CONFIG = {
  available: {
    label: 'Available Balance',
    hero: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  held: {
    label: 'On Hold',
    accent: 'text-amber-400',
    iconBg: 'bg-amber-400/10',
    iconColor: 'text-amber-400',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  credits: {
    label: 'Total Credits',
    accent: 'text-emerald-400',
    iconBg: 'bg-emerald-400/10',
    iconColor: 'text-emerald-400',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
  },
  debits: {
    label: 'Total Debits',
    accent: 'text-rose-400',
    iconBg: 'bg-rose-400/10',
    iconColor: 'text-rose-400',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
      </svg>
    ),
  },
}

export default function BalanceCard({ iconKey, paise, onWithdraw }) {
  const c = CONFIG[iconKey]

  if (c.hero) {
    return (
      <div className="col-span-2 lg:col-span-1 relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 p-5">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-indigo-900/40 blur-xl" />

        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white">
                {c.icon}
              </div>
              <span className="text-xs font-medium text-white/60 tracking-wide">{c.label}</span>
            </div>
            <span className="text-[10px] font-mono text-white/40 bg-white/10 px-2 py-0.5 rounded-md">INR</span>
          </div>

          <p className="text-3xl font-bold text-white tracking-tight tabular-nums">{paiseToInr(paise)}</p>
          <p className="text-xs text-white/40 mt-1">{(paise / 100).toFixed(2)} available</p>

          {onWithdraw && (
            <button
              onClick={onWithdraw}
              className="mt-5 flex items-center gap-2 bg-white text-violet-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-violet-50 active:scale-95 transition-all shadow-xl shadow-black/20"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/>
              </svg>
              Withdraw Funds
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3 hover:bg-white/[0.06] transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/35 font-medium">{c.label}</span>
        <div className={`w-7 h-7 rounded-lg ${c.iconBg} ${c.iconColor} flex items-center justify-center`}>
          {c.icon}
        </div>
      </div>
      <div>
        <p className={`text-xl font-bold ${c.accent} tabular-nums tracking-tight`}>{paiseToInr(paise)}</p>
        <p className="text-xs text-white/20 mt-0.5 font-mono">{(paise / 100).toFixed(2)} INR</p>
      </div>
    </div>
  )
}
