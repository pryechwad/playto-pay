import { useState } from 'react'
import { useMerchantData } from '../hooks/useMerchantData'
import BalanceGrid from '../components/BalanceGrid'
import PayoutForm from '../components/PayoutForm'
import PayoutTable from '../components/PayoutTable'
import LedgerTable from '../components/LedgerTable'
import Tabs from '../components/Tabs'

const TABS = ['payouts', 'ledger']

export default function Dashboard({ merchant }) {
  const { balance, payouts, ledger, bankAccounts, refresh } = useMerchantData(merchant.id)
  const [tab, setTab] = useState('payouts')

  const hasActive = payouts.some(p => p.status === 'pending' || p.status === 'processing')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{merchant.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Merchant dashboard</p>
        </div>
        {hasActive && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Payout processing
          </div>
        )}
      </div>

      <BalanceGrid balance={balance} />

      {bankAccounts.length > 0 && (
        <PayoutForm merchantId={merchant.id} bankAccounts={bankAccounts} onSuccess={refresh} />
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'payouts' ? <PayoutTable payouts={payouts} /> : <LedgerTable entries={ledger} />}
      </div>
    </div>
  )
}
