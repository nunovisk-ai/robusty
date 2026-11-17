import React, { useState } from 'react'
import type { Opportunity, OpportunityStage, Order, OrderStatus } from '../types'
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  MessageSquare, 
  Camera, 
  Globe,
  Store, 
  Truck,
  Wrench,
  CheckCircle2, 
  ChevronRight, 
  Car,
  Filter,
  DollarSign,
  PackageCheck,
  TrendingUp,
  FileText
} from 'lucide-react'

interface KanbanViewProps {
  opportunities: Opportunity[]
  orders?: Order[]
  onMoveStage: (id: string, newStage: OpportunityStage) => void
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus) => void
  onConvertToOrder?: (opp: Opportunity) => void
  onOpenNewBudget?: () => void
}

type PipelineType = 'vendas' | 'pedidos'

interface SalesStageConfig {
  id: OpportunityStage
  title: string
  color: string
  stripeColor: string
}

interface OrderStageConfig {
  id: OrderStatus
  title: string
  color: string
  stripeColor: string
}

const SALES_STAGES: SalesStageConfig[] = [
  { 
    id: 'novo_lead', 
    title: 'Novo Lead', 
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
    stripeColor: '#6366F1' 
  },
  { 
    id: 'em_qualificacao', 
    title: 'Qualificação & Veículo', 
    color: 'bg-sky-50 text-sky-700 border-sky-200', 
    stripeColor: '#0EA5E9' 
  },
  { 
    id: 'orcamento_enviado', 
    title: 'Orçamento Enviado', 
    color: 'bg-orange-50 text-[#EA580C] border-orange-200', 
    stripeColor: '#EA580C' 
  },
  { 
    id: 'em_negociacao', 
    title: 'Negociação', 
    color: 'bg-amber-50 text-amber-800 border-amber-200', 
    stripeColor: '#F59E0B' 
  },
  { 
    id: 'venda_ganha', 
    title: 'Venda Ganha', 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    stripeColor: '#10B981' 
  },
  { 
    id: 'venda_perdida', 
    title: 'Perdido', 
    color: 'bg-rose-50 text-rose-700 border-rose-200', 
    stripeColor: '#EF4444' 
  },
]

const ORDER_STAGES: OrderStageConfig[] = [
  { 
    id: 'pedido_recebido', 
    title: 'Pedido Recebido', 
    color: 'bg-blue-50 text-blue-700 border-blue-200', 
    stripeColor: '#3B82F6' 
  },
  { 
    id: 'em_preparacao_loja', 
    title: 'Preparação / Oficina', 
    color: 'bg-amber-50 text-amber-800 border-amber-200', 
    stripeColor: '#F59E0B' 
  },
  { 
    id: 'aguardando_coleta_transportadora', 
    title: 'Pronto p/ Coleta / Baia', 
    color: 'bg-purple-50 text-purple-700 border-purple-200', 
    stripeColor: '#8B5CF6' 
  },
  { 
    id: 'aguardando_emissao_nf', 
    title: 'Faturamento & NF-e', 
    color: 'bg-cyan-50 text-cyan-800 border-cyan-200', 
    stripeColor: '#06B6D4' 
  },
  { 
    id: 'pedido_concluido', 
    title: 'Concluído / Entregue', 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    stripeColor: '#10B981' 
  },
]

