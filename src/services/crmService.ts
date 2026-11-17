import { supabase } from '../lib/supabase'
import type { Opportunity, OpportunityStage, Order, OrderStatus, Appointment } from '../types'

export async function fetchOpportunities(): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        contact:contacts(*),
        vehicle:vehicles(*)
      `)
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.warn('Erro ao buscar oportunidades no Supabase:', error)
      return []
    }

    return data as Opportunity[]
  } catch (err) {
    console.error('Falha de rede ao buscar oportunidades:', err)
    return []
  }
}

export async function saveOpportunityToSupabase(payload: {
  customerName: string
  customerPhone: string
  vehicleModel?: string
  vehicleId?: string
  fulfillmentType?: string
  subtotal: number
  freightValue: number
  installationValue: number
  discountValue: number
  discountPercent: number
  finalTotal: number
  paymentMethod?: string
  cep?: string
  street?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
}): Promise<Opportunity | null> {
  try {
    const cleanPhone = (payload.customerPhone || '').replace(/\D/g, '')
    const phoneE164 = cleanPhone ? (cleanPhone.startsWith('55') ? `+${cleanPhone}` : `+55${cleanPhone}`) : '+5511999999999'

    // 1. Upsert Contact
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .upsert(
        {
          full_name: payload.customerName || 'Cliente WhatsApp',
          phone_e164: phoneE164,
          origin: 'whatsapp_inbound',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone_e164' }
      )
      .select()
      .single()

    if (contactError || !contactData) {
      console.error('Erro ao salvar contato no Supabase:', contactError)
      return null
    }

    // 2. Save Address if provided
    if (payload.cep && payload.street) {
      await supabase.from('addresses').insert({
        contact_id: contactData.id,
        cep: payload.cep,
        street: payload.street,
        number: payload.number || 'S/N',
        neighborhood: payload.neighborhood || '',
        city: payload.city || '',
        state: payload.state || '',
        is_primary: true,
      })
    }

    // 3. Insert Opportunity
    const { data: oppData, error: oppError } = await supabase
      .from('opportunities')
      .insert({
        contact_id: contactData.id,
        vehicle_id: payload.vehicleId || null,
        vehicle_model_year: payload.vehicleModel || null,
        stage: 'orcamento_enviado',
        fulfillment_type: payload.fulfillmentType || 'transportadora_envio',
        subtotal_products: payload.subtotal,
        freight_value: payload.freightValue,
        installation_value: payload.installationValue,
        discount_value: payload.discountValue,
        discount_percent: payload.discountPercent,
        final_total: payload.finalTotal,
        payment_method: payload.paymentMethod || 'pix',
      })
      .select(`
        *,
        contact:contacts(*),
        vehicle:vehicles(*)
      `)
      .single()

    if (oppError || !oppData) {
      console.error('Erro ao salvar oportunidade no Supabase:', oppError)
      return null
    }

    return oppData as Opportunity
  } catch (err) {
    console.error('Falha de rede ao salvar oportunidade:', err)
    return null
  }
}

export async function updateOpportunityStage(
  oppId: string,
  newStage: OpportunityStage
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('opportunities')
      .update({
        stage: newStage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', oppId)

    if (error) {
      console.error('Erro ao atualizar estágio da oportunidade:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Falha de rede ao atualizar oportunidade:', err)
    return false
  }
}

export async function fetchOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        contact:contacts(*),
        opportunity:opportunities(*)
      `)
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.warn('Erro ao buscar pedidos no Supabase:', error)
      return []
    }

    return data as Order[]
  } catch (err) {
    console.error('Falha de rede ao buscar pedidos:', err)
    return []
  }
}

export async function createOrderInSupabase(opp: Opportunity): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        opportunity_id: opp.id,
        contact_id: opp.contact_id,
        fulfillment_type: opp.fulfillment_type || 'transportadora_envio',
        status: 'pedido_recebido',
        payment_status: 'aprovado_confirmado',
        invoice_required: opp.fulfillment_type === 'transportadora_envio',
        invoice_status: opp.fulfillment_type === 'transportadora_envio' ? 'solicitada_ao_igor' : 'nao_solicitada',
        shipping_carrier_name: opp.fulfillment_type === 'transportadora_envio' ? 'Aguardando Coleta Transportadora' : null,
      })
      .select(`
        *,
        contact:contacts(*),
        opportunity:opportunities(*)
      `)
      .single()

    if (error || !data) {
      console.error('Erro ao criar pedido no Supabase:', error)
      return null
    }

    return data as Order
  } catch (err) {
    console.error('Falha de rede ao criar pedido:', err)
    return null
  }
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  status: OrderStatus,
  invoiceStatus?: 'nao_solicitada' | 'solicitada_ao_igor' | 'emitida_disponivel'
): Promise<boolean> {
  try {
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (invoiceStatus) {
      updatePayload.invoice_status = invoiceStatus
    }

    const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId)
    if (error) {
      console.error('Erro ao atualizar pedido:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Falha de rede ao atualizar pedido:', err)
    return false
  }
}

export async function fetchAppointments(): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        contact:contacts(*)
      `)
      .order('scheduled_start', { ascending: true })

    if (error || !data) {
      console.warn('Erro ao buscar agendamentos no Supabase:', error)
      return []
    }

    return data as Appointment[]
  } catch (err) {
    console.error('Falha de rede ao buscar agendamentos:', err)
    return []
  }
}

export async function createAppointmentInSupabase(
  apt: Omit<Appointment, 'id'>
): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        order_id: apt.order_id || null,
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
      console.error('Erro ao criar agendamento no Supabase:', error)
      return null
    }

    return data as Appointment
  } catch (err) {
    console.error('Falha de rede ao criar agendamento:', err)
    return null
  }
}
