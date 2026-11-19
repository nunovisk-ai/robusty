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

export function formatCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

export function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

export function formatRG(value: string): string {
  const cleaned = value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 10).toUpperCase()
  if (cleaned.length <= 2) return cleaned
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}-${cleaned.slice(8)}`
}

export function formatCNH(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

export function formatDocumentBy(value: string, type: 'cpf' | 'rg' | 'cnh' | 'cnpj' | string): string {
  if (type === 'cpf') return formatCPF(value)
  if (type === 'cnpj') return formatCNPJ(value)
  if (type === 'rg') return formatRG(value)
  if (type === 'cnh') return formatCNH(value)
  return value
}

export function formatIE(value: string): string {
  const upper = value.trim().toUpperCase()
  if (upper === 'ISENTO' || upper.startsWith('ISEN')) return 'ISENTO'
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits || value.slice(0, 14)
}
