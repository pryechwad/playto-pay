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
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{merchant.name}</h1>
        {hasActive && (
          <span className="flex items-center gap-1 text-xs text-blue-500">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            Processing
          </span>
        )}
      </div>

      <BalanceGrid balance={balance} />

      {bankAccounts.length > 0 && (
        <PayoutForm
          merchantId={merchant.id}
          bankAccounts={bankAccounts}
          onSuccess={refresh}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'payouts'
          ? <PayoutTable payouts={payouts} />
          : <LedgerTable entries={ledger} />
        }
      </div>
    </div>
  )
}
