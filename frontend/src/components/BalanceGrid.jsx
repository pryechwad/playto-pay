import BalanceCard from './BalanceCard'

const CARDS = [
  { key: 'available_paise',     label: 'Available',      iconKey: 'available', accent: 'bg-indigo-50 text-indigo-500' },
  { key: 'held_paise',          label: 'On Hold',        iconKey: 'held',      accent: 'bg-amber-50 text-amber-500'   },
  { key: 'total_credits_paise', label: 'Total Credits',  iconKey: 'credits',   accent: 'bg-emerald-50 text-emerald-500' },
  { key: 'total_debits_paise',  label: 'Total Debits',   iconKey: 'debits',    accent: 'bg-rose-50 text-rose-500'     },
]

export default function BalanceGrid({ balance }) {
  if (!balance) return null
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map(({ key, label, iconKey, accent }) => (
        <BalanceCard key={key} label={label} paise={balance[key]} iconKey={iconKey} accent={accent} />
      ))}
    </div>
  )
}
