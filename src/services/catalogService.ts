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
}

export function calculateBudget(
  items: { product: Product; quantity: number }[],
  paymentMethod: PaymentMethod,
  manualDiscountPercent: number = 0,
  freightValue: number = 0,
  installationValue: number = 0
): BudgetCalculationResult {
  let subtotal = 0

  // Calculate base price for each product
  items.forEach(({ product, quantity }) => {
    let unitPrice = product.base_price_10x

    if (paymentMethod === 'pix') {
      unitPrice = product.max_discount_price_10pct
    } else if (paymentMethod === 'boleto') {
      unitPrice = product.cash_price_5pct
    }

    subtotal += unitPrice * quantity
  })

  // Apply manual discount (between 0% and 10%)
  const clampedDiscount = Math.min(Math.max(manualDiscountPercent, 0), 10)
  const discountValue = Math.round(((subtotal * clampedDiscount) / 100) * 100) / 100

  const finalTotal = Math.max(0, subtotal - discountValue + freightValue + installationValue)

  // Calculate reference 10x full price for showing savings
  const full10xTotal = items.reduce(
    (acc, { product, quantity }) => acc + product.base_price_10x * quantity,
    0
  ) + freightValue + installationValue

  const savingsVs10x = Math.max(0, full10xTotal - finalTotal)

  return {
    subtotal,
    discountPercent: clampedDiscount,
    discountValue,
    freightValue,
    installationValue,
    finalTotal,
    savingsVs10x,
  }
}
