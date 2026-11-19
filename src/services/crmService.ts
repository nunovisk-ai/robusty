import { supabase } from '../lib/supabase'
import { formatOrderCode } from '../utils/formatters'
import type {
  Address,
  Appointment,
  AttachedDocument,
  Contact,
  FulfillmentType,
  LeadOrigin,
  Opportunity,
  OpportunityComment,
  OpportunityHistoryEvent,
  OpportunityItem,
  OpportunityStage,
  OpportunityTask,
  Order,
  OrderStatus,
  PaymentMethod,
  PersonType,
  DocumentType,
  PaymentSplit,
  Product,
  Vehicle,
} from '../types'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(value?: string | null): value is string {
  return Boolean(value && UUID_REGEX.test(value))
}

function normalizePhoneE164(raw?: string | null): string | null {
  const digits = (raw || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('55') && digits.length >= 12) {
    return `+${digits}`
  }
  return `+55${digits}`
}

function sanitizeAttachments(attachments?: AttachedDocument[]): AttachedDocument[] {
  if (!Array.isArray(attachments)) return []
  return attachments.map((doc) => ({
    ...doc,
    file_url: doc.file_url?.startsWith('blob:') ? undefined : doc.file_url,
  }))
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return fallback
}

function mapContactRow(raw: any): Contact | undefined {
  if (!raw) return undefined
  return {
    id: raw.id,
    full_name: raw.full_name || '',
    phone_e164: raw.phone_e164 || '',
    whatsapp_id: raw.whatsapp_id || undefined,
    instagram_handle: raw.instagram_handle || undefined,
    instagram_url: raw.instagram_url || raw.instagram_handle || undefined,
    facebook_url: raw.facebook_url || undefined,
    website_url: raw.website_url || undefined,
    email: raw.email || undefined,
    person_type: (raw.person_type || 'fisica') as PersonType,
    document_type: (raw.document_type || 'cpf') as DocumentType,
    document: raw.document || undefined,
    state_registration: raw.state_registration || undefined,
    municipal_registration: raw.municipal_registration || undefined,
    commercial_phone: raw.commercial_phone || undefined,
    trade_name: raw.trade_name || undefined,
    origin: (raw.origin || 'whatsapp_inbound') as LeadOrigin,
    notes: raw.notes || undefined,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    created_at: raw.created_at,
  }
}

function extractPrimaryAddress(rawAddress: any, contactAddresses?: any[]): Partial<Address> | undefined {
  if (rawAddress && typeof rawAddress === 'object' && Object.values(rawAddress).some(Boolean)) {
    return rawAddress as Partial<Address>
  }
  if (Array.isArray(contactAddresses) && contactAddresses.length > 0) {
    const primary = contactAddresses.find((a) => a.is_primary) || contactAddresses[0]
    if (primary) {
      return {
        id: primary.id,
        contact_id: primary.contact_id,
        cep: primary.cep,
        street: primary.street,
        number: primary.number,
        complement: primary.complement || undefined,
        neighborhood: primary.neighborhood,
        city: primary.city,
        state: primary.state,
        is_primary: primary.is_primary,
      }
    }
  }
  return undefined
}

function mapItemsRows(rawItems: any): OpportunityItem[] {
  if (!Array.isArray(rawItems)) return []
  return rawItems.map((it) => ({
    id: it.id,
    opportunity_id: it.opportunity_id,
    product_id: it.product_id,
    product: it.product
      ? ({
          ...it.product,
          base_price_10x: toNumber(it.product.base_price_10x),
          cash_price_5pct: toNumber(it.product.cash_price_5pct),
          max_discount_price_10pct: toNumber(it.product.max_discount_price_10pct),
          installation_cost: toNumber(it.product.installation_cost),
          weight_kg:
            it.product.weight_kg !== null && it.product.weight_kg !== undefined
              ? toNumber(it.product.weight_kg)
              : undefined,
        } as Product)
      : undefined,
    quantity: toNumber(it.quantity, 1),
    unit_price: toNumber(it.unit_price),
    discount_applied: toNumber(it.discount_applied),
    total_price: toNumber(it.total_price),
  }))
}

