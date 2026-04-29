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
    if (!amountPaise || amountPaise <= 0) {
      setError('Enter a valid amount')
      return
    }

    setLoading(true)
    try {
      const data = await createPayout(
        merchantId,
        { amount_paise: amountPaise, bank_account_id: bankAccountId },
        crypto.randomUUID()
      )
      setSuccess(`Payout ${data.id.slice(0, 8)}… created`)
      setAmount('')
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3"
    >
      <h2 className="font-semibold text-gray-700">Request Payout</h2>
      <div className="flex gap-3">
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount (₹)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="border rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        <select
          value={bankAccountId}
          onChange={e => setBankAccountId(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Withdraw'}
        </button>
      </div>
      {error   && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}
    </form>
  )
}
