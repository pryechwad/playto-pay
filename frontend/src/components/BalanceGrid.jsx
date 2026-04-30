import BalanceCard from './BalanceCard'

const CARDS = [
  { key: 'available_paise', iconKey: 'available' },
  { key: 'held_paise',      iconKey: 'held'      },
  { key: 'total_credits_paise', iconKey: 'credits' },
  { key: 'total_debits_paise',  iconKey: 'debits'  },
]

export default function BalanceGrid({ balance, onWithdraw }) {
  if (!balance) return null
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARDS.map(({ key, iconKey }) => (
        <BalanceCard
          key={key}
          iconKey={iconKey}
          paise={balance[key]}
          onWithdraw={iconKey === 'available' ? onWithdraw : undefined}
        />
      ))}
    </div>
  )
}
