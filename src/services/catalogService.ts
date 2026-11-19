import { supabase } from '../lib/supabase'
import { Vehicle, Product, ProductCategory, PaymentMethod } from '../types'
import { initialVehicles, initialProducts } from '../data/initialCatalog'

const CATALOG_OVERRIDES_KEY = 'robusty_catalog_products_overrides_v1'

interface CatalogOverrides {
  created: Product[]
  updated: Record<string, Product>
  deletedIds: string[]
}

export interface ProductCategoryOption {
  value: ProductCategory
  label: string
  pluralLabel: string
  defaultHasWeight: boolean
}

export const PRODUCT_CATEGORIES: ProductCategoryOption[] = [
  { value: 'bagageiro', label: 'Bagageiro', pluralLabel: 'Bagageiros', defaultHasWeight: true },
  { value: 'escada', label: 'Escada', pluralLabel: 'Escadas', defaultHasWeight: true },
  { value: 'deck', label: 'Deck de Madeira', pluralLabel: 'Decks', defaultHasWeight: true },
  { value: 'suporte', label: 'Suporte Especial', pluralLabel: 'Suportes', defaultHasWeight: true },
  { value: 'acessorio_fixacao', label: 'Fixação / Acessório', pluralLabel: 'Fixação & Acessórios', defaultHasWeight: true },
  { value: 'servico_instalacao', label: 'Serviço de Instalação', pluralLabel: 'Serviços de Instalação', defaultHasWeight: false },
  { value: 'servico_especial', label: 'Serviço Especial', pluralLabel: 'Serviços Especiais', defaultHasWeight: false },
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
  payment_conditions_notes?: string
  is_active?: boolean
}

export interface ProductMutationResult {
  product: Product
  syncedToSupabase: boolean
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(id: string): boolean {
  return UUID_REGEX.test(id)
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function loadOverrides(): CatalogOverrides {
  try {
    const raw = localStorage.getItem(CATALOG_OVERRIDES_KEY)
    if (!raw) return { created: [], updated: {}, deletedIds: [] }
    const parsed = JSON.parse(raw) as Partial<CatalogOverrides>
    return {
      created: Array.isArray(parsed.created) ? parsed.created : [],
      updated: parsed.updated && typeof parsed.updated === 'object' ? parsed.updated : {},
      deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
    }
  } catch {
    return { created: [], updated: {}, deletedIds: [] }
  }
}

function saveOverrides(overrides: CatalogOverrides): void {
  try {
    localStorage.setItem(CATALOG_OVERRIDES_KEY, JSON.stringify(overrides))
  } catch (err) {
    console.warn('Não foi possível salvar cache local do catálogo:', err)
  }
}

function normalizeProduct(raw: Partial<Product> & { id: string; name: string; category: ProductCategory }): Product {
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
    payment_conditions_notes: raw.payment_conditions_notes?.trim() || undefined,
    image_urls: raw.image_urls,
    is_active: raw.is_active !== false,
  }
}

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const msg = (error.message || '').toLowerCase()
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    msg.includes('weight_kg') ||
    msg.includes('payment_conditions_notes') ||
    msg.includes('schema cache')
  )
}

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
  if (catalogMatch?.weight_kg !== undefined && catalogMatch.weight_kg > 0) {
    return { ...product, weight_kg: catalogMatch.weight_kg }
  }

  return product
}

function applyOverrides(baseProducts: Product[], overrides: CatalogOverrides, vehicleId?: string): Product[] {
  const deletedSet = new Set(overrides.deletedIds)
  const mergedMap = new Map<string, Product>()

  // Locally created products come first so new items are immediately visible
  for (const created of overrides.created) {
    if (!deletedSet.has(created.id)) {
      const overridden = overrides.updated[created.id]
      mergedMap.set(created.id, normalizeProduct(overridden || created))
    }
  }

  for (const base of baseProducts) {
    if (deletedSet.has(base.id)) continue
    if (overrides.updated[base.id]) {
      mergedMap.set(base.id, normalizeProduct(overrides.updated[base.id]))
    } else if (!mergedMap.has(base.id)) {
      mergedMap.set(base.id, normalizeProduct(enrichProductWithWeight(base)))
    }
  }

  const result = Array.from(mergedMap.values()).filter((p) => p.is_active !== false)

  if (!vehicleId) return result
  return result.filter((p) => !p.compatible_vehicle_id || p.compatible_vehicle_id === vehicleId)
}

export async function fetchProducts(vehicleId?: string): Promise<Product[]> {
  const overrides = loadOverrides()

  try {
    let query = supabase.from('products').select('*').eq('is_active', true)
    
    if (vehicleId) {
      // Products specific to vehicle or universal (compatible_vehicle_id is null)
      query = query.or(`compatible_vehicle_id.eq.${vehicleId},compatible_vehicle_id.is.null`)
    }

    const { data, error } = await query.order('category')
    if (error || !data || data.length === 0) {
      return applyOverrides(initialProducts, overrides, vehicleId)
    }
    return applyOverrides(data as Product[], overrides, vehicleId)
  } catch {
    return applyOverrides(initialProducts, overrides, vehicleId)
  }
}

