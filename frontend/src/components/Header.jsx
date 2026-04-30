import { useState } from 'react'

const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40 shrink-0">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    </div>
    <div className="leading-tight">
      <p className="font-bold text-white text-sm tracking-tight">Playto Pay</p>
      <p className="text-[10px] text-white/30">Payout Engine</p>
    </div>
  </div>
)

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
        active
          ? 'bg-violet-600/20 text-violet-300 font-medium'
          : 'text-white/40 hover:bg-white/[0.05] hover:text-white/70'
      }`}
    >
      <span className={active ? 'text-violet-400' : 'text-white/30'}>{icon}</span>
      {label}
    </button>
  )
}

function MerchantItem({ merchant, active, onSelect, onClose }) {
  return (
    <button
      onClick={() => { onSelect(merchant); onClose?.() }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left group ${
        active
          ? 'bg-white/[0.08] text-white font-medium'
          : 'text-white/45 hover:bg-white/[0.04] hover:text-white/75'
      }`}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
        active ? 'bg-violet-500 text-white' : 'bg-white/[0.07] text-white/40 group-hover:bg-white/10'
      }`}>
        {merchant.name.charAt(0)}
      </div>
      <span className="truncate flex-1">{merchant.name}</span>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
    </button>
  )
}

const DashIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)
const PayoutIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const LedgerIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

function SidebarContent({ merchants, selectedId, onSelect, onClose }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Logo />
      </div>

      {/* Nav */}
      <div className="px-3 pt-5 pb-2">
        <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em] px-3 mb-2">Navigation</p>
        <NavItem icon={DashIcon} label="Overview" active />
        <NavItem icon={PayoutIcon} label="Payouts" />
        <NavItem icon={LedgerIcon} label="Ledger" />
      </div>

      <div className="h-px bg-white/[0.05] mx-5 my-3" />

      {/* Merchants */}
      <div className="px-3 flex-1 overflow-y-auto scrollbar-thin">
        <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em] px-3 mb-2">Merchants</p>
        <div className="flex flex-col gap-0.5">
          {merchants.map(m => (
            <MerchantItem
              key={m.id}
              merchant={m}
              active={selectedId === m.id}
              onSelect={onSelect}
              onClose={onClose}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60" />
          <p className="text-[11px] text-white/25">All systems operational</p>
        </div>
      </div>
    </div>
  )
}

export default function Header({ merchants, selectedId, onSelect }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 h-screen sticky top-0 bg-[#0c0e18] border-r border-white/[0.06] flex-col">
        <SidebarContent merchants={merchants} selectedId={selectedId} onSelect={onSelect} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0c0e18]/95 backdrop-blur-md border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <Logo />
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.07] text-white/50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-[#0c0e18] h-full flex flex-col border-r border-white/[0.06] animate-slide-right">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/[0.07] text-white/40 z-10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <SidebarContent merchants={merchants} selectedId={selectedId} onSelect={onSelect} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
