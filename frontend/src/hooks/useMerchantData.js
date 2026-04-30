import { useState, useEffect, useCallback } from 'react'
import { getBalance, getPayouts, getLedger, getBankAccounts } from '../api/client'

const POLL_INTERVAL = 4000

export function useMerchantData(merchantId) {
  const [balance, setBalance] = useState(null)
  const [payouts, setPayouts] = useState([])
  const [ledger, setLedger] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [bal, pay, led, banks] = await Promise.all([
        getBalance(merchantId),
        getPayouts(merchantId),
        getLedger(merchantId),
        getBankAccounts(merchantId),
      ])
      setBalance(bal)
      setPayouts(pay)
      setLedger(led)
      setBankAccounts(banks)
    } catch {
      // silently ignore poll failures — stale data stays on screen
    } finally {
      setLoading(false)
    }
  }, [merchantId])

  useEffect(() => {
    setLoading(true)
    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [refresh])

  return { balance, payouts, ledger, bankAccounts, loading, refresh }
}
