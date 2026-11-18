import { supabase } from '../lib/supabase'
import { Vehicle, Product, PaymentMethod } from '../types'
import { initialVehicles, initialProducts } from '../data/initialCatalog'

export async function fetchVehicles(): Promise<Vehicle[]> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_active', true)
      .order('model')
    
    if (error || !data || data.length === 0) {
      return initialVehicles
    }
    return data as Vehicle[]
  } catch {
    return initialVehicles
  }
}

const SKU_WEIGHT_MAP: Record<string, number> = {
  'KOM-MX100-PLUS': 38,
  'KOM-MX200-PLUS': 38,
  'KOM-MX80-PLUS': 28,
  'KOM-MX50-PLUS': 16,
  'KOM-ESCADA': 9,
  'KOM-VENTOSAS': 1.5,
  'KOM-ESTEPE': 3.5,
  'KOM-HASTE-UNID': 0.5,
  'KOM-KIT-HASTES-8P': 4,
  'KOM-KIT-FIX-ESC': 0.8,
  'KOM-SUP-TOLDO': 2,
  'KOM-SUP-TOLDO-LEROY': 2,
  'KOM-BARRA-SOLAR': 3.5,
  'KOM-DECK-MX100': 18,
  'KOM-MEIO-DECK-MX100': 9,
  'KOM-DECK-MX80': 12,
  'KOM-DECK-MX50': 6,
  'KOM-DECK-ESCADA': 2.5,
  'KAN-KX100': 24,
  'KAN-KX200': 24,
  'KAN-KX200-NOVA': 26,
  'FIO-FX100': 22,
  'FIO-FX200': 22,
  'DOB-DX100': 23,
  'DOB-DX200': 23,
  'K0-MX120': 34,
  'K0-ABA-DUPLA': 35,
  'K0-EXTREME': 42,
  'K0-DECK-MX120': 16,
  'K0-DECK-ESCADA': 2.5,
  'K0-ESCADA': 10,
  'K0-SUP-ROLETE': 6,
  'DUC-MAX-2023': 45,
  'SAV-CS': 22,
  'SAV-CD': 20,
  'SAV-ROLETE': 8,
  'MAS-L3H2': 48,
  'EXP-STANDARD': 24,
  'DAI-FURGAO': 52,
  'SPR-415-515': 55,
  'HR-CABINE': 26,
  'JBOX-L3H2': 46,
}

function enrichProductWithWeight(product: Product): Product {
  if (product.weight_kg !== undefined && product.weight_kg !== null && product.weight_kg > 0) {
    return product
  }

  const skuUpper = product.sku?.trim().toUpperCase()
  if (skuUpper && SKU_WEIGHT_MAP[skuUpper] !== undefined) {
    return { ...product, weight_kg: SKU_WEIGHT_MAP[skuUpper] }
  }

  const catalogMatch = initialProducts.find(
    (ip) =>
      (ip.sku && skuUpper && ip.sku.toUpperCase() === skuUpper) ||
      ip.name.trim().toLowerCase() === product.name.trim().toLowerCase()
  )
  if (catalogMatch?.weight_kg !== undefined) {
    return { ...product, weight_kg: catalogMatch.weight_kg }
  }

  return product
}

export async function fetchProducts(vehicleId?: string): Promise<Product[]> {
  try {
    let query = supabase.from('products').select('*').eq('is_active', true)
    
    if (vehicleId) {
      // Products specific to vehicle or universal (compatible_vehicle_id is null)
      query = query.or(`compatible_vehicle_id.eq.${vehicleId},compatible_vehicle_id.is.null`)
    }

    const { data, error } = await query.order('category')
    if (error || !data || data.length === 0) {
      if (!vehicleId) return initialProducts
      return initialProducts.filter(
        (p) => !p.compatible_vehicle_id || p.compatible_vehicle_id === vehicleId
      )
    }
    return (data as Product[]).map(enrichProductWithWeight)
  } catch {
    if (!vehicleId) return initialProducts
    return initialProducts.filter(
      (p) => !p.compatible_vehicle_id || p.compatible_vehicle_id === vehicleId
    )
  }
}

export interface BudgetCalculationResult {
  subtotal: number
  discountPercent: number
  discountValue: number
  freightValue: number
  installationValue: number
  finalTotal: number
  savingsVs10x: number
  totalWeightKg: number
}

export function getMaxDiscountForPaymentMethod(method?: string): number {
  if (method === 'pix') return 10
  if (method === 'boleto') return 5
  if (method?.includes('cartao')) return 10
  return 10
}

export function calculateTotalWeight(items: { product: Product; quantity: number }[]): number {
  return items.reduce((acc, i) => acc + (i.product.weight_kg || 0) * i.quantity, 0)
}

export function calculateBudget(
  items: { product: Product; quantity: number }[],
  paymentMethod: PaymentMethod,
  discountPercent: number = 0,
  freightValue: number = 0,
  installationValue: number = 0
): BudgetCalculationResult {
  // Base products subtotal using catalog base price
  const subtotal = items.reduce(
    (acc, { product, quantity }) => acc + (product.base_price_10x || 0) * quantity,
    0
  )

  const maxDiscount = getMaxDiscountForPaymentMethod(paymentMethod)
  const clampedDiscount = Math.min(Math.max(discountPercent, 0), maxDiscount)
  const discountValue = Math.round(((subtotal * clampedDiscount) / 100) * 100) / 100

  const finalTotal = Math.max(0, subtotal - discountValue + freightValue + installationValue)
  const savingsVs10x = discountValue
  const totalWeightKg = calculateTotalWeight(items)

  return {
    subtotal,
    discountPercent: clampedDiscount,
    discountValue,
    freightValue,
    installationValue,
    finalTotal,
    savingsVs10x,
    totalWeightKg,
  }
}
