import React, { useState } from 'react'
import type { Opportunity, OpportunityStage, Order, OrderStatus } from '../types'
import { 
  Search, 
  Plus, 
  Filter,
  Truck, 
  ArrowLeft,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
import { 
  FaWhatsapp, 
  FaInstagram, 
  FaFacebook, 
  FaStore, 
  FaTruck, 
  FaVanShuttle, 
  FaCarSide, 
  FaTruckPickup 
} from 'react-icons/fa6'

interface KanbanViewProps {
  opportunities: Opportunity[]
  orders?: Order[]
  onMoveStage: (id: string, newStage: OpportunityStage) => void
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus) => void
  onConvertToOrder?: (opp: Opportunity) => void
  onOpenNewBudget?: () => void
  onSelectOpportunity?: (opp: Opportunity) => void
}

type PipelineType = 'vendas' | 'pedidos'

interface SalesStageConfig {
  id: OpportunityStage
  title: string
  stripeColor: string
}

interface OrderStageConfig {
  id: OrderStatus
  title: string
  stripeColor: string
}

// 8 Etapas solicitadas pelo usuário para o Funil de Vendas:
// Novo lead, Em qualificação, Aguardando Cotação, Orçamento enviado, Em negociação, Aguardando Pagamento, Venda Ganha, Venda Perdida
const SALES_STAGES: SalesStageConfig[] = [
  { 
    id: 'novo_lead', 
    title: 'Novo lead', 
    stripeColor: '#6366F1' 
  },
  { 
    id: 'em_qualificacao', 
    title: 'Em qualificação', 
    stripeColor: '#0EA5E9' 
  },
  { 
    id: 'aguardando_cotacao', 
    title: 'Aguardando Cotação', 
    stripeColor: '#2563EB' 
  },
  { 
    id: 'orcamento_enviado', 
    title: 'Orçamento enviado', 
    stripeColor: '#EA580C' 
  },
  { 
    id: 'em_negociacao', 
    title: 'Em negociação', 
    stripeColor: '#F59E0B' 
  },
  { 
    id: 'aguardando_pagamento', 
    title: 'Aguardando Pagamento', 
    stripeColor: '#EAB308' 
  },
  { 
    id: 'venda_ganha', 
    title: 'Venda Ganha', 
    stripeColor: '#10B981' 
  },
  { 
    id: 'venda_perdida', 
    title: 'Venda Perdida', 
    stripeColor: '#EF4444' 
  },
]

// 6 Etapas solicitadas pelo usuário para o Funil de Pedidos:
// Pedido Gerado, Em preparação, Aguardando Coleta/Instalação, Em entrega/Instalação, Pedido Concluído, Pedido Cancelado
const ORDER_STAGES: OrderStageConfig[] = [
  { 
    id: 'pedido_gerado', 
    title: 'Pedido Gerado', 
    stripeColor: '#3B82F6' 
  },
  { 
    id: 'em_preparacao', 
    title: 'Em preparação', 
    stripeColor: '#8B5CF6' 
  },
  { 
    id: 'aguardando_coleta_instalacao', 
    title: 'Aguardando Coleta/Instalação', 
    stripeColor: '#0284C7' 
  },
  { 
    id: 'em_entrega_instalacao', 
    title: 'Em entrega/Instalação', 
    stripeColor: '#06B6D4' 
  },
  { 
    id: 'pedido_concluido', 
    title: 'Pedido Concluído', 
    stripeColor: '#10B981' 
  },
  { 
    id: 'pedido_cancelado', 
    title: 'Pedido Cancelado', 
    stripeColor: '#EF4444' 
  },
]

interface VehicleInfo {
  modelName: string
  iconType: 'kombi' | 'large_van' | 'medium_van' | 'small_van' | 'truck' | 'default'
}

