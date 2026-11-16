export type UserRole = 'admin' | 'comercial_norlando' | 'gestao_igor' | 'loja_instalacao'

export type ProductCategory = 
  | 'bagageiro' 
  | 'escada' 
  | 'deck' 
  | 'suporte' 
  | 'acessorio_fixacao' 
  | 'servico_instalacao' 
  | 'servico_especial'

export type LeadOrigin = 
  | 'whatsapp_inbound' 
  | 'instagram_direct' 
  | 'meta_lead_ads' 
  | 'loja_presencial' 
  | 'site_form' 
  | 'indicacao'

export type OpportunityStage = 
  | 'novo_lead'
  | 'em_qualificacao'
  | 'aguardando_atendimento'
  | 'aguardando_cotacao_frete'
  | 'preparacao_orcamento'
  | 'orcamento_enviado'
  | 'em_negociacao'
  | 'aguardando_pagamento'
  | 'venda_ganha'
  | 'venda_perdida'

export type FulfillmentType = 'transportadora_envio' | 'instalacao_loja'

export type PaymentMethod = 
  | 'pix' 
  | 'cartao_link_igor' 
  | 'cartao_presencial' 
  | 'boleto' 
  | 'pagamento_na_instalacao'

export type OrderStatus = 
  | 'pedido_recebido'
  | 'em_preparacao_loja'
  | 'aguardando_coleta_transportadora'
  | 'aguardando_instalacao_agendada'
  | 'em_transporte_ou_instalacao'
  | 'aguardando_emissao_nf'
  | 'pedido_concluido'
  | 'pedido_cancelado'

export interface Vehicle {
  id: string
  slug: string
  make: string
  model: string
  year_range?: string
  standard_installation_cost: number
  notes?: string
  is_active: boolean
}

export interface Product {
  id: string
  sku?: string
  name: string
  category: ProductCategory
  compatible_vehicle_id?: string
  model_version?: string
  dimensions?: string
  base_price_10x: number
  cash_price_5pct: number
  max_discount_price_10pct: number
  installation_cost: number
  description?: string
  image_urls?: string[]
  is_active: boolean
}

export interface Contact {
  id: string
  full_name: string
  phone_e164: string
  whatsapp_id?: string
  instagram_handle?: string
  email?: string
  document?: string
  origin: LeadOrigin
  notes?: string
  tags?: string[]
  created_at: string
}

export interface Address {
  id: string
  contact_id: string
  cep: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  is_primary: boolean
}

export interface OpportunityItem {
  id: string
  opportunity_id: string
  product_id: string
  product?: Product
  quantity: number
  unit_price: number
  discount_applied: number
  total_price: number
}

export interface Opportunity {
  id: string
  contact_id: string
  contact?: Contact
  assigned_user_id?: string
  vehicle_id?: string
  vehicle?: Vehicle
  vehicle_model_year?: string
  stage: OpportunityStage
  fulfillment_type?: FulfillmentType
  subtotal_products: number
  freight_value: number
  installation_value: number
  discount_value: number
  discount_percent: number
  final_total: number
  payment_method?: PaymentMethod
  payment_link_url?: string
  lost_reason?: string
  notes?: string
  items?: OpportunityItem[]
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: number
  opportunity_id: string
  opportunity?: Opportunity
  contact_id: string
  contact?: Contact
  fulfillment_type: FulfillmentType
  status: OrderStatus
  payment_status: string
  invoice_required: boolean
  invoice_status: 'nao_solicitada' | 'solicitada_ao_igor' | 'emitida_disponivel'
  invoice_key?: string
  shipping_carrier_name?: string
  shipping_tracking_code?: string
  internal_notes?: string
  created_at: string
}

export interface Appointment {
  id: string
  order_id?: string
  contact_id: string
  contact?: Contact
  installer_user_id?: string
  vehicle_description: string
  products_summary: string
  scheduled_start: string
  scheduled_end: string
  status: 'agendado' | 'veiculo_na_loja' | 'em_instalacao' | 'concluido' | 'reagendado' | 'cancelado'
  notes?: string
}
