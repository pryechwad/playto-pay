import { useState, useEffect, useRef } from 'react'
import { createPayout, getPayout } from '../api/client'
import { paiseToInr } from '../utils/format'

const STEP = { CONFIRM: 'confirm', SUBMITTED: 'submitted', DONE: 'done' }

// Poll the DB every 2s until payout reaches a terminal state
function usePayoutPoller(merchantId, payoutId, onDone) {
  const timerRef = useRef(null)

  useEffect(() => {
    if (!payoutId) return
    let cancelled = false

    async function poll() {
      try {
        const p = await getPayout(merchantId, payoutId)
        if (cancelled) return
        if (p && (p.status === 'completed' || p.status === 'failed')) {
          onDone(p)
          return
        }
      } catch {}
      if (!cancelled) timerRef.current = setTimeout(poll, 2000)
    }

    timerRef.current = setTimeout(poll, 1500)
    return () => { cancelled = true; clearTimeout(timerRef.current) }
  }, [payoutId])
}

function StatusIcon({ status }) {
  if (status === 'completed') return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-28 h-28 rounded-full bg-emerald-400/10 animate-ping" style={{ animationDuration: '1.5s' }} />
      <div className="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-400/40 flex items-center justify-center animate-pop">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
    </div>
  )

  if (status === 'failed') return (
    <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-400/30 flex items-center justify-center animate-pop">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    </div>
  )

  // pending / processing
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-white/5 dark:border-white/5 border-gray-100" />
      <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      </div>
    </div>
  )
}

