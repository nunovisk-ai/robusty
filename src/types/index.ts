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
  | 'manual'
  | 'site'

export type OpportunityStage = 
  | 'novo_lead'
  | 'em_qualificacao'
  | 'aguardando_cotacao'
  | 'orcamento_enviado'
  | 'em_negociacao'
  | 'aguardando_pagamento'
  | 'venda_ganha'
  | 'venda_perdida'
  | 'aguardando_atendimento'
  | 'aguardando_cotacao_frete'
  | 'preparacao_orcamento'

export type FulfillmentType = 'transportadora_envio' | 'instalacao_loja'

export type PaymentMethod = 
  | 'pix' 
  | 'cartao_link_igor' 
  | 'cartao_presencial' 
  | 'boleto' 
  | 'pagamento_na_instalacao'

export type OrderStatus = 
  | 'pedido_gerado'
  | 'em_preparacao'
  | 'aguardando_coleta_instalacao'
  | 'em_entrega_instalacao'
  | 'pedido_concluido'
  | 'pedido_cancelado'
  | 'pedido_recebido'
  | 'em_preparacao_loja'
  | 'aguardando_coleta_transportadora'
  | 'aguardando_instalacao_agendada'
  | 'em_transporte_ou_instalacao'
  | 'aguardando_emissao_nf'

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
  weight_kg?: number
  base_price_10x: number
  cash_price_5pct: number
  max_discount_price_10pct: number
  installation_cost: number
  description?: string
  payment_conditions_notes?: string
  image_urls?: string[]
  is_active: boolean
}

export interface Contact {
  id: string
  full_name: string
  phone_e164: string
  whatsapp_id?: string
  instagram_handle?: string
  instagram_url?: string
  facebook_url?: string
  website_url?: string
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

export interface AttachedDocument {
  id: string
  name: string
  type: 'imagem' | 'documento' | 'orcamento_pdf' | 'nfe_pdf' | 'nfe_xml' | 'comprovante' | 'planilha' | 'outro'
  file_url?: string
  file_size?: string
  uploaded_at: string
  uploaded_by?: string
  nfe_access_key?: string
}

export interface OpportunityComment {
  id: string
  opportunity_id?: string
  author: 'Igor' | 'Norlando' | 'Loja' | string
  text: string
  created_at: string
}

export interface OpportunityHistoryEvent {
  id: string
  opportunity_id?: string
  type: 'stage_change' | 'created' | 'order_generated' | 'note' | 'status_change'
  description: string
  from_stage?: OpportunityStage | string
  to_stage?: OpportunityStage | string
  user?: 'Igor' | 'Norlando' | 'Loja' | string
  created_at: string
}

export interface OpportunityTask {
  id: string
  opportunity_id?: string
  order_number?: number
  client_name?: string
  title: string
  due_date?: string // YYYY-MM-DD
  due_time?: string // HH:mm
  assigned_to?: 'Igor' | 'Norlando' | 'Loja' | string
  completed: boolean
  completed_at?: string
  created_at: string
}

export interface Opportunity {
  id: string
  order_number?: number
  order_code?: string
  assigned_to?: 'Igor' | 'Norlando' | 'Loja'
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
  card_installments?: number
  pickup_date?: string
  pickup_time?: string
  installation_date?: string
  installation_time?: string
  shipping_carrier_name?: string
  shipping_tracking_code?: string
  instagram_url?: string
  facebook_url?: string
  website_url?: string
  total_weight_kg?: number
  customer_email?: string
  address?: Partial<Address>
  lost_reason?: string
  notes?: string
  items?: OpportunityItem[]
  attachments?: AttachedDocument[]
  comments?: OpportunityComment[]
  history?: OpportunityHistoryEvent[]
  tasks?: OpportunityTask[]
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: number
  order_code?: string
  assigned_to?: 'Igor' | 'Norlando' | 'Loja'
  opportunity_id: string
  opportunity?: Opportunity
  contact_id: string
  contact?: Contact
  customer_email?: string
  fulfillment_type: FulfillmentType
  status: OrderStatus
  payment_status: string
  invoice_required: boolean
  invoice_status: 'nao_solicitada' | 'solicitada_ao_igor' | 'emitida_disponivel'
  invoice_key?: string
  shipping_carrier_name?: string
  shipping_tracking_code?: string
  instagram_url?: string
  facebook_url?: string
  website_url?: string
  pickup_date?: string
  pickup_time?: string
  installation_date?: string
  installation_time?: string
  total_weight_kg?: number
  internal_notes?: string
  attachments?: AttachedDocument[]
  comments?: OpportunityComment[]
  history?: OpportunityHistoryEvent[]
  tasks?: OpportunityTask[]
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
