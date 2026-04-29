export function paiseToInr(paise) {
  return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
}

export function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN')
}
