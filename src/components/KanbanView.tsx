import React, { useState } from 'react'
import type { Opportunity, OpportunityStage } from '../types'
import { 
  Search, 
  ChevronDown, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Plus, 
  MoreHorizontal,
  MessageSquare, 
  Camera, 
  Store, 
  Phone, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Star,
  Truck,
  Wrench
} from 'lucide-react'

interface KanbanViewProps {
  opportunities: Opportunity[]
  onMoveStage: (id: string, newStage: OpportunityStage) => void
  onConvertToOrder?: (opp: Opportunity) => void
  onOpenNewBudget?: () => void
}

const STAGES: { id: OpportunityStage; title: string; countColor: string }[] = [
  { id: 'novo_lead', title: 'Novo Lead', countColor: 'bg-slate-200 text-slate-700' },
  { id: 'em_qualificacao', title: 'Qualificação IA', countColor: 'bg-blue-100 text-blue-700' },
  { id: 'aguardando_cotacao_frete', title: 'Cotação Frete (Igor)', countColor: 'bg-amber-100 text-amber-800' },
  { id: 'orcamento_enviado', title: 'Orçamento Enviado', countColor: 'bg-purple-100 text-purple-700' },
  { id: 'em_negociacao', title: 'Em Negociação', countColor: 'bg-orange-100 text-orange-700' },
  { id: 'aguardando_pagamento', title: 'Aguardando Pagamento', countColor: 'bg-yellow-100 text-yellow-800' },
  { id: 'venda_ganha', title: 'Venda Ganha', countColor: 'bg-emerald-100 text-emerald-700' },
  { id: 'venda_perdida', title: 'Venda Perdida', countColor: 'bg-rose-100 text-rose-700' },
]