export async function createProduct(input: ProductInput): Promise<ProductMutationResult> {
  const newId = generateUuid()
  const product = normalizeProduct({
    id: newId,
    ...input,
    is_active: true,
  })

  const baseDbRow = {
    id: product.id,
    sku: product.sku ?? null,
    name: product.name,
    category: product.category,
    compatible_vehicle_id: product.compatible_vehicle_id ?? null,
    model_version: product.model_version ?? null,
    dimensions: product.dimensions ?? null,
    base_price_10x: product.base_price_10x,
    cash_price_5pct: product.cash_price_5pct,
    max_discount_price_10pct: product.max_discount_price_10pct,
    installation_cost: product.installation_cost,
    description: product.description ?? null,
    is_active: true,
  }

  const fullDbRow = {
    ...baseDbRow,
    weight_kg: product.weight_kg ?? null,
    payment_conditions_notes: product.payment_conditions_notes ?? null,
  }

  try {
    let { data, error } = await supabase
      .from('products')
      .insert(fullDbRow)
      .select('*')
      .single()

    let usedFallbackColumns = false
    if (error && isMissingColumnError(error)) {
      usedFallbackColumns = true
      const retry = await supabase
        .from('products')
        .insert(baseDbRow)
        .select('*')
        .single()
      data = retry.data
      error = retry.error
    }

    if (error?.code === '23505') {
      throw new Error('Já existe um produto cadastrado com este código SKU.')
    }

    if (!error && data) {
      const savedProduct = normalizeProduct({
        ...(data as Product),
        weight_kg: usedFallbackColumns ? product.weight_kg : (data as Product).weight_kg,
        payment_conditions_notes: usedFallbackColumns
          ? product.payment_conditions_notes
          : (data as Product).payment_conditions_notes,
      })

      const overrides = loadOverrides()
      overrides.deletedIds = overrides.deletedIds.filter((id) => id !== savedProduct.id)
      overrides.created = overrides.created.filter((p) => p.id !== savedProduct.id)
      if (usedFallbackColumns && (savedProduct.weight_kg || savedProduct.payment_conditions_notes)) {
        overrides.updated[savedProduct.id] = savedProduct
      } else {
        delete overrides.updated[savedProduct.id]
      }
      saveOverrides(overrides)

      return { product: savedProduct, syncedToSupabase: true }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('SKU')) {
      throw err
    }
    console.warn('Supabase createProduct fallback para armazenamento local:', err)
  }

  const overrides = loadOverrides()
  overrides.deletedIds = overrides.deletedIds.filter((id) => id !== product.id)
  overrides.created = [product, ...overrides.created.filter((p) => p.id !== product.id)]
  saveOverrides(overrides)

  return { product, syncedToSupabase: false }
}

export async function updateProduct(id: string, input: ProductInput): Promise<ProductMutationResult> {
  const product = normalizeProduct({
    id,
    ...input,
    is_active: input.is_active !== false,
  })

  if (isUuid(id)) {
    const baseDbPayload = {
      sku: product.sku ?? null,
      name: product.name,
      category: product.category,
      compatible_vehicle_id: product.compatible_vehicle_id ?? null,
      model_version: product.model_version ?? null,
      dimensions: product.dimensions ?? null,
      base_price_10x: product.base_price_10x,
      cash_price_5pct: product.cash_price_5pct,
      max_discount_price_10pct: product.max_discount_price_10pct,
      installation_cost: product.installation_cost,
      description: product.description ?? null,
      updated_at: new Date().toISOString(),
    }

    const fullDbPayload = {
      ...baseDbPayload,
      weight_kg: product.weight_kg ?? null,
      payment_conditions_notes: product.payment_conditions_notes ?? null,
    }

    try {
      let { data, error } = await supabase
        .from('products')
        .update(fullDbPayload)
        .eq('id', id)
        .select('*')
        .maybeSingle()

      let usedFallbackColumns = false
      if (error && isMissingColumnError(error)) {
        usedFallbackColumns = true
        const retry = await supabase
          .from('products')
          .update(baseDbPayload)
          .eq('id', id)
          .select('*')
          .maybeSingle()
        data = retry.data
        error = retry.error
      }

      if (error?.code === '23505') {
        throw new Error('Já existe outro produto cadastrado com este código SKU.')
      }

      if (!error && data) {
        const updatedProduct = normalizeProduct({
          ...(data as Product),
          weight_kg: usedFallbackColumns ? product.weight_kg : (data as Product).weight_kg,
          payment_conditions_notes: usedFallbackColumns
            ? product.payment_conditions_notes
            : (data as Product).payment_conditions_notes,
        })

        const overrides = loadOverrides()
        overrides.created = overrides.created.filter((p) => p.id !== id)
        if (usedFallbackColumns) {
          overrides.updated[id] = updatedProduct
        } else {
          delete overrides.updated[id]
        }
        saveOverrides(overrides)

        return { product: updatedProduct, syncedToSupabase: true }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('SKU')) {
        throw err
      }
      console.warn('Supabase updateProduct fallback para armazenamento local:', err)
    }
  }

  const overrides = loadOverrides()
  const createdIdx = overrides.created.findIndex((p) => p.id === id)
  if (createdIdx >= 0) {
    overrides.created[createdIdx] = product
    delete overrides.updated[id]
  } else {
    overrides.updated[id] = product
  }
  saveOverrides(overrides)

  return { product, syncedToSupabase: false }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; syncedToSupabase: boolean }> {
  let syncedToSupabase = false

  if (isUuid(id)) {
    try {
      // Soft-delete preserves referential integrity with existing opportunity_items
      const { data, error } = await supabase
        .from('products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id')

      if (!error && data && data.length > 0) {
        syncedToSupabase = true
      }
    } catch (err) {
      console.warn('Supabase deleteProduct fallback para armazenamento local:', err)
    }
  }

  const overrides = loadOverrides()
  const wasLocalOnly = overrides.created.some((p) => p.id === id)
  overrides.created = overrides.created.filter((p) => p.id !== id)
  delete overrides.updated[id]

  if (syncedToSupabase) {
    overrides.deletedIds = overrides.deletedIds.filter((delId) => delId !== id)
  } else if (!wasLocalOnly && !overrides.deletedIds.includes(id)) {
    overrides.deletedIds.push(id)
  }

  saveOverrides(overrides)
  return { success: true, syncedToSupabase }
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