function StatusStep({ label, state }) {
  // state: 'done' | 'active' | 'pending' | 'failed'
  const colors = {
    done:    'bg-emerald-500 border-emerald-500 text-white',
    active:  'bg-violet-500 border-violet-500 text-white',
    pending: 'bg-transparent border-gray-200 dark:border-white/10 text-gray-300 dark:text-white/20',
    failed:  'bg-red-500 border-red-500 text-white',
  }
  const lineColors = {
    done: 'bg-emerald-400',
    active: 'bg-gradient-to-b from-violet-400 to-gray-200 dark:to-white/10',
    pending: 'bg-gray-200 dark:bg-white/[0.07]',
    failed: 'bg-red-400',
  }
  const labelColors = {
    done: 'text-emerald-600 dark:text-emerald-400',
    active: 'text-violet-600 dark:text-violet-400 font-semibold',
    pending: 'text-gray-300 dark:text-white/25',
    failed: 'text-red-500 dark:text-red-400',
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${colors[state]}`}>
        {state === 'done' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        {state === 'active' && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
        {state === 'failed' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
      </div>
      <span className={`text-sm transition-all ${labelColors[state]}`}>{label}</span>
    </div>
  )
}

function getStepStates(status) {
  switch (status) {
    case 'pending':    return ['done', 'active', 'pending']
    case 'processing': return ['done', 'done',   'active']
    case 'completed':  return ['done', 'done',   'done']
    case 'failed':     return ['done', 'done',   'failed']
    default:           return ['active', 'pending', 'pending']
  }
}

export default function WithdrawModal({ merchantId, bankAccounts, onClose, onSuccess, addToast }) {
  const [amount, setAmount] = useState('')
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? '')
  const [step, setStep] = useState(STEP.CONFIRM)
  const [errorMsg, setErrorMsg] = useState('')
  const [payout, setPayout] = useState(null)   // live payout object from DB

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const selectedBank = bankAccounts.find(a => a.id === bankAccountId)
  const amountPaise = Math.round(parseFloat(amount) * 100)
  const valid = amountPaise > 0

  // Poll DB until terminal status
  usePayoutPoller(merchantId, payout?.id, (finalPayout) => {
    setPayout(finalPayout)
    setStep(STEP.DONE)
    if (finalPayout.status === 'completed') {
      addToast({ type: 'success', title: 'Transfer successful', message: `${paiseToInr(finalPayout.amount_paise)} sent to your bank.` })
    } else {
      addToast({ type: 'error', title: 'Transfer failed', message: 'Funds have been refunded to your balance.' })
    }
  })

  async function handleConfirm() {
    if (!valid) return
    try {
      const data = await createPayout(merchantId, { amount_paise: amountPaise, bank_account_id: bankAccountId }, crypto.randomUUID())
      setPayout(data)
      setStep(STEP.SUBMITTED)
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Something went wrong. Please try again.'
      setErrorMsg(msg)
      addToast({ type: 'error', title: 'Withdrawal failed', message: msg })
    }
  }

  const stepStates = payout ? getStepStates(payout.status) : ['active', 'pending', 'pending']
  const isDone = step === STEP.DONE
  const isCompleted = payout?.status === 'completed'
  const isFailed = payout?.status === 'failed'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isDone ? onClose : undefined}
      />

      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#13151f] border border-gray-100 dark:border-white/[0.08] sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up">

        {/* Mobile handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/10" />
        </div>

        {/* ── CONFIRM STEP ── */}
        {step === STEP.CONFIRM && (
          <div className="px-6 pb-8 pt-5">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Withdraw Funds</h2>
                <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Transfer to your bank account</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.07] text-gray-400 dark:text-white/40 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Amount */}
            <div className="text-center mb-7">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-white/25 uppercase tracking-[0.15em] mb-4">Enter Amount</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-light text-gray-300 dark:text-white/30">₹</span>
                <input
                  type="number" min="0.01" step="0.01" placeholder="0.00"
                  value={amount} onChange={e => setAmount(e.target.value)} autoFocus
                  className="text-5xl font-bold text-gray-900 dark:text-white w-48 text-center bg-transparent border-none outline-none placeholder-gray-200 dark:placeholder-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="mt-4 h-px w-40 mx-auto bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
              {errorMsg && <p className="text-xs text-red-500 mt-3">{errorMsg}</p>}
            </div>

            {/* Bank selector */}
            <div className="mb-6">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-white/25 uppercase tracking-[0.15em] mb-3">To Account</p>
              <div className="flex flex-col gap-2">
                {bankAccounts.map(a => (
                  <button
                    key={a.id} onClick={() => setBankAccountId(a.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                      bankAccountId === a.id
                        ? 'border-violet-400 dark:border-violet-500/50 bg-violet-50 dark:bg-violet-500/10'
                        : 'border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${bankAccountId === a.id ? 'bg-violet-500' : 'bg-gray-200 dark:bg-white/10'}`}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{a.account_holder_name}</p>
                      <p className="text-xs text-gray-400 dark:text-white/30 font-mono">•••• {a.account_number.slice(-4)} · {a.ifsc_code}</p>
                    </div>
                    {bankAccountId === a.id && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleConfirm} disabled={!valid}
              className="w-full py-4 rounded-2xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-500 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
            >
              {valid ? `Withdraw ${paiseToInr(amountPaise)}` : 'Enter an amount'}
            </button>
          </div>
        )}

        {/* ── LIVE STATUS SCREEN (SUBMITTED + DONE) ── */}
        {(step === STEP.SUBMITTED || step === STEP.DONE) && (
          <div className="px-6 pt-8 pb-8 flex flex-col items-center gap-6">

            {/* Big status icon */}
            <StatusIcon status={payout?.status ?? 'pending'} />

            {/* Amount + label */}
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{paiseToInr(amountPaise)}</p>
              <p className={`text-base font-semibold mt-1 ${
                isCompleted ? 'text-emerald-500' :
                isFailed    ? 'text-red-500' :
                              'text-violet-500 dark:text-violet-400'
              }`}>
                {isCompleted ? 'Transfer Successful' :
                 isFailed    ? 'Transfer Failed' :
                 payout?.status === 'processing' ? 'Processing Transfer…' :
                               'Initiating Transfer…'}
              </p>
              {selectedBank && (
                <p className="text-sm text-gray-400 dark:text-white/35 mt-1">
                  {isCompleted ? 'Sent to' : 'To'} {selectedBank.account_holder_name} •••• {selectedBank.account_number.slice(-4)}
                </p>
              )}
              {isFailed && (
                <p className="text-xs text-gray-400 dark:text-white/30 mt-1">Funds refunded to your balance</p>
              )}
            </div>

            {/* Live step tracker */}
            <div className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-5 flex flex-col gap-0">
              {[
                { label: 'Transfer initiated', idx: 0 },
                { label: 'Bank processing',    idx: 1 },
                { label: isFailed ? 'Transfer failed — funds refunded' : 'Transfer complete', idx: 2 },
              ].map((s, i) => (
                <div key={s.label}>
                  <StatusStep label={s.label} state={stepStates[s.idx]} />
                  {i < 2 && (
                    <div className={`ml-3 w-0.5 h-5 my-0.5 rounded-full ${
                      stepStates[s.idx] === 'done' ? 'bg-emerald-400/50' : 'bg-gray-200 dark:bg-white/[0.07]'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Ref ID */}
            {payout?.id && (
              <p className="text-[11px] text-gray-300 dark:text-white/20 font-mono">
                Ref: {payout.id.slice(0, 16).toUpperCase()}
              </p>
            )}

            {isDone && (
              <button
                onClick={() => { onSuccess(); onClose() }}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${
                  isCompleted
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-gray-100 dark:bg-white/[0.07] hover:bg-gray-200 dark:hover:bg-white/[0.10] text-gray-700 dark:text-white/70'
                }`}
              >
                {isCompleted ? 'Done' : 'Close'}
              </button>
            )}

            {/* Waiting hint */}
            {!isDone && (
              <p className="text-xs text-gray-300 dark:text-white/20 text-center">
                Please wait, do not close this window
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