export const KanbanView: React.FC<KanbanViewProps> = ({ 
  opportunities, 
  onMoveStage,
  onConvertToOrder,
  onOpenNewBudget 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPipeline] = useState('Funil Oficial Robusty 2026')

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const getOriginBadge = (origin?: string) => {
    switch (origin) {
      case 'instagram_direct':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200/60">
            <Camera className="w-3 h-3 text-pink-600" />
            <span>Instagram</span>
          </span>
        )
      case 'loja_presencial':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
            <Store className="w-3 h-3 text-blue-600" />
            <span>Balcão</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <MessageSquare className="w-3 h-3 text-emerald-600" />
            <span>WhatsApp</span>
          </span>
        )
    }
  }

  const getStageNext = (current: OpportunityStage): OpportunityStage => {
    switch (current) {
      case 'novo_lead': return 'em_qualificacao'
      case 'em_qualificacao': return 'aguardando_cotacao_frete'
      case 'aguardando_cotacao_frete': return 'orcamento_enviado'
      case 'orcamento_enviado': return 'em_negociacao'
      case 'em_negociacao': return 'aguardando_pagamento'
      case 'aguardando_pagamento': return 'venda_ganha'
      default: return current
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'L'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    const q = searchTerm.toLowerCase()
    const nameMatch = opp.contact?.full_name.toLowerCase().includes(q)
    const vehicleMatch = (opp.vehicle_model_year || opp.vehicle?.model || '').toLowerCase().includes(q)
    const phoneMatch = (opp.contact?.phone_e164 || '').includes(q)
    return nameMatch || vehicleMatch || phoneMatch
  })

  return (
    <div className="space-y-6">
      {/* Nexo Top Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-nexo">
        {/* Left: Quick Search Pill Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, veículo, WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
          />
        </div>

        {/* Center / Right: Filter Pills & Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pipeline Selector Dropdown Pill */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 rounded-full text-xs font-bold text-slate-700 cursor-pointer transition-colors">
            <span>{selectedPipeline}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Sort Pill */}
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-600 transition-colors cursor-pointer">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Ordenar</span>
          </button>

          {/* Filters Pill */}
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-600 transition-colors cursor-pointer">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Filtros</span>
          </button>

          {/* Primary Action Button */}
          {onOpenNewBudget && (
            <button
              onClick={onOpenNewBudget}
              className="flex items-center gap-2 px-5 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-full text-xs font-bold transition-all shadow-md shadow-orange-500/25 active:scale-98 cursor-pointer ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Kanban Board (Exact Nexo Architecture) */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin items-start">
        {STAGES.map((col) => {
          const colOpps = filteredOpportunities.filter((o) => o.stage === col.id)
          const colTotal = colOpps.reduce((sum, o) => sum + (o.final_total || 0), 0)

          return (
            <div
              key={col.id}
              className="w-80 shrink-0 bg-[#F5F6F8] rounded-2xl p-3 flex flex-col max-h-[800px] border border-slate-200/50 shadow-xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 pt-1 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-[#121212] tracking-tight">
                    {col.title}
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.countColor}`}>
                    {colOpps.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={onOpenNewBudget}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subtotal of Column */}
              <div className="px-1 pb-3 text-xs font-bold text-slate-500">
                Total: <span className="text-slate-800 font-extrabold">{formatCurrency(colTotal)}</span>
              </div>

              {/* Column Cards Container */}
              <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                {colOpps.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium">
                    Nenhum lead nesta etapa
                  </div>
                ) : (
                  colOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white p-4 rounded-2xl border border-slate-100/90 hover:border-orange-200 shadow-nexo hover:shadow-nexo-hover transition-all space-y-3 cursor-pointer group"
                    >
                      {/* Row 1: Avatar, Name & Vehicle (Exact Nexo image_7.png layout) */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#EA580C] to-[#FB923C] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {getInitials(opp.contact?.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-[#121212] tracking-tight truncate leading-tight group-hover:text-[#EA580C] transition-colors">
                            {opp.contact?.full_name || 'Lead sem nome'}
                          </h4>
                          <p className="text-xs text-slate-500 truncate font-medium mt-0.5">
                            {opp.vehicle?.model || opp.vehicle_model_year || 'Utilitário sob consulta'}
                          </p>
                        </div>
                      </div>

                      {/* Row 2: Phone, Active Pill & Score */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{opp.contact?.phone_e164 || '(11) 90000-0000'}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/50">
                            Ativo
                          </span>
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-600 text-[10px] font-bold border border-slate-200/60">
                            <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            <span>9.8</span>
                          </span>
                        </div>
                      </div>

                      {/* Row 3: Channel Pill & Lead Type Pill */}
                      <div className="flex items-center gap-2">
                        {getOriginBadge(opp.contact?.origin)}

                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200/60">
                          <span>Lead</span>
                        </span>
                      </div>

                      {/* Row 4: Operational Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {opp.fulfillment_type === 'transportadora_envio' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            <Truck className="w-3 h-3 text-slate-500" />
                            <span>Transportadora</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            <Wrench className="w-3 h-3 text-slate-500" />
                            <span>Instalação Loja</span>
                          </span>
                        )}

                        {opp.discount_percent > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-200/60">
                            -{opp.discount_percent}% desc
                          </span>
                        )}
                      </div>

                      {/* Row 5: Schedule / Follow-up pill (Nexo image_7.png style) */}
                      <div className="p-2 rounded-xl bg-[#FFF5ED] border border-[#FED7AA]/60 flex items-center justify-between text-[11px] text-[#EA580C] font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                          <span>Follow-up WhatsApp</span>
                        </div>
                        <span className="font-bold text-[10px] bg-white px-2 py-0.5 rounded-full shadow-2xs">
                          Hoje 16:30
                        </span>
                      </div>

                      {/* Row 6: Total Value & Primary Step Action */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Orçamento
                          </div>
                          <div className="text-base font-extrabold text-[#121212]">
                            {formatCurrency(opp.final_total)}
                          </div>
                        </div>

                        {col.id === 'venda_ganha' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onConvertToOrder && onConvertToOrder(opp)
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Gerar Pedido</span>
                          </button>
                        ) : col.id !== 'venda_perdida' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onMoveStage(opp.id, getStageNext(col.id))
                            }}
                            className="px-3.5 py-1.5 bg-[#FFF3EA] hover:bg-[#EA580C] text-[#EA580C] hover:text-white text-xs font-bold rounded-full transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                          >
                            <span>Avançar</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>

                      {/* Footer: Date Added */}
                      <div className="text-right text-[10px] text-slate-400 font-medium">
                        Adicionado em — {new Date(opp.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
