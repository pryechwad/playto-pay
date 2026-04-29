import BalanceCard from './BalanceCard'

const CARDS = [
  { key: 'available_paise',      label: 'Available',      color: 'bg-indigo-50' },
  { key: 'held_paise',           label: 'Held',           color: 'bg-yellow-50' },
  { key: 'total_credits_paise',  label: 'Total Credits',  color: 'bg-green-50'  },
  { key: 'total_debits_paise',   label: 'Total Debits',   color: 'bg-red-50'    },
]

export default function BalanceGrid({ balance }) {
  if (!balance) return null
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map(({ key, label, color }) => (
        <BalanceCard key={key} label={label} paise={balance[key]} color={color} />
      ))}
    </div>
  )
}