function mapOpportunityRow(row: any): Opportunity {
  const contact = mapContactRow(row.contact)
  const orderNumber =
    row.order_number !== null && row.order_number !== undefined
      ? toNumber(row.order_number)
      : undefined

  return {
    id: row.id,
    order_number: orderNumber,
    order_code: orderNumber ? formatOrderCode(orderNumber) : undefined,
    assigned_to: row.assigned_to || undefined,
    contact_id: row.contact_id,
    contact,
    assigned_user_id: row.assigned_user_id || undefined,
    vehicle_id: row.vehicle_id || undefined,
    vehicle: row.vehicle
      ? ({
          ...row.vehicle,
          standard_installation_cost: toNumber(row.vehicle.standard_installation_cost),
        } as Vehicle)
      : undefined,
    vehicle_model_year: row.vehicle_model_year || undefined,
    stage: row.stage as OpportunityStage,
    fulfillment_type: (row.fulfillment_type || undefined) as FulfillmentType | undefined,
    subtotal_products: toNumber(row.subtotal_products),
    freight_value: toNumber(row.freight_value),
    installation_value: toNumber(row.installation_value),
    discount_value: toNumber(row.discount_value),
    discount_percent: toNumber(row.discount_percent),
    final_total: toNumber(row.final_total),
    payment_method: (row.payment_method || undefined) as PaymentMethod | undefined,
    payment_link_url: row.payment_link_url || undefined,
    card_installments:
      row.card_installments !== null && row.card_installments !== undefined
        ? toNumber(row.card_installments, 10)
        : 10,
    pickup_date: row.pickup_date || undefined,
    pickup_time: row.pickup_time || undefined,
    installation_date: row.installation_date || undefined,
    installation_time: row.installation_time || undefined,
    shipping_carrier_name: row.shipping_carrier_name || undefined,
    shipping_tracking_code: row.shipping_tracking_code || undefined,
    instagram_url: contact?.instagram_url || undefined,
    facebook_url: contact?.facebook_url || undefined,
    website_url: contact?.website_url || undefined,
    total_weight_kg:
      row.total_weight_kg !== null && row.total_weight_kg !== undefined
        ? toNumber(row.total_weight_kg)
        : undefined,
    customer_email: row.customer_email || contact?.email || undefined,
    person_type: (row.person_type || contact?.person_type || 'fisica') as PersonType,
    document_type: (row.document_type || contact?.document_type || 'cpf') as DocumentType,
    document: row.document || contact?.document || undefined,
    state_registration: row.state_registration || contact?.state_registration || undefined,
    municipal_registration: row.municipal_registration || contact?.municipal_registration || undefined,
    commercial_phone: row.commercial_phone || contact?.commercial_phone || undefined,
    trade_name: row.trade_name || contact?.trade_name || undefined,
    shipping_quote_number: row.shipping_quote_number || undefined,
    shipping_carrier_contact: row.shipping_carrier_contact || undefined,
    delivery_lead_time: row.delivery_lead_time || undefined,
    production_lead_time: row.production_lead_time || undefined,
    shipping_package_dimensions: row.shipping_package_dimensions || undefined,
    product_color: row.product_color || 'Preto Epóxi',
    payment_subtype: row.payment_subtype || undefined,
    payment_splits: Array.isArray(row.payment_splits) ? row.payment_splits : [],
    address: extractPrimaryAddress(row.address, row.contact?.addresses),
    lost_reason: row.lost_reason || undefined,
    notes: row.notes || undefined,
    items: mapItemsRows(row.items),
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    history: Array.isArray(row.history) ? row.history : [],
    tasks: Array.isArray(row.tasks) ? row.tasks : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapOrderRow(row: any): Order {
  const contact = mapContactRow(row.contact)
  const opportunity = row.opportunity ? mapOpportunityRow(row.opportunity) : undefined
  const orderNumber = toNumber(row.order_number)

  return {
    id: row.id,
    order_number: orderNumber,
    order_code: orderNumber ? formatOrderCode(orderNumber) : undefined,
    assigned_to: row.assigned_to || opportunity?.assigned_to || undefined,
    opportunity_id: row.opportunity_id,
    opportunity,
    contact_id: row.contact_id,
    contact: contact || opportunity?.contact,
    customer_email: row.customer_email || contact?.email || opportunity?.customer_email || undefined,
    person_type: (row.person_type || opportunity?.person_type || contact?.person_type || 'fisica') as PersonType,
    document_type: (row.document_type || opportunity?.document_type || contact?.document_type || 'cpf') as DocumentType,
    document: row.document || opportunity?.document || contact?.document || undefined,
    state_registration: row.state_registration || opportunity?.state_registration || contact?.state_registration || undefined,
    municipal_registration: row.municipal_registration || opportunity?.municipal_registration || contact?.municipal_registration || undefined,
    commercial_phone: row.commercial_phone || opportunity?.commercial_phone || contact?.commercial_phone || undefined,
    trade_name: row.trade_name || opportunity?.trade_name || contact?.trade_name || undefined,
    shipping_quote_number: row.shipping_quote_number || opportunity?.shipping_quote_number || undefined,
    shipping_carrier_contact: row.shipping_carrier_contact || opportunity?.shipping_carrier_contact || undefined,
    delivery_lead_time: row.delivery_lead_time || opportunity?.delivery_lead_time || undefined,
    production_lead_time: row.production_lead_time || opportunity?.production_lead_time || undefined,
    shipping_package_dimensions: row.shipping_package_dimensions || opportunity?.shipping_package_dimensions || undefined,
    product_color: row.product_color || opportunity?.product_color || 'Preto Epóxi',
    payment_subtype: row.payment_subtype || opportunity?.payment_subtype || undefined,
    payment_splits: Array.isArray(row.payment_splits)
      ? row.payment_splits
      : opportunity?.payment_splits || [],
    fulfillment_type: row.fulfillment_type as FulfillmentType,
    status: row.status as OrderStatus,
    payment_status: row.payment_status || 'pendente',
    invoice_required: Boolean(row.invoice_required),
    invoice_status: row.invoice_status || 'nao_solicitada',
    invoice_key: row.invoice_key || undefined,
    shipping_carrier_name: row.shipping_carrier_name || opportunity?.shipping_carrier_name || undefined,
    shipping_tracking_code: row.shipping_tracking_code || opportunity?.shipping_tracking_code || undefined,
    instagram_url: row.instagram_url || contact?.instagram_url || opportunity?.instagram_url || undefined,
    facebook_url: row.facebook_url || contact?.facebook_url || opportunity?.facebook_url || undefined,
    website_url: row.website_url || contact?.website_url || opportunity?.website_url || undefined,
    pickup_date: row.pickup_date || opportunity?.pickup_date || undefined,
    pickup_time: row.pickup_time || opportunity?.pickup_time || undefined,
    installation_date: row.installation_date || opportunity?.installation_date || undefined,
    installation_time: row.installation_time || opportunity?.installation_time || undefined,
    total_weight_kg:
      row.total_weight_kg !== null && row.total_weight_kg !== undefined
        ? toNumber(row.total_weight_kg)
        : opportunity?.total_weight_kg,
    internal_notes: row.internal_notes || undefined,
    attachments: Array.isArray(row.attachments) ? row.attachments : opportunity?.attachments || [],
    comments: Array.isArray(row.comments) ? row.comments : opportunity?.comments || [],
    history: Array.isArray(row.history) ? row.history : opportunity?.history || [],
    tasks: Array.isArray(row.tasks) ? row.tasks : opportunity?.tasks || [],
    created_at: row.created_at,
  }
}

function mapAppointmentRow(row: any): Appointment {
  return {
    id: row.id,
    order_id: row.order_id || undefined,
    opportunity_id: row.opportunity_id || undefined,
    event_type: (row.event_type || 'instalacao') as 'instalacao' | 'coleta',
    contact_id: row.contact_id,
    contact: mapContactRow(row.contact),
    installer_user_id: row.installer_user_id || undefined,
    vehicle_description: row.vehicle_description || '',
    products_summary: row.products_summary || '',
    scheduled_start: row.scheduled_start,
    scheduled_end: row.scheduled_end,
    status: row.status,
    notes: row.notes || undefined,
  }
}

const OPPORTUNITY_SELECT = `
  *,
  contact:contacts(*, addresses(*)),
  vehicle:vehicles(*),
  items:opportunity_items(*, product:products(*))
`

const ORDER_SELECT = `
  *,
  contact:contacts(*, addresses(*)),
  opportunity:opportunities(
    *,
    contact:contacts(*, addresses(*)),
    vehicle:vehicles(*),
    items:opportunity_items(*, product:products(*))
  )
`

export async function fetchOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select(OPPORTUNITY_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao carregar oportunidades do Supabase: ${error.message}`)
  }

  return (data || []).map(mapOpportunityRow)
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao carregar pedidos do Supabase: ${error.message}`)
  }

  return (data || []).map(mapOrderRow)
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      contact:contacts(*)
    `)
    .order('scheduled_start', { ascending: true })

  if (error) {
    throw new Error(`Erro ao carregar agendamentos do Supabase: ${error.message}`)
  }

  return (data || []).map(mapAppointmentRow)
}

export interface SaveOpportunityPayload {
  id?: string | null
  contactId?: string | null
  orderNumber?: number
  assignedTo?: 'Igor' | 'Norlando' | 'Loja' | ''
  customerName: string
  customerPhone?: string
  commercialPhone?: string
  customerEmail?: string
  personType?: PersonType
  documentType?: DocumentType
  document?: string
  stateRegistration?: string
  municipalRegistration?: string
  tradeName?: string
  instagramUrl?: string
  facebookUrl?: string
  websiteUrl?: string
  leadOrigin?: LeadOrigin
  vehicleId?: string
  vehicleModel?: string
  stage?: OpportunityStage
  fulfillmentType?: FulfillmentType
  subtotal: number
  freightValue: number
  installationValue: number
  discountValue: number
  discountPercent: number
  finalTotal: number
  paymentMethod?: PaymentMethod
  paymentSubtype?: string
  cardInstallments?: number
  paymentSplits?: PaymentSplit[]
  pickupDate?: string
  pickupTime?: string
  installationDate?: string
  installationTime?: string
  shippingCarrierName?: string
  shippingTrackingCode?: string
  shippingQuoteNumber?: string
  shippingCarrierContact?: string
  deliveryLeadTime?: string
  productionLeadTime?: string
  shippingPackageDimensions?: string
  productColor?: string
  totalWeightKg?: number
  address?: Partial<Address>
  items?: Array<{ product: Product; quantity: number }>
  attachments?: AttachedDocument[]
  comments?: OpportunityComment[]
  history?: OpportunityHistoryEvent[]
  tasks?: OpportunityTask[]
  notes?: string
}

async function executeWithSchemaFallback<T = any>(
  operation: (fields: Record<string, any>) => PromiseLike<{ data: T | null; error: any }>,
  initialFields: Record<string, any>
): Promise<{ data: T | null; error: any }> {
  let fields = { ...initialFields }
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await operation(fields)
    if (!res.error) return res as { data: T | null; error: any }

    const errorMsg = res.error?.message || ''
    const match = errorMsg.match(/Could not find the '([^']+)' column/)
    if (match && match[1] && match[1] in fields) {
      console.warn(`[Supabase Schema Fallback] Coluna '${match[1]}' ausente no schema cache, omitindo do payload.`)
      delete fields[match[1]]
      continue
    }
    return res as { data: T | null; error: any }
  }
  const finalRes = await operation(fields)
  return finalRes as { data: T | null; error: any }
}

async function upsertContact(payload: SaveOpportunityPayload): Promise<Contact> {
  const phoneE164 = normalizePhoneE164(payload.customerPhone)
  const now = new Date().toISOString()

  const contactFields = {
    full_name: payload.customerName?.trim() || 'Novo Cliente',
    email: payload.customerEmail?.trim() || null,
    person_type: payload.personType || 'fisica',
    document_type: payload.documentType || 'cpf',
    document: payload.document?.trim() || null,
    state_registration: payload.stateRegistration?.trim() || null,
    municipal_registration: payload.municipalRegistration?.trim() || null,
    commercial_phone: payload.commercialPhone?.trim() || null,
    trade_name: payload.tradeName?.trim() || null,
    instagram_handle: payload.instagramUrl?.trim() || null,
    instagram_url: payload.instagramUrl?.trim() || null,
    facebook_url: payload.facebookUrl?.trim() || null,
    website_url: payload.websiteUrl?.trim() || null,
    origin: payload.leadOrigin || 'whatsapp_inbound',
    updated_at: now,
  }

  // If editing an existing contact by UUID
  if (isValidUuid(payload.contactId)) {
    // Check if phoneE164 already belongs to a different contact
    let canUpdatePhone = true
    if (phoneE164) {
      const { data: conflict } = await supabase
        .from('contacts')
        .select('id')
        .eq('phone_e164', phoneE164)
        .neq('id', payload.contactId)
        .maybeSingle()

      if (conflict?.id) {
        // Re-link to existing contact with that phone and update its profile
        const { data: merged, error: mergeError } = await executeWithSchemaFallback(
          (fields) =>
            supabase
              .from('contacts')
              .update(fields)
              .eq('id', conflict.id)
              .select()
              .single(),
          contactFields
        )

        if (mergeError || !merged) {
          throw new Error(`Erro ao atualizar contato: ${mergeError?.message || 'falha desconhecida'}`)
        }
        return mapContactRow(merged)!
      }
    } else {
      canUpdatePhone = true
    }

    const { data: updated, error: updateError } = await executeWithSchemaFallback(
      (fields) =>
        supabase
          .from('contacts')
          .update(fields)
          .eq('id', payload.contactId)
          .select()
          .single(),
      {
        ...contactFields,
        ...(canUpdatePhone ? { phone_e164: phoneE164 } : {}),
      }
    )

    if (!updateError && updated) {
      return mapContactRow(updated)!
    }
  }

  // If phone is provided, upsert on phone_e164
  if (phoneE164) {
    const { data: upserted, error: upsertError } = await executeWithSchemaFallback(
      (fields) =>
        supabase
          .from('contacts')
          .upsert(fields, { onConflict: 'phone_e164' })
          .select()
          .single(),
      {
        ...contactFields,
        phone_e164: phoneE164,
      }
    )

    if (upsertError || !upserted) {
      throw new Error(`Erro ao salvar contato no Supabase: ${upsertError?.message || 'falha desconhecida'}`)
    }
    return mapContactRow(upserted)!
  }

  // No phone provided yet: insert new contact with phone_e164 = null
  const { data: inserted, error: insertError } = await executeWithSchemaFallback(
    (fields) =>
      supabase
        .from('contacts')
        .insert(fields)
        .select()
        .single(),
    {
      ...contactFields,
      phone_e164: null,
    }
  )

  if (insertError || !inserted) {
    throw new Error(`Erro ao criar contato no Supabase: ${insertError?.message || 'falha desconhecida'}`)
  }
  return mapContactRow(inserted)!
}

async function syncPrimaryAddress(contactId: string, address?: Partial<Address>): Promise<void> {
  if (!address?.cep?.trim() || !address?.street?.trim()) return

  const cleanCep = address.cep.trim().slice(0, 9)
  const addressRow = {
    contact_id: contactId,
    cep: cleanCep,
    street: address.street.trim(),
    number: address.number?.trim() || 'S/N',
    complement: address.complement?.trim() || null,
    neighborhood: address.neighborhood?.trim() || '',
    city: address.city?.trim() || '',
    state: (address.state || '').trim().slice(0, 2).toUpperCase(),
    is_primary: true,
  }

  const { data: existing } = await supabase
    .from('addresses')
    .select('id')
    .eq('contact_id', contactId)
    .eq('is_primary', true)
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    await supabase.from('addresses').update(addressRow).eq('id', existing.id)
  } else {
    await supabase.from('addresses').insert(addressRow)
  }
}

async function syncOpportunityItems(
  opportunityId: string,
  items?: Array<{ product: Product; quantity: number }>
): Promise<void> {
  if (items === undefined) return

  const { error: deleteError } = await supabase
    .from('opportunity_items')
    .delete()
    .eq('opportunity_id', opportunityId)

  if (deleteError) {
    throw new Error(`Erro ao atualizar itens do orçamento: ${deleteError.message}`)
  }

  const validRows = items
    .filter((it) => it && it.product && isValidUuid(it.product.id) && it.quantity > 0)
    .map((it) => ({
      opportunity_id: opportunityId,
      product_id: it.product.id,
      quantity: it.quantity,
      unit_price: toNumber(it.product.base_price_10x),
      discount_applied: 0,
      total_price: toNumber(it.product.base_price_10x) * it.quantity,
    }))

  if (validRows.length > 0) {
    const { error: insertError } = await supabase.from('opportunity_items').insert(validRows)
    if (insertError) {
      throw new Error(`Erro ao salvar itens do orçamento: ${insertError.message}`)
    }
  }
}

function buildEndIso(dateStr: string, timeStr: string, durationMinutes = 90): { start: string; end: string } {
  const [h, m] = (timeStr || '09:00').split(':').map((n) => parseInt(n, 10) || 0)
  const totalEndMin = h * 60 + m + durationMinutes
  const endH = Math.min(23, Math.floor(totalEndMin / 60))
  const endM = totalEndMin % 60
  const pad = (v: number) => String(v).padStart(2, '0')
  return {
    start: `${dateStr}T${pad(h)}:${pad(m)}:00`,
    end: `${dateStr}T${pad(endH)}:${pad(endM)}:00`,
  }
}

async function syncAppointmentForOpportunity(opp: Opportunity, orderId?: string | null): Promise<void> {
  const isInstalacao = opp.fulfillment_type === 'instalacao_loja' && Boolean(opp.installation_date)
  const isColeta = opp.fulfillment_type === 'transportadora_envio' && Boolean(opp.pickup_date)

  const { data: existing } = await supabase
    .from('appointments')
    .select('id')
    .eq('opportunity_id', opp.id)
    .maybeSingle()

  if (!isInstalacao && !isColeta) {
    if (existing?.id) {
      await supabase.from('appointments').delete().eq('id', existing.id)
    }
    return
  }

  const eventType: 'instalacao' | 'coleta' = isInstalacao ? 'instalacao' : 'coleta'
  const dateStr = (isInstalacao ? opp.installation_date : opp.pickup_date)!
  const timeStr = (isInstalacao ? opp.installation_time : opp.pickup_time) || (isInstalacao ? '14:00' : '10:00')
  const { start, end } = buildEndIso(dateStr, timeStr, isInstalacao ? 90 : 60)

  const vehicleDesc = opp.vehicle?.model || opp.vehicle_model_year || 'Veículo Utilitário'
  const productsSummary =
    opp.items && opp.items.length > 0
      ? opp.items.map((it) => `${it.quantity}x ${it.product?.name || 'Produto'}`).join(', ')
      : 'Itens conforme orçamento'

  const status = opp.stage === 'venda_perdida' ? 'cancelado' : 'agendado'

  const aptPayload = {
    opportunity_id: opp.id,
    order_id: orderId || null,
    contact_id: opp.contact_id,
    event_type: eventType,
    vehicle_description: vehicleDesc.slice(0, 150),
    products_summary: productsSummary,
    scheduled_start: start,
    scheduled_end: end,
    status,
    notes: opp.notes || null,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    await supabase.from('appointments').update(aptPayload).eq('id', existing.id)
  } else {
    await supabase.from('appointments').insert(aptPayload)
  }
}

export async function saveOpportunityToSupabase(
  payload: SaveOpportunityPayload
): Promise<Opportunity> {
  const contact = await upsertContact(payload)
  await syncPrimaryAddress(contact.id, payload.address)

  const now = new Date().toISOString()
  const cleanAttachments = sanitizeAttachments(payload.attachments)
  const hasAddress = Boolean(payload.address && Object.values(payload.address).some(Boolean))

  const oppDbRow: Record<string, any> = {
    contact_id: contact.id,
    order_number: payload.orderNumber ?? null,
    assigned_to: payload.assignedTo || null,
    vehicle_id: isValidUuid(payload.vehicleId) ? payload.vehicleId : null,
    vehicle_model_year: payload.vehicleModel || null,
    stage: payload.stage || 'orcamento_enviado',
    fulfillment_type: payload.fulfillmentType || 'transportadora_envio',
    subtotal_products: toNumber(payload.subtotal),
    freight_value: toNumber(payload.freightValue),
    installation_value: toNumber(payload.installationValue),
    discount_value: toNumber(payload.discountValue),
    discount_percent: toNumber(payload.discountPercent),
    final_total: toNumber(payload.finalTotal),
    payment_method: payload.paymentMethod || null,
    payment_subtype: payload.paymentSubtype || null,
    card_installments: payload.cardInstallments ?? 10,
    pickup_date: payload.pickupDate || null,
    pickup_time: payload.pickupTime || null,
    installation_date: payload.installationDate || null,
    installation_time: payload.installationTime || null,
    shipping_carrier_name: payload.shippingCarrierName || null,
    shipping_tracking_code: payload.shippingTrackingCode || null,
    total_weight_kg:
      payload.totalWeightKg !== undefined && payload.totalWeightKg !== null
        ? toNumber(payload.totalWeightKg)
        : null,
    customer_email: payload.customerEmail?.trim() || null,
    person_type: payload.personType || contact.person_type || 'fisica',
    document_type: payload.documentType || contact.document_type || 'cpf',
    document: payload.document?.trim() || contact.document || null,
    state_registration: payload.stateRegistration?.trim() || contact.state_registration || null,
    municipal_registration: payload.municipalRegistration?.trim() || contact.municipal_registration || null,
    commercial_phone: payload.commercialPhone?.trim() || contact.commercial_phone || null,
    trade_name: payload.tradeName?.trim() || contact.trade_name || null,
    shipping_quote_number: payload.shippingQuoteNumber?.trim() || null,
    shipping_carrier_contact: payload.shippingCarrierContact?.trim() || null,
    delivery_lead_time: payload.deliveryLeadTime?.trim() || null,
    production_lead_time: payload.productionLeadTime?.trim() || null,
    shipping_package_dimensions: payload.shippingPackageDimensions?.trim() || null,
    product_color: payload.productColor?.trim() || 'Preto Epóxi',
    payment_splits: payload.paymentSplits ?? [],
    address: hasAddress ? payload.address : null,
    attachments: cleanAttachments,
    comments: payload.comments ?? [],
    history: payload.history ?? [],
    tasks: payload.tasks ?? [],
    notes: payload.notes ?? null,
    updated_at: now,
  }

  let opportunityId: string

  if (isValidUuid(payload.id)) {
    const { data, error } = await executeWithSchemaFallback<{ id: string }>(
      (fields) =>
        supabase
          .from('opportunities')
          .update(fields)
          .eq('id', payload.id)
          .select('id')
          .single(),
      oppDbRow
    )

    if (error || !data) {
      throw new Error(`Erro ao atualizar oportunidade no Supabase: ${error?.message || 'falha desconhecida'}`)
    }
    opportunityId = data.id
  } else {
    const { data, error } = await executeWithSchemaFallback<{ id: string }>(
      (fields) =>
        supabase
          .from('opportunities')
          .insert(fields)
          .select('id')
          .single(),
      oppDbRow
    )

    if (error || !data) {
      throw new Error(`Erro ao criar oportunidade no Supabase: ${error?.message || 'falha desconhecida'}`)
    }
    opportunityId = data.id
  }

  // Save items in opportunity_items table
  await syncOpportunityItems(opportunityId, payload.items)

  // Mirror updates into linked order if one already exists
  const { data: linkedOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('opportunity_id', opportunityId)
    .maybeSingle()

  if (linkedOrder?.id) {
    await supabase
      .from('orders')
      .update({
        contact_id: contact.id,
        assigned_to: payload.assignedTo || null,
        customer_email: payload.customerEmail?.trim() || null,
        person_type: payload.personType || contact.person_type || 'fisica',
        document_type: payload.documentType || contact.document_type || 'cpf',
        document: payload.document?.trim() || contact.document || null,
        state_registration: payload.stateRegistration?.trim() || contact.state_registration || null,
        trade_name: payload.tradeName?.trim() || contact.trade_name || null,
        shipping_quote_number: payload.shippingQuoteNumber?.trim() || null,
        shipping_carrier_contact: payload.shippingCarrierContact?.trim() || null,
        delivery_lead_time: payload.deliveryLeadTime?.trim() || null,
        production_lead_time: payload.productionLeadTime?.trim() || null,
        shipping_package_dimensions: payload.shippingPackageDimensions?.trim() || null,
        product_color: payload.productColor?.trim() || 'Preto Epóxi',
        payment_splits: payload.paymentSplits ?? [],
        instagram_url: payload.instagramUrl?.trim() || null,
        facebook_url: payload.facebookUrl?.trim() || null,
        website_url: payload.websiteUrl?.trim() || null,
        fulfillment_type: payload.fulfillmentType || 'transportadora_envio',
        pickup_date: payload.pickupDate || null,
        pickup_time: payload.pickupTime || null,
        installation_date: payload.installationDate || null,
        installation_time: payload.installationTime || null,
        shipping_carrier_name: payload.shippingCarrierName || null,
        shipping_tracking_code: payload.shippingTrackingCode || null,
        total_weight_kg:
          payload.totalWeightKg !== undefined && payload.totalWeightKg !== null
            ? toNumber(payload.totalWeightKg)
            : null,
        attachments: cleanAttachments,
        comments: payload.comments ?? [],
        history: payload.history ?? [],
        tasks: payload.tasks ?? [],
        updated_at: now,
      })
      .eq('id', linkedOrder.id)
  }

  // Fetch hydrated opportunity back from Supabase
  const { data: hydrated, error: fetchError } = await supabase
    .from('opportunities')
    .select(OPPORTUNITY_SELECT)
    .eq('id', opportunityId)
    .single()

  if (fetchError || !hydrated) {
    throw new Error(`Erro ao recarregar oportunidade salva: ${fetchError?.message || 'falha desconhecida'}`)
  }

  const mappedOpp = mapOpportunityRow(hydrated)

  // Sync appointments table in Supabase
  await syncAppointmentForOpportunity(mappedOpp, linkedOrder?.id || null)

  return mappedOpp
}

export async function updateOpportunityStage(
  oppId: string,
  newStage: OpportunityStage,
  updatedHistory?: OpportunityHistoryEvent[]
): Promise<void> {
  if (!isValidUuid(oppId)) {
    throw new Error('ID de oportunidade inválido para atualização no Supabase.')
  }

  const now = new Date().toISOString()
  const updatePayload: Record<string, any> = {
    stage: newStage,
    updated_at: now,
  }
  if (updatedHistory) {
    updatePayload.history = updatedHistory
  }

  const { error } = await supabase
    .from('opportunities')
    .update(updatePayload)
    .eq('id', oppId)

  if (error) {
    throw new Error(`Erro ao atualizar etapa no Supabase: ${error.message}`)
  }

  if (newStage === 'venda_perdida') {
    await supabase
      .from('orders')
      .update({ status: 'pedido_cancelado', updated_at: now })
      .eq('opportunity_id', oppId)

    await supabase
      .from('appointments')
      .update({ status: 'cancelado', updated_at: now })
      .eq('opportunity_id', oppId)
  }
}

export async function updateOpportunityTasks(
  oppId: string,
  tasks: OpportunityTask[]
): Promise<void> {
  if (!isValidUuid(oppId)) return

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('opportunities')
    .update({ tasks, updated_at: now })
    .eq('id', oppId)

  if (error) {
    throw new Error(`Erro ao atualizar tarefas no Supabase: ${error.message}`)
  }

  await supabase
    .from('orders')
    .update({ tasks, updated_at: now })
    .eq('opportunity_id', oppId)
}

export async function deleteOpportunityFromSupabase(oppId: string): Promise<void> {
  if (!isValidUuid(oppId)) {
    throw new Error('ID de oportunidade inválido para exclusão no Supabase.')
  }

  await supabase.from('appointments').delete().eq('opportunity_id', oppId)
  await supabase.from('orders').delete().eq('opportunity_id', oppId)
  await supabase.from('opportunity_items').delete().eq('opportunity_id', oppId)

  const { error } = await supabase.from('opportunities').delete().eq('id', oppId)
  if (error) {
    throw new Error(`Erro ao excluir oportunidade no Supabase: ${error.message}`)
  }
}

export async function upsertOrderInSupabase(opp: Opportunity): Promise<Order> {
  if (!isValidUuid(opp.id) || !isValidUuid(opp.contact_id)) {
    throw new Error('Oportunidade precisa estar salva no Supabase antes de gerar pedido.')
  }

  const now = new Date().toISOString()
  const isTransport = (opp.fulfillment_type || 'transportadora_envio') === 'transportadora_envio'

  const baseOrderFields = {
    contact_id: opp.contact_id,
    assigned_to: opp.assigned_to || 'Igor',
    customer_email: opp.customer_email || opp.contact?.email || null,
    person_type: opp.person_type || opp.contact?.person_type || 'fisica',
    document_type: opp.document_type || opp.contact?.document_type || 'cpf',
    document: opp.document || opp.contact?.document || null,
    state_registration: opp.state_registration || opp.contact?.state_registration || null,
    municipal_registration: opp.municipal_registration || opp.contact?.municipal_registration || null,
    commercial_phone: opp.commercial_phone || opp.contact?.commercial_phone || null,
    trade_name: opp.trade_name || opp.contact?.trade_name || null,
    shipping_quote_number: opp.shipping_quote_number || null,
    shipping_carrier_contact: opp.shipping_carrier_contact || null,
    delivery_lead_time: opp.delivery_lead_time || null,
    production_lead_time: opp.production_lead_time || null,
    shipping_package_dimensions: opp.shipping_package_dimensions || null,
    product_color: opp.product_color || 'Preto Epóxi',
    payment_subtype: opp.payment_subtype || null,
    payment_splits: opp.payment_splits || [],
    instagram_url: opp.instagram_url || opp.contact?.instagram_url || null,
    facebook_url: opp.facebook_url || opp.contact?.facebook_url || null,
    website_url: opp.website_url || opp.contact?.website_url || null,
    fulfillment_type: opp.fulfillment_type || 'transportadora_envio',
    status: 'pedido_gerado' as OrderStatus,
    payment_status: 'aprovado_confirmado',
    invoice_required: isTransport,
    invoice_status: isTransport ? 'solicitada_ao_igor' : 'nao_solicitada',
    shipping_carrier_name:
      opp.shipping_carrier_name || (isTransport ? 'Transportadora Pendente' : null),
    shipping_tracking_code: opp.shipping_tracking_code || null,
    pickup_date: opp.pickup_date || null,
    pickup_time: opp.pickup_time || null,
    installation_date: opp.installation_date || null,
    installation_time: opp.installation_time || null,
    total_weight_kg: opp.total_weight_kg ?? null,
    attachments: sanitizeAttachments(opp.attachments),
    comments: opp.comments ?? [],
    history: opp.history ?? [],
    tasks: opp.tasks ?? [],
    updated_at: now,
  }

  const { data: existing } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('opportunity_id', opp.id)
    .maybeSingle()

  let orderId: string

  if (existing?.id) {
    const { data, error } = await executeWithSchemaFallback<{ id: string }>(
      (fields) =>
        supabase
          .from('orders')
          .update(fields)
          .eq('id', existing.id)
          .select('id')
          .single(),
      baseOrderFields
    )

    if (error || !data) {
      throw new Error(`Erro ao atualizar pedido no Supabase: ${error?.message || 'falha desconhecida'}`)
    }
    orderId = data.id
  } else {
    const insertPayload: Record<string, any> = {
      ...baseOrderFields,
      opportunity_id: opp.id,
    }
    if (opp.order_number) {
      insertPayload.order_number = opp.order_number
    }

    const { data, error } = await executeWithSchemaFallback<{ id: string; order_number?: number }>(
      (fields) =>
        supabase
          .from('orders')
          .insert(fields)
          .select('id, order_number')
          .single(),
      insertPayload
    )

    if (error || !data) {
      throw new Error(`Erro ao criar pedido no Supabase: ${error?.message || 'falha desconhecida'}`)
    }
    orderId = data.id

    // Keep opportunity order_number aligned with generated order_number if needed
    if (data.order_number && data.order_number !== opp.order_number) {
      await supabase
        .from('opportunities')
        .update({ order_number: data.order_number, updated_at: now })
        .eq('id', opp.id)
    }
  }

  // Link appointment to order_id if scheduled
  await syncAppointmentForOpportunity(opp, orderId)

  const { data: hydrated, error: fetchError } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .single()

  if (fetchError || !hydrated) {
    throw new Error(`Erro ao recarregar pedido salvo: ${fetchError?.message || 'falha desconhecida'}`)
  }

  return mapOrderRow(hydrated)
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  status: OrderStatus,
  invoiceStatus?: 'nao_solicitada' | 'solicitada_ao_igor' | 'emitida_disponivel',
  opportunityId?: string
): Promise<void> {
  if (!isValidUuid(orderId)) {
    throw new Error('ID de pedido inválido para atualização no Supabase.')
  }

  const now = new Date().toISOString()
  const updatePayload: Record<string, any> = {
    status,
    updated_at: now,
  }
  if (invoiceStatus) {
    updatePayload.invoice_status = invoiceStatus
  }

  const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId)
  if (error) {
    throw new Error(`Erro ao atualizar pedido no Supabase: ${error.message}`)
  }

  if (opportunityId && isValidUuid(opportunityId)) {
    if (status === 'pedido_cancelado') {
      await supabase
        .from('opportunities')
        .update({ stage: 'venda_perdida', updated_at: now })
        .eq('id', opportunityId)
      await supabase
        .from('appointments')
        .update({ status: 'cancelado', updated_at: now })
        .eq('opportunity_id', opportunityId)
    } else if (status === 'pedido_concluido') {
      await supabase
        .from('opportunities')
        .update({ stage: 'venda_ganha', updated_at: now })
        .eq('id', opportunityId)
      await supabase
        .from('appointments')
        .update({ status: 'concluido', updated_at: now })
        .eq('opportunity_id', opportunityId)
    }
  }
}

export async function createAppointmentInSupabase(
  apt: Omit<Appointment, 'id'>
): Promise<Appointment> {
  if (!isValidUuid(apt.contact_id)) {
    throw new Error('Contato inválido para criar agendamento no Supabase.')
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      order_id: isValidUuid(apt.order_id) ? apt.order_id : null,
      opportunity_id: isValidUuid(apt.opportunity_id) ? apt.opportunity_id : null,
      event_type: apt.event_type || 'instalacao',
      contact_id: apt.contact_id,
      vehicle_description: apt.vehicle_description,
      products_summary: apt.products_summary,
      scheduled_start: apt.scheduled_start,
      scheduled_end: apt.scheduled_end,
      status: apt.status || 'agendado',
      notes: apt.notes || null,
    })
    .select(`
      *,
      contact:contacts(*)
    `)
    .single()

  if (error || !data) {
    throw new Error(`Erro ao criar agendamento no Supabase: ${error?.message || 'falha desconhecida'}`)
  }

  return mapAppointmentRow(data)
}
