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
    return data as Product[]
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
