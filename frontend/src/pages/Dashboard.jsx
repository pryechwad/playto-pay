import { useState } from 'react'
import { useMerchantData } from '../hooks/useMerchantData'
import WithdrawModal from '../components/WithdrawModal'
import PayoutTable from '../components/PayoutTable'
import LedgerTable from '../components/LedgerTable'
import { paiseToInr } from '../utils/format'

const TABS = ['payouts', 'ledger']

function BalanceCard({ label, value, sub, lightAccent, darkAccent, lightBg, darkBg, icon }) {
  return (
    <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4 shadow-sm dark:shadow-none">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${lightBg} dark:${darkBg}`}>
          <span className={`${lightAccent} dark:${darkAccent}`}>{icon}</span>
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold tabular-nums tracking-tight ${lightAccent} dark:${darkAccent}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-white/30 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function StatCard({ label, value, lightColor, darkColor, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left w-full bg-white dark:bg-[#1a1d27] border rounded-2xl px-5 py-4 transition-all shadow-sm dark:shadow-none hover:shadow-md active:scale-[0.98] ${
        active
          ? 'border-violet-400 dark:border-violet-500/60 ring-2 ring-violet-100 dark:ring-violet-500/20'
          : 'border-gray-100 dark:border-white/[0.07] hover:border-gray-200 dark:hover:border-white/[0.12]'
      }`}
    >
      <p className={`text-2xl font-bold tabular-nums ${lightColor} dark:${darkColor}`}>{value}</p>
      <p className="text-xs text-gray-400 dark:text-white/35 mt-1.5 font-medium">{label}</p>
      {active && (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wider">
          <span className="w-1 h-1 rounded-full bg-current" /> Filtered
        </div>
      )}
    </button>
  )
}

export default function Dashboard({ merchant, addToast, activeTab, onTabChange }) {
  const { balance, payouts, ledger, bankAccounts, loading, refresh } = useMerchantData(merchant.id)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [filter, setFilter] = useState(null)

  const tab = (activeTab === 'payouts' || activeTab === 'ledger') ? activeTab : 'payouts'
  const setTab = onTabChange

  const hasActive = payouts.some(p => p.status === 'pending' || p.status === 'processing')
  const successCount = payouts.filter(p => p.status === 'paid' || p.status === 'completed').length
  const pendingCount = payouts.filter(p => p.status === 'pending' || p.status === 'processing').length
  const successRate = payouts.length ? Math.round((successCount / payouts.length) * 100) : 0

  const filteredPayouts = filter === 'paid'
    ? payouts.filter(p => p.status === 'paid' || p.status === 'completed')
    : filter === 'pending'
    ? payouts.filter(p => p.status === 'pending' || p.status === 'processing')
    : payouts

  function toggleFilter(key) {
    setFilter(f => f === key ? null : key)
    setTab('payouts')
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Page title */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{merchant.name}</h1>
          <p className="text-sm text-gray-400 dark:text-white/35 mt-1">Merchant payout overview</p>
        </div>
        <div className="flex items-center gap-3">
          {hasActive && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-2 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
              Processing payouts
            </div>
          )}
          {bankAccounts.length > 0 && (
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/>
              </svg>
              Withdraw Funds
            </button>
          )}
        </div>
      </div>

      {/* Balance row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2 lg:col-span-1 relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-700 p-6 shadow-xl shadow-violet-500/20">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-28 h-28 rounded-full bg-indigo-900/30 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Available Balance</span>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums tracking-tight">
              {balance ? paiseToInr(balance.available_paise) : '—'}
            </p>
            <p className="text-xs text-white/40 mt-1.5">Ready to withdraw</p>
          </div>
        </div>

        <BalanceCard label="On Hold"      value={balance ? paiseToInr(balance.held_paise) : '—'}          sub="Pending clearance" lightAccent="text-amber-600"  darkAccent="text-amber-400"  lightBg="bg-amber-50"  darkBg="bg-amber-400/10"  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
        <BalanceCard label="Total Credits" value={balance ? paiseToInr(balance.total_credits_paise) : '—'} sub="Lifetime inflow"    lightAccent="text-emerald-600" darkAccent="text-emerald-400" lightBg="bg-emerald-50" darkBg="bg-emerald-400/10" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>} />
        <BalanceCard label="Total Debits"  value={balance ? paiseToInr(balance.total_debits_paise) : '—'}  sub="Lifetime outflow"   lightAccent="text-rose-600"    darkAccent="text-rose-400"    lightBg="bg-rose-50"   darkBg="bg-rose-400/10"   icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>} />
      </div>

      {/* Clickable stat cards */}
      <div>
        <p className="text-xs font-semibold text-gray-400 dark:text-white/25 uppercase tracking-wider mb-3">
          Payout Summary
          {filter && <span className="ml-2 text-violet-500 dark:text-violet-400 normal-case tracking-normal font-medium">— click again to clear</span>}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Payouts"        value={payouts.length}    lightColor="text-gray-900"    darkColor="text-white"        active={filter === 'all'}     onClick={() => toggleFilter('all')} />
          <StatCard label="Successful"           value={successCount}      lightColor="text-emerald-600" darkColor="text-emerald-400"  active={filter === 'paid'}    onClick={() => toggleFilter('paid')} />
          <StatCard label="Pending / Processing" value={pendingCount}      lightColor="text-amber-600"   darkColor="text-amber-400"    active={filter === 'pending'} onClick={() => toggleFilter('pending')} />
          <StatCard label="Success Rate"         value={`${successRate}%`} lightColor={successRate >= 80 ? 'text-emerald-600' : 'text-amber-600'} darkColor={successRate >= 80 ? 'text-emerald-400' : 'text-amber-400'} active={false} onClick={() => {}} />
        </div>
      </div>

      {/* Transactions panel */}
      <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.07] rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06]">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Transaction History</h2>
            {balance && (
              <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
                Net flow: <span className="text-gray-700 dark:text-white/60 font-semibold">{paiseToInr((balance.total_credits_paise ?? 0) - (balance.total_debits_paise ?? 0))}</span>
              </p>
            )}
          </div>
          <div className="flex items-center bg-gray-100 dark:bg-white/[0.05] rounded-xl p-1 gap-1">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  tab === t
                    ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-400 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/60'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 py-4">
          {tab === 'payouts'
            ? <PayoutTable payouts={filteredPayouts} bankAccounts={bankAccounts} />
            : <LedgerTable entries={ledger} />
          }
        </div>
      </div>

      {showWithdraw && bankAccounts.length > 0 && (
        <WithdrawModal
          merchantId={merchant.id}
          bankAccounts={bankAccounts}
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => { setShowWithdraw(false); refresh() }}
          addToast={addToast}
        />
      )}
    </div>
  )
}
