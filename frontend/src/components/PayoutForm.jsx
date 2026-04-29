import { useState } from 'react'
import { createPayout } from '../api/client'

export default function PayoutForm({ merchantId, bankAccounts, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const amountPaise = Math.round(parseFloat(amount) * 100)
    if (!amountPaise || amountPaise <= 0) { setError('Enter a valid amount'); return }
    setLoading(true)
    try {
      const data = await createPayout(merchantId, { amount_paise: amountPaise, bank_account_id: bankAccountId }, crypto.randomUUID())
      setSuccess(`Payout ${data.id.slice(0, 8)}… submitted — check history for status`)
      setAmount('')
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Withdraw Funds</h2>
        <p className="text-xs text-gray-400 mt-0.5">Transfer your available balance to a bank account</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <select
            value={bankAccountId}
            onChange={e => setBankAccountId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          >
            {bankAccounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.account_holder_name} ···{a.account_number.slice(-4)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {loading ? 'Processing…' : 'Withdraw'}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {success}
          </div>
        )}
      </form>
    </div>
  )
}
