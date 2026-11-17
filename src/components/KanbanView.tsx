import React, { useState } from 'react'
import type { Opportunity, OpportunityStage, Order, OrderStatus } from '../types'
import { 
  Search, 
  Plus, 
  Store, 
  Truck, 
  Wrench, 
  CheckCircle2, 
  Car,
  Filter,
  Package,
  FileText,
  ArrowLeft,
  ArrowRight
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
    stripeColor: '#8B5CF6' 
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

  // Helper para destacar o modelo do carro (DUCATO, MASTER, FIORINO, etc.)
  const getVehicleBadgeText = (modelString?: string): string => {
    if (!modelString) return 'UTILITÁRIO'
    const upper = modelString.toUpperCase()
    if (upper.includes('DUCATO')) return 'DUCATO'
    if (upper.includes('MASTER')) return 'MASTER'
    if (upper.includes('FIORINO')) return 'FIORINO'
    if (upper.includes('EXPRESS')) return 'EXPRESS'
    if (upper.includes('DAILY')) return 'DAILY'
    if (upper.includes('HR')) return 'HYUNDAI HR'
    if (upper.includes('SPRINTER')) return 'SPRINTER'
    if (upper.includes('KANGOO')) return 'KANGOO'
    if (upper.includes('JUMPER')) return 'JUMPER'
    if (upper.includes('BOXER')) return 'BOXER'
    if (upper.includes('TRANSIT')) return 'TRANSIT'
    if (upper.includes('EXPERT')) return 'EXPERT'
    if (upper.includes('SCUDO')) return 'SCUDO'
    return upper.split(' ')[0]
  }

  // Ícones reais das plataformas (WhatsApp, Instagram, Facebook, Manual)
  const renderPlatformBadge = (origin?: string) => {
    switch (origin) {
      case 'whatsapp_inbound':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <svg className="w-4 h-4 text-[#25D366] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
            </svg>
            <span className="text-[11px] font-semibold text-slate-600">WhatsApp</span>
          </div>
        )
      case 'instagram_direct':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-700">
            <svg className="w-4 h-4 text-[#E1306C] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="text-[11px] font-semibold text-slate-600">Instagram</span>
          </div>
        )
      case 'meta_lead_ads':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
            <svg className="w-4 h-4 text-[#1877F2] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-[11px] font-semibold text-slate-600">Facebook</span>
          </div>
        )
      case 'loja_presencial':
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Store className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-600">Balcão / Manual</span>
          </div>
        )
    }
  }

  // Filtrar Oportunidades de Vendas
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

  // Filtrar Pedidos Operacionais
  const filteredOrders = orders.filter((ord) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch = 
      (ord.contact?.full_name || '').toLowerCase().includes(q) ||
      (ord.order_number?.toString() || '').includes(q) ||
      (ord.shipping_carrier_name || '').toLowerCase().includes(q)

    return matchesSearch
  })

  // Totais para a barra de métricas
  const totalInPipeline = filteredOpportunities
    .filter((o) => normalizeOppStage(o.stage) !== 'venda_ganha' && normalizeOppStage(o.stage) !== 'venda_perdida')
    .reduce((sum, o) => sum + (o.final_total || 0), 0)

  const totalWon = filteredOpportunities
    .filter((o) => normalizeOppStage(o.stage) === 'venda_ganha')
    .reduce((sum, o) => sum + (o.final_total || 0), 0)

  // Drag and Drop Handlers (Bidirecional para frente e para trás)
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
    <div className="space-y-6">
      {/* Top Header & Pipeline Mode Switcher (Referência Print 1) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Switcher entre os Funis (Print 1) */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setPipelineType('vendas')}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer outline-none ${
                pipelineType === 'vendas'
                  ? 'bg-[#EA580C] text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
              }`}
            >
              <Filter className={`w-4 h-4 ${pipelineType === 'vendas' ? 'text-white' : 'text-slate-500'}`} />
              <span>1. Funil de Leads (Comercial)</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                pipelineType === 'vendas' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}>
                {opportunities.length}
              </span>
            </button>

            <button
              onClick={() => setPipelineType('pedidos')}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer outline-none ${
                pipelineType === 'pedidos'
                  ? 'bg-[#EA580C] text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
              }`}
            >
              <Truck className={`w-4 h-4 ${pipelineType === 'pedidos' ? 'text-white' : 'text-slate-500'}`} />
              <span>2. Funil de Pedidos (Loja & Logística)</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                pipelineType === 'pedidos' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}>
                {orders.length}
              </span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-6 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50/80 border border-orange-100">
              <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
              <span className="text-slate-600 font-medium">Em Negociação:</span>
              <span className="font-bold text-[#EA580C] font-mono">{formatCurrency(totalInPipeline)}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">Vendas Ganhas:</span>
              <span className="font-bold text-emerald-700 font-mono">{formatCurrency(totalWon)}</span>
            </div>
          </div>
        </div>

        {/* Search, Filter Pills & Único Botão Novo Orçamento */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* Search Input (Print 1 style) */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={pipelineType === 'vendas' ? 'Buscar cliente, telefone, cidade...' : 'Buscar pedido, cliente ou transportadora...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] transition-all font-medium"
              />
            </div>

            {/* Filter Pills */}
            {pipelineType === 'vendas' && (
              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  onClick={() => setChannelFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer outline-none ${
                    channelFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setChannelFilter('whatsapp_inbound')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer outline-none flex items-center gap-1.5 ${
                    channelFilter === 'whatsapp_inbound' ? 'bg-[#25D366] text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  WhatsApp
                </button>
                <button
                  onClick={() => setChannelFilter('instagram_direct')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer outline-none flex items-center gap-1.5 ${
                    channelFilter === 'instagram_direct' ? 'bg-[#E1306C] text-white' : 'bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                  Instagram
                </button>
                <button
                  onClick={() => setChannelFilter('meta_lead_ads')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer outline-none flex items-center gap-1.5 ${
                    channelFilter === 'meta_lead_ads' ? 'bg-[#1877F2] text-white' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  Facebook
                </button>
                <button
                  onClick={() => setChannelFilter('loja_presencial')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer outline-none flex items-center gap-1.5 ${
                    channelFilter === 'loja_presencial' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  Balcão
                </button>
              </div>
            )}
          </div>

          {/* Botão Novo Orçamento (Único, não duplicado no topo) */}
          {onOpenNewBudget && (
            <button
              onClick={onOpenNewBudget}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 active:scale-98 cursor-pointer shrink-0 outline-none"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Orçamento</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. FUNIL DE VENDAS (8 Etapas com faixas internas arredondadas do Print 1 & Drag-and-Drop) */}
      {pipelineType === 'vendas' && (
        <div className="flex gap-4 overflow-x-auto pb-4 kanban-scroll items-start min-h-[640px]">
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
                className={`w-84 shrink-0 bg-white rounded-3xl p-4 flex flex-col max-h-[840px] border transition-all duration-150 ${
                  isDragTarget 
                    ? 'border-2 border-dashed border-[#EA580C] bg-[#FFF8F3]/90 shadow-md scale-[1.01]' 
                    : 'border-slate-200/80 shadow-xs'
                }`}
              >
                {/* Faixa mais dentro e arredondada (Referência Print 1) */}
                <div 
                  className="mx-1 h-1.5 rounded-full mb-3.5 shrink-0" 
                  style={{ backgroundColor: col.stripeColor }}
                />

                {/* Cabeçalho da Coluna (Print 1) */}
                <div className="flex items-center justify-between pb-1.5 px-1 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: col.stripeColor }}
                    />
                    <h3 className="font-bold text-xs text-[#121212] tracking-tight truncate">
                      {col.title}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 font-mono shrink-0">
                    {colOpps.length}
                  </span>
                </div>

                {/* Subtotal da Etapa */}
                <div className="flex items-center justify-between px-1 pb-3 text-xs shrink-0">
                  <span className="text-slate-400 font-medium">Total:</span>
                  <span className="text-slate-800 font-bold font-mono">{formatCurrency(colTotal)}</span>
                </div>

                {/* Container de Cards com Drag and Drop */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                  {colOpps.length === 0 ? (
                    <div className="py-14 text-center text-xs text-slate-400 font-medium border-2 border-dashed border-slate-200/70 rounded-2xl m-1 flex items-center justify-center">
                      Nenhum card nesta etapa
                    </div>
                  ) : (
                    colOpps.map((opp) => {
                      const vehicleShort = getVehicleBadgeText(opp.vehicle?.model || opp.vehicle_model_year)
                      const vehicleFull = opp.vehicle?.model || opp.vehicle_model_year || 'Utilitário'
                      const isWonStage = col.id === 'venda_ganha'
                      const canMovePrev = colIdx > 0
                      const canMoveNext = colIdx < SALES_STAGES.length - 1 && !isWonStage && col.id !== 'venda_perdida'

                      return (
                        <div
                          key={opp.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, opp.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-orange-300 shadow-xs hover:shadow-md transition-all space-y-3 cursor-grab active:cursor-grabbing select-none group ${
                            draggedItemId === opp.id ? 'opacity-40 scale-95' : ''
                          }`}
                        >
                          {/* Linha 1: Modelo do Carro em DESTAQUE (Pill Preto) + Responsável (Print 1) */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs tracking-wider uppercase shadow-2xs">
                              <Car className="w-3.5 h-3.5 text-white" />
                              <span>{vehicleShort}</span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-semibold">
                              <span className="w-2 h-2 rounded-full bg-blue-600" />
                              <span>Norlando</span>
                            </div>
                          </div>

                          {/* Linha 2: Cliente & Valor em Destaque Verde (Print 1) */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-sm text-[#121212] tracking-tight leading-snug group-hover:text-[#EA580C] transition-colors truncate">
                                {opp.contact?.full_name || 'Cliente'}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                                ({vehicleFull})
                              </p>
                            </div>

                            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-mono font-bold text-xs shrink-0 shadow-2xs">
                              {formatCurrency(opp.final_total)}
                            </div>
                          </div>

                          {/* Linha 3: Caixa de Descrição do Produto & Especificações (Print 1) */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                            <div className="font-semibold text-slate-800 line-clamp-1">
                              Bagageiro {vehicleFull} Cargo (Aba Alta)
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
                              <div>
                                <span className="text-slate-400">Modalidade: </span>
                                <span className="text-slate-700 font-semibold">
                                  {opp.fulfillment_type === 'instalacao_loja' ? 'Instalação Loja' : 'Transportadora'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">Acabamento: </span>
                                <span className="text-slate-700 font-semibold">Preto Epóxi</span>
                              </div>
                            </div>
                          </div>

                          {/* Linha 4: Badges Operacionais / Status (Print 1) */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/70 text-[11px] font-semibold">
                              <Package className="w-3 h-3 text-amber-700" />
                              <span>{opp.fulfillment_type === 'instalacao_loja' ? 'Baia da Loja' : 'Cotação Igor'}</span>
                            </span>

                            {opp.fulfillment_type === 'transportadora_envio' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200/70 text-[11px] font-semibold">
                                <FileText className="w-3 h-3 text-yellow-700" />
                                <span>Nota Fiscal</span>
                              </span>
                            )}
                          </div>

                          {/* Linha 5: Rodapé com Ícone Real da Plataforma + Navegação (Print 1) */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {renderPlatformBadge(opp.contact?.origin)}
                              <span className="text-slate-300">|</span>
                              <span className="text-[11px] text-slate-500 font-medium">Detalhes</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {canMovePrev && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onMoveStage(opp.id, SALES_STAGES[colIdx - 1].id)
                                  }}
                                  title="Voltar etapa"
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer outline-none"
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
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer outline-none"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Gerar Pedido</span>
                                </button>
                              ) : canMoveNext ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onMoveStage(opp.id, SALES_STAGES[colIdx + 1].id)
                                  }}
                                  title="Avançar etapa"
                                  className="p-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-xs transition-all cursor-pointer outline-none"
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

      {/* 2. FUNIL DE PEDIDOS (6 Etapas solicitadas pelo usuário com Drag-and-Drop) */}
      {pipelineType === 'pedidos' && (
        <div className="flex gap-4 overflow-x-auto pb-4 kanban-scroll items-start min-h-[640px]">
          {ORDER_STAGES.map((col, colIdx) => {
            const colOrders = filteredOrders.filter((o) => normalizeOrdStatus(o.status) === col.id)
            const isDragTarget = dragOverStageId === col.id

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => handleDragLeave(col.id)}
                onDrop={(e) => handleDropOrder(e, col.id)}
                className={`w-84 shrink-0 bg-white rounded-3xl p-4 flex flex-col max-h-[840px] border transition-all duration-150 ${
                  isDragTarget 
                    ? 'border-2 border-dashed border-[#EA580C] bg-[#FFF8F3]/90 shadow-md scale-[1.01]' 
                    : 'border-slate-200/80 shadow-xs'
                }`}
              >
                {/* Faixa mais dentro e arredondada (Referência Print 1) */}
                <div 
                  className="mx-1 h-1.5 rounded-full mb-3.5 shrink-0" 
                  style={{ backgroundColor: col.stripeColor }}
                />

                {/* Cabeçalho da Coluna */}
                <div className="flex items-center justify-between pb-3 px-1 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: col.stripeColor }}
                    />
                    <h3 className="font-bold text-xs text-[#121212] tracking-tight truncate">
                      {col.title}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 font-mono shrink-0">
                    {colOrders.length}
                  </span>
                </div>

                {/* Container de Cards de Pedidos */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                  {colOrders.length === 0 ? (
                    <div className="py-14 text-center text-xs text-slate-400 font-medium border-2 border-dashed border-slate-200/70 rounded-2xl m-1 flex items-center justify-center">
                      Nenhum card nesta etapa
                    </div>
                  ) : (
                    colOrders.map((ord) => {
                      const canMovePrev = colIdx > 0
                      const canMoveNext = colIdx < ORDER_STAGES.length - 1 && col.id !== 'pedido_concluido' && col.id !== 'pedido_cancelado'

                      return (
                        <div
                          key={ord.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, ord.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-orange-300 shadow-xs hover:shadow-md transition-all space-y-3 cursor-grab active:cursor-grabbing select-none group ${
                            draggedItemId === ord.id ? 'opacity-40 scale-95' : ''
                          }`}
                        >
                          {/* Linha 1: Pedido # em destaque (Pill Preto) + Operador (Print 1) */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-mono font-bold text-xs tracking-wider shadow-2xs">
                              PEDIDO #{ord.order_number}
                            </span>

                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-semibold">
                              <span className="w-2 h-2 rounded-full bg-blue-600" />
                              <span>Igor</span>
                            </div>
                          </div>

                          {/* Linha 2: Cliente & Modalidade */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-sm text-[#121212] tracking-tight leading-snug group-hover:text-[#EA580C] transition-colors truncate">
                                {ord.contact?.full_name || 'Cliente'}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                                ({ord.shipping_carrier_name || (ord.fulfillment_type === 'instalacao_loja' ? 'Baia de Instalação' : 'Transportadora Terceirizada')})
                              </p>
                            </div>

                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {ord.fulfillment_type === 'transportadora_envio' ? 'Envio' : 'Loja'}
                            </span>
                          </div>

                          {/* Linha 3: Caixa de Descrição Operacional */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                            <div className="font-semibold text-slate-800 line-clamp-1">
                              Bagageiro Linha Cargo Robusty
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
                              <div>
                                <span className="text-slate-400">Modalidade: </span>
                                <span className="text-slate-700 font-semibold">
                                  {ord.fulfillment_type === 'transportadora_envio' ? 'Transportadora' : 'Baia Loja'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">NF-e: </span>
                                <span className="text-slate-700 font-semibold">
                                  {ord.invoice_status === 'emitida_disponivel' ? 'Emitida' : 'Solicitada ao Igor'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Linha 4: Tags Operacionais */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {ord.fulfillment_type === 'transportadora_envio' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/70 text-[11px] font-semibold">
                                <Truck className="w-3 h-3 text-amber-700" />
                                <span>{ord.shipping_carrier_name || 'Cotação Igor'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[11px] font-semibold">
                                <Wrench className="w-3 h-3 text-emerald-700" />
                                <span>Baia Dedicada da Loja</span>
                              </span>
                            )}

                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                              ord.invoice_status === 'emitida_disponivel'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                                : 'bg-yellow-50 text-yellow-800 border-yellow-200/70'
                            }`}>
                              <FileText className="w-3 h-3 text-yellow-700" />
                              <span>{ord.invoice_status === 'emitida_disponivel' ? 'NF-e Emitida' : 'NF-e Pendente'}</span>
                            </span>
                          </div>

                          {/* Linha 5: Rodapé com Ícone Real da Plataforma + Navegação (Print 1) */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {renderPlatformBadge(ord.contact?.origin)}
                              <span className="text-slate-300">|</span>
                              <span className="text-[11px] text-slate-500 font-medium">Detalhes</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {canMovePrev && onUpdateOrderStatus && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onUpdateOrderStatus(ord.id, ORDER_STAGES[colIdx - 1].id)
                                  }}
                                  title="Voltar etapa"
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer outline-none"
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
                                  className="p-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-xs transition-all cursor-pointer outline-none"
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
