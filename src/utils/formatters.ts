/**
 * Utilities for formatting Brazilian phone numbers, CEP, currency, etc.
 */

export function formatBRPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) {
    return `(${digits}`
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function formatBRCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (!digits) return ''
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

/**
 * Remove manufacturer prefix from vehicle string to show only the vehicle model
 */
export function getCleanVehicleModel(modelStr?: string): string {
  if (!modelStr) return 'Utilitário'
  const clean = modelStr
    .replace(/^(vw|volkswagen|fiat|renault|peugeot|citroen|citroën|mercedes|mercedes-benz|ford|iveco|hyundai|kia)\s+/i, '')
    .trim()
  return clean || 'Utilitário'
}

/**
 * Format opportunity or order identification code without prefix (e.g., #00002, #00003)
 */
export function formatOrderCode(orderNumber?: number | string): string {
  if (orderNumber === undefined || orderNumber === null || orderNumber === '') return '#00001'
  const numeric = typeof orderNumber === 'string' ? parseInt(orderNumber.replace(/\D/g, ''), 10) : orderNumber
  if (isNaN(numeric) || numeric <= 0) return '#00001'
  return `#${String(numeric).padStart(5, '0')}`
}