export const KanbanView: React.FC<KanbanViewProps> = ({ 
  opportunities, 
  orders = [],
  onMoveStage,
  onUpdateOrderStatus,
  onConvertToOrder,
  onOpenNewBudget,
  onSelectOpportunity
}) => {
  const [pipelineType, setPipelineType] = useState<PipelineType>('vendas')
  const [searchTerm, setSearchTerm] = useState('')

  // Drag and Drop State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  // Normalizador de estágios para compatibilidade reversa
  const normalizeOppStage = (stage?: string): OpportunityStage => {
    if (stage === 'aguardando_cotacao_frete' || stage === 'preparacao_orcamento') return 'aguardando_cotacao'
    if (stage === 'aguardando_atendimento') return 'em_qualificacao'
    return (stage as OpportunityStage) || 'novo_lead'
  }

  const normalizeOrdStatus = (status?: string): OrderStatus => {
    if (status === 'pedido_recebido') return 'pedido_gerado'
    if (status === 'em_preparacao_loja') return 'em_preparacao'
    if (status === 'aguardando_coleta_transportadora' || status === 'aguardando_instalacao_agendada') return 'aguardando_coleta_instalacao'
    if (status === 'em_transporte_ou_instalacao' || status === 'aguardando_emissao_nf') return 'em_entrega_instalacao'
    return (status as OrderStatus) || 'pedido_gerado'
  }

  // Obter valor monetário do pedido
  const getOrderTotal = (ord: Order): number => {
    if (ord.opportunity?.final_total) return ord.opportunity.final_total
    const matched = opportunities.find((o) => o.id === ord.opportunity_id)
    if (matched?.final_total) return matched.final_total
    if (ord.order_number === 1040) return 4579.0
    if (ord.order_number === 1041) return 2290.0
    if (ord.order_number === 1042) return 2090.0
    return 3296.50
  }

  // Obter modelo do veículo do pedido para o card espelho
  const getOrderVehicleModel = (ord: Order): string => {
    if (ord.opportunity?.vehicle?.model) return ord.opportunity.vehicle.model
    if (ord.opportunity?.vehicle_model_year) return ord.opportunity.vehicle_model_year
    const matched = opportunities.find((o) => o.id === ord.opportunity_id)
    if (matched?.vehicle?.model) return matched.vehicle.model
    if (matched?.vehicle_model_year) return matched.vehicle_model_year
    if (ord.contact?.full_name?.includes('(')) {
      const parts = ord.contact.full_name.split('(')
      if (parts[1]) return parts[1].replace(')', '').trim()
    }
    return 'Jumpy'
  }

  // Extrai o modelo do carro (ex.: Kombi, Jumpy, Ducato, Master, Fiorino) e NUNCA a marca (ex.: VW, Fiat)
  const getVehicleModelInfo = (modelStr?: string): VehicleInfo => {
    if (!modelStr) return { modelName: 'Utilitário', iconType: 'default' }
    const s = modelStr.toLowerCase()

    if (s.includes('kombi')) {
      return { modelName: 'Kombi', iconType: 'kombi' }
    }
    if (s.includes('jumpy') || s.includes('expert') || s.includes('scudo')) {
      return { modelName: 'Jumpy/Expert/Scudo', iconType: 'medium_van' }
    }
    if (s.includes('ducato') || s.includes('boxer') || s.includes('jumper')) {
      return { modelName: 'Ducato', iconType: 'large_van' }
    }
    if (s.includes('master')) {
      return { modelName: 'Master', iconType: 'large_van' }
    }
    if (s.includes('sprinter')) {
      return { modelName: 'Sprinter', iconType: 'large_van' }
    }
    if (s.includes('transit')) {
      return { modelName: 'Transit', iconType: 'large_van' }
    }
    if (s.includes('daily')) {
      return { modelName: 'Daily', iconType: 'large_van' }
    }
    if (s.includes('fiorino')) {
      return { modelName: 'Fiorino', iconType: 'small_van' }
    }
    if (s.includes('express')) {
      return { modelName: 'Express', iconType: 'small_van' }
    }
    if (s.includes('kangoo')) {
      return { modelName: 'Kangoo', iconType: 'small_van' }
    }
    if (s.includes('doblo')) {
      return { modelName: 'Doblo Cargo', iconType: 'small_van' }
    }
    if (s.includes('partner')) {
      return { modelName: 'Partner', iconType: 'small_van' }
    }
    if (s.includes('hr') || s.includes('bongo')) {
      return { modelName: s.includes('bongo') ? 'Bongo' : 'Hyundai HR', iconType: 'truck' }
    }

    // Limpeza de prefixos de montadoras (VW, Fiat, Renault, Peugeot, etc.)
    const clean = modelStr
      .replace(/^(vw|volkswagen|fiat|renault|peugeot|citroen|citroën|mercedes|mercedes-benz|ford|iveco|hyundai|kia)\s+/i, '')
      .trim()
    return { modelName: clean || 'Utilitário', iconType: 'default' }
  }

  // Ícones de veículos da biblioteca Font Awesome representando os modelos
  const renderVehicleIcon = (iconType: string) => {
    switch (iconType) {
      case 'kombi':
        return <FaVanShuttle className="w-3 h-3 text-white shrink-0" />
      case 'large_van':
        return <FaTruck className="w-3 h-3 text-white shrink-0" />
      case 'medium_van':
        return <FaVanShuttle className="w-3 h-3 text-white shrink-0" />
      case 'small_van':
        return <FaCarSide className="w-3 h-3 text-white shrink-0" />
      case 'truck':
        return <FaTruckPickup className="w-3 h-3 text-white shrink-0" />
      default:
        return <FaCarSide className="w-3 h-3 text-white shrink-0" />
    }
  }

  // Ícones das plataformas de leads usando biblioteca Font Awesome (react-icons/fa6)
  const renderPlatformIconFA = (origin?: string) => {
    switch (origin) {
      case 'whatsapp_inbound':
        return <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
      case 'instagram_direct':
        return <FaInstagram className="w-3.5 h-3.5 text-[#E1306C] shrink-0" />
      case 'meta_lead_ads':
        return <FaFacebook className="w-3.5 h-3.5 text-[#1877F2] shrink-0" />
      case 'loja_presencial':
      default:
        return <FaStore className="w-3.5 h-3.5 text-slate-600 shrink-0" />
    }
  }

  const getOriginTitle = (origin?: string) => {
    switch (origin) {
      case 'whatsapp_inbound': return 'Origem: WhatsApp'
      case 'instagram_direct': return 'Origem: Instagram Direct'
      case 'meta_lead_ads': return 'Origem: Facebook Leads'
      default: return 'Origem: Balcão / Loja Presencial'
    }
  }

  // Filtrar Oportunidades de Vendas
  const filteredOpportunities = opportunities.filter((opp) => {
    const q = searchTerm.toLowerCase()
    return (
      (opp.contact?.full_name || '').toLowerCase().includes(q) ||
      (opp.vehicle_model_year || '').toLowerCase().includes(q) ||
      (opp.vehicle?.model || '').toLowerCase().includes(q) ||
      (opp.contact?.phone_e164 || '').includes(q)
    )
  })

  // Filtrar Pedidos Operacionais
  const filteredOrders = orders.filter((ord) => {
    const q = searchTerm.toLowerCase()
    return (
      (ord.contact?.full_name || '').toLowerCase().includes(q) ||
      (ord.order_number?.toString() || '').includes(q) ||
      (ord.shipping_carrier_name || '').toLowerCase().includes(q)
    )
  })

  // Drag and Drop Handlers com transição suave
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedItemId(id)
  }

  const handleDragEnd = () => {
    setDraggedItemId(null)
    setDragOverStageId(null)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId)
    }
  }

  const handleDragLeave = (stageId: string) => {
    if (dragOverStageId === stageId) {
      setDragOverStageId(null)
    }
  }

  const handleDropOpportunity = (e: React.DragEvent, targetStage: OpportunityStage) => {
    e.preventDefault()
    const oppId = e.dataTransfer.getData('text/plain') || draggedItemId
    if (oppId) {
      onMoveStage(oppId, targetStage)
    }
    setDraggedItemId(null)
    setDragOverStageId(null)
  }

  const handleDropOrder = (e: React.DragEvent, targetStage: OrderStatus) => {
    e.preventDefault()
    const ordId = e.dataTransfer.getData('text/plain') || draggedItemId
    if (ordId && onUpdateOrderStatus) {
      onUpdateOrderStatus(ordId, targetStage)
    }
    setDraggedItemId(null)
    setDragOverStageId(null)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3">
      {/* Top Header & Pipeline Mode Switcher (Sem badges contadoras conforme solicitado) */}
      <div className="bg-white rounded-2xl p-2.5 sm:px-4 sm:py-2.5 border border-slate-200/90 shadow-2xs shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Switcher entre os Funis: Funil de Vendas e Funil de Pedidos (sem contadores) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPipelineType('vendas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none ${
              pipelineType === 'vendas'
                ? 'bg-[#EA580C] text-white shadow-sm ring-1 ring-orange-500/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
            }`}
          >
            <Filter className={`w-3.5 h-3.5 ${pipelineType === 'vendas' ? 'text-white' : 'text-slate-500'}`} />
            <span>Funil de Vendas</span>
          </button>

          <button
            onClick={() => setPipelineType('pedidos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none ${
              pipelineType === 'pedidos'
                ? 'bg-[#EA580C] text-white shadow-sm ring-1 ring-orange-500/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
            }`}
          >
            <Truck className={`w-3.5 h-3.5 ${pipelineType === 'pedidos' ? 'text-white' : 'text-slate-500'}`} />
            <span>Funil de Pedidos</span>
          </button>
        </div>

        {/* Busca e Botão Novo Orçamento */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={pipelineType === 'vendas' ? 'Buscar cliente ou veículo...' : 'Buscar pedido ou transportadora...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] transition-all font-medium"
            />
          </div>

          {onOpenNewBudget && (
            <button
              onClick={onOpenNewBudget}
              className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer shrink-0 outline-none"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nova Oportunidade</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. FUNIL DE VENDAS (8 Etapas com borda dinâmica na cor da etapa ao arrastar) */}
      {pipelineType === 'vendas' && (
        <div className="flex-1 flex gap-3 overflow-x-auto pb-1 kanban-scroll items-stretch min-h-0">
          {SALES_STAGES.map((col, colIdx) => {
            const colOpps = filteredOpportunities.filter((o) => normalizeOppStage(o.stage) === col.id)
            const colTotal = colOpps.reduce((sum, o) => sum + (o.final_total || 0), 0)
            const isDragTarget = dragOverStageId === col.id

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => handleDragLeave(col.id)}
                onDrop={(e) => handleDropOpportunity(e, col.id)}
                style={{ 
                  boxShadow: isDragTarget ? `0 0 0 2.5px ${col.stripeColor}` : undefined,
                }}
                className={`w-[290px] flex-shrink-0 bg-slate-100/90 rounded-2xl border border-slate-200/90 flex flex-col h-full max-h-full shadow-2xs transition-all duration-200 overflow-hidden ${
                  isDragTarget ? 'bg-slate-200/60' : ''
                }`}
              >
                {/* Faixa superior colorida da etapa (Elemento dedicado - NUNCA apaga) */}
                <div 
                  className="h-1.5 w-full shrink-0" 
                  style={{ backgroundColor: col.stripeColor }} 
                />

                {/* Header da Coluna (Print 2 / HTML fornecido) */}
                <div className="p-3 bg-white border-b border-slate-200/80 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: col.stripeColor }}
                      />
                      <h3 className="font-heading font-bold text-xs text-slate-800 tracking-tight truncate">
                        {col.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0 font-mono">
                      {colOpps.length}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Total:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(colTotal)}</span>
                  </div>
                </div>

                {/* Cards Container com Scroll Vertical Interno por Etapa */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1 kanban-scroll">
                  {colOpps.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl m-0.5 flex items-center justify-center">
                      Nenhum card nesta etapa
                    </div>
                  ) : (
                    colOpps.map((opp) => {
                      const vehicle = getVehicleModelInfo(opp.vehicle?.model || opp.vehicle_model_year)
                      const isWonStage = col.id === 'venda_ganha'
                      const canMovePrev = colIdx > 0
                      const canMoveNext = colIdx < SALES_STAGES.length - 1 && !isWonStage && col.id !== 'venda_perdida'

                      return (
                        <div
                          key={opp.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, opp.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white p-3.5 rounded-xl border border-slate-200/90 hover:border-[#EA580C] shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group space-y-2.5 select-none ${
                            draggedItemId === opp.id ? 'opacity-40 scale-95' : ''
                          }`}
                        >
                          {/* Linha 1: Modelo do Veículo em destaque (Pill Preto) + Número do Pedido + Responsável */}
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white flex items-center gap-1.5 shadow-2xs">
                              {renderVehicleIcon(vehicle.iconType)}
                              <span>{vehicle.modelName}</span>
                            </span>

                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                #ROB-{opp.order_number || 1040}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
                                🔵 {opp.assigned_to || 'Norlando'}
                              </span>
                            </div>
                          </div>

                          {/* Linha 2: Nome do Cliente & Valor */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 
                              onClick={() => onSelectOpportunity?.(opp)}
                              className="font-heading font-bold text-xs text-slate-900 hover:text-[#EA580C] transition-colors cursor-pointer leading-snug line-clamp-2"
                              title="Clique para abrir e editar orçamento"
                            >
                              {opp.contact?.full_name || 'Cliente'}
                            </h4>
                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                              {formatCurrency(opp.final_total)}
                            </span>
                          </div>

                          {/* Linha 3: Caixa de Descrição do Produto & Especificações */}
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] space-y-0.5">
                            <p className="font-medium text-slate-800 truncate">
                              Bagageiro {vehicle.modelName} Modelo EXTREME
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>
                                {opp.fulfillment_type === 'instalacao_loja' 
                                  ? 'Caminho B: Instalação na Loja' 
                                  : 'Caminho A: Entrega Transportadora'}
                              </span>
                              <span className="font-mono">Preto Epóxi</span>
                            </div>
                          </div>

                          {/* Linha 4: Badges Operacionais */}
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                              📦 {opp.fulfillment_type === 'instalacao_loja' ? 'Instalação Loja' : 'Cotação Igor'}
                            </span>
                            {opp.fulfillment_type === 'transportadora_envio' && (
                              <span className="text-[9px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                                🧾 Nota Fiscal
                              </span>
                            )}
                          </div>

                          {/* Linha 5: Rodapé com Ícone da Plataforma (FontAwesome) + Ações */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <button 
                                title={getOriginTitle(opp.contact?.origin)} 
                                className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              >
                                {renderPlatformIconFA(opp.contact?.origin)}
                              </button>
                              <button 
                                onClick={() => onSelectOpportunity?.(opp)}
                                className="text-[11px] text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
                              >
                                Detalhes
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              {canMovePrev && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onMoveStage(opp.id, SALES_STAGES[colIdx - 1].id)
                                  }}
                                  title="Voltar etapa" 
                                  className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {isWonStage ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onConvertToOrder && onConvertToOrder(opp)
                                  }}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Gerar Pedido</span>
                                </button>
                              ) : canMoveNext ? (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onMoveStage(opp.id, SALES_STAGES[colIdx + 1].id)
                                  }}
                                  title="Avançar etapa" 
                                  className="p-1 bg-orange-50 hover:bg-[#EA580C] text-[#EA580C] hover:text-white rounded transition-colors cursor-pointer"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 2. FUNIL DE PEDIDOS (Espelho fiel do Funil de Vendas com modelo, total da etapa e borda dinâmica) */}
      {pipelineType === 'pedidos' && (
        <div className="flex-1 flex gap-3 overflow-x-auto pb-1 kanban-scroll items-stretch min-h-0">
          {ORDER_STAGES.map((col, colIdx) => {
            const colOrders = filteredOrders.filter((o) => normalizeOrdStatus(o.status) === col.id)
            const colTotal = colOrders.reduce((sum, o) => sum + getOrderTotal(o), 0)
            const isDragTarget = dragOverStageId === col.id

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => handleDragLeave(col.id)}
                onDrop={(e) => handleDropOrder(e, col.id)}
                style={{ 
                  boxShadow: isDragTarget ? `0 0 0 2.5px ${col.stripeColor}` : undefined,
                }}
                className={`w-[290px] flex-shrink-0 bg-slate-100/90 rounded-2xl border border-slate-200/90 flex flex-col h-full max-h-full shadow-2xs transition-all duration-200 overflow-hidden ${
                  isDragTarget ? 'bg-slate-200/60' : ''
                }`}
              >
                {/* Faixa superior colorida da etapa (Elemento dedicado - NUNCA apaga) */}
                <div 
                  className="h-1.5 w-full shrink-0" 
                  style={{ backgroundColor: col.stripeColor }} 
                />

                {/* Header da Coluna com Total em R$ */}
                <div className="p-3 bg-white border-b border-slate-200/80 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: col.stripeColor }}
                      />
                      <h3 className="font-heading font-bold text-xs text-slate-800 tracking-tight truncate">
                        {col.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0 font-mono">
                      {colOrders.length}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Total:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(colTotal)}</span>
                  </div>
                </div>

                {/* Cards Container de Pedidos (Espelho fiel do Card de Vendas) */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1 kanban-scroll">
                  {colOrders.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl m-0.5 flex items-center justify-center">
                      Nenhum card nesta etapa
                    </div>
                  ) : (
                    colOrders.map((ord) => {
                      const linkedOpp = ord.opportunity || opportunities.find((o) => o.id === ord.opportunity_id || o.order_number === ord.order_number)
                      const vehicle = getVehicleModelInfo(getOrderVehicleModel(ord))
                      const ordTotal = getOrderTotal(ord)
                      const canMovePrev = colIdx > 0
                      const canMoveNext = colIdx < ORDER_STAGES.length - 1 && col.id !== 'pedido_concluido' && col.id !== 'pedido_cancelado'

                      const handleOpenOrderDetails = () => {
                        if (onSelectOpportunity) {
                          if (linkedOpp) {
                            onSelectOpportunity(linkedOpp)
                          } else {
                            onSelectOpportunity({
                              id: ord.opportunity_id || `opp-${ord.id}`,
                              order_number: ord.order_number,
                              assigned_to: ord.assigned_to || 'Igor',
                              contact_id: ord.contact_id,
                              contact: ord.contact,
                              vehicle_model_year: vehicle.modelName,
                              stage: 'venda_ganha',
                              fulfillment_type: ord.fulfillment_type,
                              subtotal_products: ordTotal,
                              freight_value: 0,
                              installation_value: 0,
                              discount_value: 0,
                              discount_percent: 0,
                              final_total: ordTotal,
                              payment_method: 'pix',
                              pickup_date: ord.pickup_date,
                              pickup_time: ord.pickup_time,
                              installation_date: ord.installation_date,
                              installation_time: ord.installation_time,
                              created_at: ord.created_at,
                              updated_at: ord.created_at,
                            })
                          }
                        }
                      }

                      return (
                        <div
                          key={ord.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, ord.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white p-3.5 rounded-xl border border-slate-200/90 hover:border-[#EA580C] shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group space-y-2.5 select-none ${
                            draggedItemId === ord.id ? 'opacity-40 scale-95' : ''
                          }`}
                        >
                          {/* Linha 1: Modelo do Veículo em destaque (Pill Preto) + Número do Pedido + Responsável */}
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white flex items-center gap-1.5 shadow-2xs">
                              {renderVehicleIcon(vehicle.iconType)}
                              <span>{vehicle.modelName}</span>
                            </span>

                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                #ROB-{ord.order_number}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
                                🔵 {ord.assigned_to || linkedOpp?.assigned_to || 'Igor'}
                              </span>
                            </div>
                          </div>

                          {/* Linha 2: Cliente & Valor em Destaque Verde */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 
                              onClick={handleOpenOrderDetails}
                              className="font-heading font-bold text-xs text-slate-900 hover:text-[#EA580C] transition-colors cursor-pointer leading-snug line-clamp-2"
                              title="Clique para abrir e editar pedido espelho"
                            >
                              {ord.contact?.full_name || 'Cliente'}
                            </h4>
                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                              {formatCurrency(ordTotal)}
                            </span>
                          </div>

                          {/* Linha 3: Caixa de Descrição do Produto & Especificações */}
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] space-y-0.5">
                            <p className="font-medium text-slate-800 truncate">
                              Bagageiro {vehicle.modelName} Modelo EXTREME
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>
                                {ord.fulfillment_type === 'instalacao_loja' 
                                  ? 'Caminho B: Instalação na Loja' 
                                  : 'Caminho A: Entrega Transportadora'}
                              </span>
                              <span className="font-mono">Preto Epóxi</span>
                            </div>
                          </div>

                          {/* Linha 4: Tags Operacionais */}
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                              📦 {ord.fulfillment_type === 'instalacao_loja' ? 'Instalação Loja' : 'Cotação Igor'}
                            </span>
                            <span className="text-[9px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                              🧾 Nota Fiscal
                            </span>
                          </div>

                          {/* Linha 5: Rodapé com Ícone da Plataforma (FontAwesome) + Ações */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <button 
                                title={getOriginTitle(ord.contact?.origin)} 
                                className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              >
                                {renderPlatformIconFA(ord.contact?.origin)}
                              </button>
                              <button 
                                onClick={handleOpenOrderDetails}
                                className="text-[11px] text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
                              >
                                Detalhes
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              {canMovePrev && onUpdateOrderStatus && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onUpdateOrderStatus(ord.id, ORDER_STAGES[colIdx - 1].id)
                                  }}
                                  title="Voltar etapa" 
                                  className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {canMoveNext && onUpdateOrderStatus && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onUpdateOrderStatus(ord.id, ORDER_STAGES[colIdx + 1].id)
                                  }}
                                  title="Avançar etapa" 
                                  className="p-1 bg-orange-50 hover:bg-[#EA580C] text-[#EA580C] hover:text-white rounded transition-colors cursor-pointer"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