export const KanbanView: React.FC<KanbanViewProps> = ({ 
  opportunities, 
  orders = [],
  onMoveStage,
  onUpdateOrderStatus,
  onConvertToOrder,
  onOpenNewBudget 
}) => {
  const [pipelineType, setPipelineType] = useState<PipelineType>('vendas')
  const [searchTerm, setSearchTerm] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('all')

  // Drag and Drop State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  // Automated Inbound Channel Badges
  const renderOriginBadge = (origin?: string) => {
    switch (origin) {
      case 'whatsapp_inbound':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <MessageSquare className="w-3 h-3 text-emerald-600" />
            <span>WhatsApp</span>
          </span>
        )
      case 'instagram_direct':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200/70">
            <Camera className="w-3 h-3 text-pink-600" />
            <span>Instagram</span>
          </span>
        )
      case 'meta_lead_ads':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70">
            <Globe className="w-3 h-3 text-blue-600" />
            <span>Facebook</span>
          </span>
        )
      case 'loja_presencial':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/70">
            <Store className="w-3 h-3 text-slate-600" />
            <span>Manual / Balcão</span>
          </span>
        )
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'L'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  // Filter Sales Opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch = 
      (opp.contact?.full_name || '').toLowerCase().includes(q) ||
      (opp.vehicle_model_year || '').toLowerCase().includes(q) ||
      (opp.vehicle?.model || '').toLowerCase().includes(q) ||
      (opp.contact?.phone_e164 || '').includes(q)

    const matchesChannel = 
      channelFilter === 'all' || 
      opp.contact?.origin === channelFilter

    return matchesSearch && matchesChannel
  })

  // Filter Operational Orders
  const filteredOrders = orders.filter((ord) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch = 
      (ord.contact?.full_name || '').toLowerCase().includes(q) ||
      (ord.order_number?.toString() || '').includes(q) ||
      (ord.shipping_carrier_name || '').toLowerCase().includes(q)

    return matchesSearch
  })

  // Totals for metrics bar (image_2.png style)
  const totalInPipeline = filteredOpportunities
    .filter((o) => o.stage !== 'venda_ganha' && o.stage !== 'venda_perdida')
    .reduce((sum, o) => sum + (o.final_total || 0), 0)

  const totalWon = filteredOpportunities
    .filter((o) => o.stage === 'venda_ganha')
    .reduce((sum, o) => sum + (o.final_total || 0), 0)

  // Drag and Drop Handlers (Forward and Backward across any stage)
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
    <div className="space-y-5">
      {/* Top Header & Pipeline Mode Switcher (from image_2.png) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-nexo space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Pipeline Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-full w-fit">
            <button
              onClick={() => setPipelineType('vendas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer outline-none focus:outline-none ${
                pipelineType === 'vendas'
                  ? 'bg-white text-[#EA580C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Funil de Vendas</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                pipelineType === 'vendas' ? 'bg-[#FFF3EA] text-[#EA580C]' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {opportunities.length}
              </span>
            </button>

            <button
              onClick={() => setPipelineType('pedidos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer outline-none focus:outline-none ${
                pipelineType === 'pedidos'
                  ? 'bg-white text-[#EA580C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Funil de Pedidos</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                pipelineType === 'pedidos' ? 'bg-[#FFF3EA] text-[#EA580C]' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {orders.length}
              </span>
            </button>
          </div>

          {/* Quick Metrics (image_2.png pattern: In Pipe / Closed) */}
          <div className="flex items-center gap-3 sm:gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
              <span className="text-slate-500 font-medium">Em Negociação:</span>
              <span className="font-bold text-[#121212] font-mono">{formatCurrency(totalInPipeline)}</span>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-500 font-medium">Vendas Ganhas:</span>
              <span className="font-bold text-emerald-700 font-mono">{formatCurrency(totalWon)}</span>
            </div>
          </div>
        </div>

        {/* Search, Filter Pills & Novo Orçamento Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-1 items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={pipelineType === 'vendas' ? 'Buscar cliente, veículo ou WhatsApp...' : 'Buscar pedido, cliente ou transportadora...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] transition-all font-medium"
              />
            </div>

            {/* Inbound Origin Channel Filter */}
            {pipelineType === 'vendas' && (
              <div className="hidden md:flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
                <button
                  onClick={() => setChannelFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer outline-none ${
                    channelFilter === 'all' ? 'bg-[#EA580C] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setChannelFilter('whatsapp_inbound')}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer outline-none ${
                    channelFilter === 'whatsapp_inbound' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setChannelFilter('instagram_direct')}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer outline-none ${
                    channelFilter === 'instagram_direct' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Instagram
                </button>
                <button
                  onClick={() => setChannelFilter('meta_lead_ads')}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer outline-none ${
                    channelFilter === 'meta_lead_ads' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Facebook
                </button>
              </div>
            )}
          </div>

          {/* Primary Action Button (Standardized to Novo Orçamento) */}
          {onOpenNewBudget && (
            <button
              onClick={onOpenNewBudget}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-full text-xs font-semibold transition-all shadow-md shadow-orange-500/20 active:scale-98 cursor-pointer shrink-0 outline-none focus:outline-none"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Orçamento</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. FUNIL DE VENDAS (Pipeline Comercial com Faixas de Cores & Drag-and-Drop) */}
      {pipelineType === 'vendas' && (
        <div className="flex gap-4 overflow-x-auto pb-4 kanban-scroll items-start min-h-[600px]">
          {SALES_STAGES.map((col) => {
            const colOpps = filteredOpportunities.filter((o) => o.stage === col.id)
            const colTotal = colOpps.reduce((sum, o) => sum + (o.final_total || 0), 0)
            const isDragTarget = dragOverStageId === col.id

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => handleDragLeave(col.id)}
                onDrop={(e) => handleDropOpportunity(e, col.id)}
                className={`w-80 shrink-0 bg-[#F5F6F8] rounded-2xl p-3 flex flex-col max-h-[820px] border transition-all duration-150 ${
                  isDragTarget 
                    ? 'border-2 border-dashed border-[#EA580C] bg-[#FFF8F3]/90 shadow-md scale-[1.01]' 
                    : 'border-slate-200/60 shadow-xs'
                }`}
              >
                {/* Stage Accent Color Stripe ("faixa com cores de etapas" from image_2.png) */}
                <div 
                  className="h-1.5 w-full rounded-full mb-2.5" 
                  style={{ backgroundColor: col.stripeColor }}
                />

                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: col.stripeColor }}
                    />
                    <h3 className="font-semibold text-sm text-[#121212] tracking-tight">
                      {col.title}
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200/80 shadow-2xs text-slate-700">
                      {colOpps.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={onOpenNewBudget}
                      title="Novo Orçamento"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer outline-none"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer outline-none">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtotal of Column */}
                <div className="px-1 pb-3 text-xs font-medium text-slate-500">
                  Total: <span className="text-slate-800 font-semibold font-mono">{formatCurrency(colTotal)}</span>
                </div>

                {/* Column Cards Container */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                  {colOpps.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 font-medium border-2 border-dashed border-slate-200/70 rounded-xl m-1">
                      Arraste um card aqui
                    </div>
                  ) : (
                    colOpps.map((opp) => (
                      <div
                        key={opp.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white p-4 rounded-2xl border border-slate-100/90 hover:border-orange-200 shadow-nexo hover:shadow-nexo-hover transition-all space-y-3 cursor-grab active:cursor-grabbing select-none group ${
                          draggedItemId === opp.id ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        {/* Row 1: Lead Name, Origin Channel Badge & Menu */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#FB923C] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {getInitials(opp.contact?.full_name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm text-[#121212] tracking-tight truncate group-hover:text-[#EA580C] transition-colors leading-tight">
                                {opp.contact?.full_name || 'Lead sem nome'}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate font-mono">
                                {opp.contact?.phone_e164}
                              </p>
                            </div>
                          </div>
                          {renderOriginBadge(opp.contact?.origin)}
                        </div>

                        {/* Row 2: Vehicle & Fulfillment Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF8F3] border border-[#FED7AA] text-[11px] font-semibold text-[#9A3412]">
                            <Car className="w-3 h-3 text-[#EA580C]" />
                            <span className="truncate max-w-[170px]">
                              {opp.vehicle?.model || opp.vehicle_model_year || 'Utilitário'}
                            </span>
                          </span>

                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-200/70 text-[10px] font-medium text-slate-600">
                            {opp.fulfillment_type === 'instalacao_loja' ? (
                              <>
                                <Wrench className="w-3 h-3 text-emerald-600" />
                                <span>Loja</span>
                              </>
                            ) : (
                              <>
                                <Truck className="w-3 h-3 text-blue-600" />
                                <span>Envio</span>
                              </>
                            )}
                          </span>
                        </div>

                        {/* Row 3: Deal Value & Payment Method */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              Orçamento
                            </div>
                            <div className="text-base font-bold text-[#121212] font-mono">
                              {formatCurrency(opp.final_total)}
                            </div>
                          </div>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-200">
                            {opp.payment_method === 'pix' ? 'PIX (10% MAX)' : opp.payment_method === 'boleto' ? 'Boleto (5%)' : '10x Cartão'}
                          </span>
                        </div>

                        {/* Row 4: Assigned Operator & Drag Instruction / Next Action */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[#EA580C]/10 text-[#EA580C] text-[10px] font-bold flex items-center justify-center">
                              N
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">Norlando</span>
                          </div>

                          {col.id === 'venda_ganha' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onConvertToOrder && onConvertToOrder(opp)
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-full transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer outline-none"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Gerar Pedido</span>
                            </button>
                          ) : col.id !== 'venda_perdida' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const stagesOrder: OpportunityStage[] = [
                                  'novo_lead', 'em_qualificacao', 'orcamento_enviado', 'em_negociacao', 'venda_ganha'
                                ]
                                const curIdx = stagesOrder.indexOf(col.id)
                                if (curIdx !== -1 && curIdx < stagesOrder.length - 1) {
                                  onMoveStage(opp.id, stagesOrder[curIdx + 1])
                                }
                              }}
                              className="px-2.5 py-1 bg-[#FFF3EA] hover:bg-[#EA580C] text-[#EA580C] hover:text-white text-[11px] font-semibold rounded-full transition-all flex items-center gap-1 cursor-pointer outline-none"
                            >
                              <span>Avançar</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 2. FUNIL DE PEDIDOS (Pipeline Operacional Igor & Loja com Drag-and-Drop) */}
      {pipelineType === 'pedidos' && (
        <div className="flex gap-4 overflow-x-auto pb-4 kanban-scroll items-start min-h-[600px]">
          {ORDER_STAGES.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.id)
            const isDragTarget = dragOverStageId === col.id

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => handleDragLeave(col.id)}
                onDrop={(e) => handleDropOrder(e, col.id)}
                className={`w-80 shrink-0 bg-[#F5F6F8] rounded-2xl p-3 flex flex-col max-h-[820px] border transition-all duration-150 ${
                  isDragTarget 
                    ? 'border-2 border-dashed border-[#EA580C] bg-[#FFF8F3]/90 shadow-md scale-[1.01]' 
                    : 'border-slate-200/60 shadow-xs'
                }`}
              >
                {/* Stage Accent Color Stripe ("faixa com cores de etapas") */}
                <div 
                  className="h-1.5 w-full rounded-full mb-2.5" 
                  style={{ backgroundColor: col.stripeColor }}
                />

                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: col.stripeColor }}
                    />
                    <h3 className="font-semibold text-sm text-[#121212] tracking-tight">
                      {col.title}
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200/80 shadow-2xs text-slate-700">
                      {colOrders.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer outline-none">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Column Cards Container */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                  {colOrders.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 font-medium border-2 border-dashed border-slate-200/70 rounded-xl m-1">
                      Nenhum pedido nesta etapa
                    </div>
                  ) : (
                    colOrders.map((ord) => (
                      <div
                        key={ord.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, ord.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white p-4 rounded-2xl border border-slate-100/90 hover:border-orange-200 shadow-nexo hover:shadow-nexo-hover transition-all space-y-3 cursor-grab active:cursor-grabbing select-none group ${
                          draggedItemId === ord.id ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        {/* Order Header: Number & Channel */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                            Pedido #{ord.order_number}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {ord.fulfillment_type === 'transportadora_envio' ? 'Transportadora' : 'Instalação Loja'}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div>
                          <h4 className="font-semibold text-sm text-[#121212] tracking-tight truncate leading-tight group-hover:text-[#EA580C] transition-colors">
                            {ord.contact?.full_name || 'Cliente'}
                          </h4>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {ord.contact?.phone_e164}
                          </p>
                        </div>

                        {/* Operational Details */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                          {ord.fulfillment_type === 'transportadora_envio' ? (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              <span className="truncate">{ord.shipping_carrier_name || 'Cotação Igor'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Baia Dedicada da Loja</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-slate-400">Nota Fiscal:</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              ord.invoice_status === 'emitida_disponivel'
                                ? 'bg-emerald-50 text-emerald-700'
                                : ord.invoice_status === 'solicitada_ao_igor'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {ord.invoice_status === 'emitida_disponivel' ? 'NF-e Emitida' : ord.invoice_status === 'solicitada_ao_igor' ? 'Solicitada ao Igor' : 'Não Solicitada'}
                            </span>
                          </div>
                        </div>

                        {/* Advance Action */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Igor & Loja</span>
                          </div>

                          {onUpdateOrderStatus && col.id !== 'pedido_concluido' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const orderStagesList: OrderStatus[] = [
                                  'pedido_recebido', 'em_preparacao_loja', 'aguardando_coleta_transportadora', 'aguardando_emissao_nf', 'pedido_concluido'
                                ]
                                const curIdx = orderStagesList.indexOf(col.id)
                                if (curIdx !== -1 && curIdx < orderStagesList.length - 1) {
                                  onUpdateOrderStatus(ord.id, orderStagesList[curIdx + 1])
                                }
                              }}
                              className="px-2.5 py-1 bg-[#FFF3EA] hover:bg-[#EA580C] text-[#EA580C] hover:text-white text-[11px] font-semibold rounded-full transition-all flex items-center gap-1 cursor-pointer outline-none"
                            >
                              <span>Avançar</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
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
