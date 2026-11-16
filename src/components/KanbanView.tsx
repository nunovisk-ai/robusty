import React, { useState } from 'react'
import type { Opportunity, OpportunityStage } from '../types'
import { 
  Kanban as KanbanIcon, 
  MessageSquare, 
  Camera, 
  Store, 
  ChevronRight, 
  Truck, 
  Wrench, 
  CheckCircle2,
  Phone,
  Plus
} from 'lucide-react'

interface KanbanViewProps {
  opportunities: Opportunity[]
  onMoveStage: (id: string, newStage: OpportunityStage) => void
  onConvertToOrder?: (opp: Opportunity) => void
  onOpenNewBudget?: () => void
}

const STAGES: { id: OpportunityStage; title: string; color: string; badgeColor: string }[] = [
  { id: 'novo_lead', title: 'Novo Lead', color: 'border-t-blue-500', badgeColor: 'bg-blue-50 text-blue-700' },
  { id: 'em_qualificacao', title: 'Qualificação IA', color: 'border-t-cyan-500', badgeColor: 'bg-cyan-50 text-cyan-700' },
  { id: 'aguardando_cotacao_frete', title: 'Cotação com Igor', color: 'border-t-amber-500', badgeColor: 'bg-amber-50 text-amber-700' },
  { id: 'orcamento_enviado', title: 'Orçamento Enviado', color: 'border-t-purple-500', badgeColor: 'bg-purple-50 text-purple-700' },
  { id: 'em_negociacao', title: 'Em Negociação', color: 'border-t-orange-500', badgeColor: 'bg-orange-50 text-orange-700' },
  { id: 'aguardando_pagamento', title: 'Aguardando Pagamento', color: 'border-t-yellow-500', badgeColor: 'bg-yellow-50 text-yellow-800' },
  { id: 'venda_ganha', title: 'Venda Ganha', color: 'border-t-emerald-500', badgeColor: 'bg-emerald-50 text-emerald-700' },
  { id: 'venda_perdida', title: 'Venda Perdida', color: 'border-t-slate-400', badgeColor: 'bg-slate-100 text-slate-600' },
]

export const KanbanView: React.FC<KanbanViewProps> = ({ 
  opportunities, 
  onMoveStage,
  onConvertToOrder,
  onOpenNewBudget 
}) => {
  const [, setSelectedOpp] = useState<Opportunity | null>(null)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const getOriginBadge = (origin?: string) => {
    switch (origin) {
      case 'instagram_direct':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
            <Camera className="w-2.5 h-2.5 text-pink-600" />
            <span>Instagram</span>
          </span>
        )
      case 'loja_presencial':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Store className="w-2.5 h-2.5 text-blue-600" />
            <span>Balcão Loja</span>
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
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

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Funil de Vendas Comercial (Norlando)
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              100% Inbound
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Acompanhamento contínuo dos leads do WhatsApp e Instagram até o fechamento da venda.
          </p>
        </div>

        {onOpenNewBudget && (
          <button
            onClick={onOpenNewBudget}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm shadow-orange-600/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Orçamento</span>
          </button>
        )}
      </div>

      {/* Kanban Board Container (Kommo Style Horizontal Scroll) */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
        {STAGES.map((col) => {
          const colOpps = opportunities.filter((o) => o.stage === col.id)
          const colTotal = colOpps.reduce((sum, o) => sum + (o.final_total || 0), 0)

          return (
            <div
              key={col.id}
              className={`w-72 shrink-0 bg-slate-100/60 rounded-2xl border border-slate-200/90 flex flex-col max-h-[750px] border-t-3 ${col.color}`}
            >
              {/* Column Header */}
              <div className="p-3.5 bg-white border-b border-slate-200/70 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-800 tracking-tight">{col.title}</h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                    {colOpps.length}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-900 font-mono mt-1">
                  {formatCurrency(colTotal)}
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                {colOpps.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Nenhum lead nesta etapa
                  </div>
                ) : (
                  colOpps.map((opp) => (
                    <div
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp)}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all shadow-2xs space-y-2.5 cursor-pointer group"
                    >
                      {/* Top Row: Customer Initials Avatar + Name */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {getInitials(opp.contact?.full_name)}
                          </div>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {opp.contact?.full_name || 'Lead sem nome'}
                          </span>
                        </div>
                        {getOriginBadge(opp.contact?.origin)}
                      </div>

                      {/* Phone & Vehicle */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 font-semibold">
                          {opp.vehicle?.model || opp.vehicle_model_year || 'Veículo a definir'}
                        </span>

                        {opp.fulfillment_type === 'transportadora_envio' ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 font-medium">
                            <Truck className="w-2.5 h-2.5" />
                            <span>Transp.</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-medium">
                            <Wrench className="w-2.5 h-2.5" />
                            <span>Loja</span>
                          </span>
                        )}
                      </div>

                      {/* Value Row */}
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 font-mono">
                        <span className="text-slate-500 text-[10px]">Valor:</span>
                        <span className="font-extrabold text-orange-600">{formatCurrency(opp.final_total)}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-1">
                        {col.id === 'venda_ganha' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onConvertToOrder && onConvertToOrder(opp)
                            }}
                            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Gerar Pedido Operacional</span>
                          </button>
                        ) : col.id !== 'venda_perdida' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onMoveStage(opp.id, getStageNext(col.id))
                            }}
                            className="w-full py-1 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-[10px] font-semibold rounded-lg border border-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Avançar Etapa</span>
                            <ChevronRight className="w-3 h-3 text-orange-600" />
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
    </div>
  )
}
