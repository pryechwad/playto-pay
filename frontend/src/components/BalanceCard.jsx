import { paiseToInr } from '../utils/format'

export default function BalanceCard({ label, paise, color }) {
  return (
    <div className={`rounded-xl p-5 ${color} flex flex-col gap-1`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{paiseToInr(paise)}</span>
      <span className="text-xs text-gray-400">{paise} paise</span>
    </div>
  )
}
