import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

export const getMerchants = () =>
  api.get('/merchants/').then(r => r.data)

export const getBalance = (merchantId) =>
  api.get(`/merchants/${merchantId}/balance/`).then(r => r.data)

export const getPayouts = (merchantId) =>
  api.get(`/merchants/${merchantId}/payouts/list/`).then(r => r.data)

export const getLedger = (merchantId) =>
  api.get(`/merchants/${merchantId}/ledger/`).then(r => r.data)

export const getBankAccounts = (merchantId) =>
  api.get(`/merchants/${merchantId}/bank-accounts/`).then(r => r.data)

export const createPayout = (merchantId, payload, idempotencyKey) =>
  api.post(`/merchants/${merchantId}/payouts/`, payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  }).then(r => r.data)
