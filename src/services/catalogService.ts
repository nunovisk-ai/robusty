import { supabase } from '../lib/supabase'
import type { Vehicle, Product, ProductCategory, PaymentMethod } from '../types'

export interface ProductCategoryOption {
  value: ProductCategory
  label: string
  pluralLabel: string
}

export const PRODUCT_CATEGORIES: ProductCategoryOption[] = [
  { value: 'bagageiro', label: 'Bagageiro', pluralLabel: 'Bagageiros' },
  { value: 'escada', label: 'Escada', pluralLabel: 'Escadas' },
  { value: 'deck', label: 'Deck de Madeira', pluralLabel: 'Decks' },
  { value: 'suporte', label: 'Suporte Especial', pluralLabel: 'Suportes' },
  { value: 'acessorio_fixacao', label: 'Fixação / Acessório', pluralLabel: 'Fixação & Acessórios' },
  { value: 'servico_instalacao', label: 'Serviço de Instalação', pluralLabel: 'Serviços de Instalação' },
  { value: 'servico_especial', label: 'Serviço Especial', pluralLabel: 'Serviços Especiais' },
]

export function getCategoryLabel(cat: string): string {
  const found = PRODUCT_CATEGORIES.find((c) => c.value === cat)
  return found ? found.label : cat
}

export function formatWeightKg(weightKg?: number | null): string | null {
  if (weightKg === undefined || weightKg === null || isNaN(weightKg) || weightKg <= 0) {
    return null
  }
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: Number.isInteger(weightKg) ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(weightKg)
  return `${formatted} kg`
}

export interface ProductInput {
  sku?: string
  name: string
  category: ProductCategory
  compatible_vehicle_id?: string
  model_version?: string
  dimensions?: string
  weight_kg?: number
  base_price_10x: number
  cash_price_5pct: number
  max_discount_price_10pct: number
  installation_cost: number
  description?: string
  is_active?: boolean
}

function normalizeProduct(
  raw: Partial<Product> & { id: string; name: string; category: ProductCategory }
): Product {
  const weightVal =
    raw.weight_kg !== undefined && raw.weight_kg !== null && Number(raw.weight_kg) > 0
      ? Number(raw.weight_kg)
      : undefined

  return {
    id: raw.id,
    sku: raw.sku?.trim() || undefined,
    name: raw.name.trim(),
    category: raw.category,
    compatible_vehicle_id: raw.compatible_vehicle_id?.trim() || undefined,
    model_version: raw.model_version?.trim() || undefined,
    dimensions: raw.dimensions?.trim() || undefined,
    weight_kg: weightVal,
    base_price_10x: Number(raw.base_price_10x) || 0,
    cash_price_5pct: Number(raw.cash_price_5pct) || 0,
    max_discount_price_10pct: Number(raw.max_discount_price_10pct) || 0,
    installation_cost: Number(raw.installation_cost) || 0,
    description: raw.description?.trim() || undefined,
    image_urls: raw.image_urls,
    is_active: raw.is_active !== false,
  }
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .order('model')

  if (error) {
    throw new Error(`Erro ao carregar veículos do banco de dados: ${error.message}`)
  }

  return (data || []) as Vehicle[]
}

export async function fetchProducts(vehicleId?: string): Promise<Product[]> {
  let query = supabase.from('products').select('*').eq('is_active', true)

  if (vehicleId) {
    // Products specific to vehicle or universal (compatible_vehicle_id is null)
    query = query.or(`compatible_vehicle_id.eq.${vehicleId},compatible_vehicle_id.is.null`)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao carregar produtos do banco de dados: ${error.message}`)
  }

  return ((data || []) as Product[]).map(normalizeProduct)
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const row = {
    sku: input.sku?.trim().toUpperCase() || null,
    name: input.name.trim(),
    category: input.category,
    compatible_vehicle_id: input.compatible_vehicle_id?.trim() || null,
    model_version: input.model_version?.trim() || null,
    dimensions: input.dimensions?.trim() || null,
    weight_kg: input.weight_kg !== undefined && input.weight_kg > 0 ? input.weight_kg : null,
    base_price_10x: Number(input.base_price_10x) || 0,
    cash_price_5pct: Number(input.cash_price_5pct) || 0,
    max_discount_price_10pct: Number(input.max_discount_price_10pct) || 0,
    installation_cost: Number(input.installation_cost) || 0,
    description: input.description?.trim() || null,
    is_active: true,
  }

  const { data, error } = await supabase
    .from('products')
    .insert(row)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe um produto cadastrado com este código SKU.')
    }
    throw new Error(`Erro ao cadastrar produto no banco de dados: ${error.message}`)
  }

  if (!data) {
    throw new Error('Não foi possível confirmar o cadastro do produto no banco de dados.')
  }

  return normalizeProduct(data as Product)
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const payload = {
    sku: input.sku?.trim().toUpperCase() || null,
    name: input.name.trim(),
    category: input.category,
    compatible_vehicle_id: input.compatible_vehicle_id?.trim() || null,
    model_version: input.model_version?.trim() || null,
    dimensions: input.dimensions?.trim() || null,
    weight_kg: input.weight_kg !== undefined && input.weight_kg > 0 ? input.weight_kg : null,
    base_price_10x: Number(input.base_price_10x) || 0,
    cash_price_5pct: Number(input.cash_price_5pct) || 0,
    max_discount_price_10pct: Number(input.max_discount_price_10pct) || 0,
    installation_cost: Number(input.installation_cost) || 0,
    description: input.description?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe outro produto cadastrado com este código SKU.')
    }
    throw new Error(`Erro ao atualizar produto no banco de dados: ${error.message}`)
  }

  if (!data) {
    throw new Error('Produto não encontrado no banco de dados para atualização.')
  }

  return normalizeProduct(data as Product)
}

export async function deleteProduct(id: string): Promise<void> {
  // Soft-delete preserves referential integrity with existing opportunity_items
  const { data, error } = await supabase
    .from('products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')

  if (error) {
    throw new Error(`Erro ao excluir produto no banco de dados: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error('Produto não encontrado no banco de dados para exclusão.')
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
