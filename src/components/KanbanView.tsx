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
  CheckCircle2
} from 'lucide-react'

interface KanbanViewProps {
  opportunities: Opportunity[]
  onMoveStage: (id: string, newStage: OpportunityStage) => void
  onConvertToOrder?: (opp: Opportunity) => void
  onOpenNewBudget?: () => void
}

const STAGES: { id: OpportunityStage; title: string; color: string }[] = [
  { id: 'novo_lead', title: 'Novo Lead', color: 'border-blue-500/40 text-blue-400' },
  { id: 'em_qualificacao', title: 'Qualificação IA / Contato', color: 'border-cyan-500/40 text-cyan-400' },
  { id: 'aguardando_cotacao_frete', title: 'Cotação com Igor (Frete)', color: 'border-amber-500/40 text-amber-400' },
  { id: 'orcamento_enviado', title: 'Orçamento Enviado', color: 'border-purple-500/40 text-purple-400' },
  { id: 'em_negociacao', title: 'Em Negociação', color: 'border-orange-500/40 text-orange-400' },
  { id: 'aguardando_pagamento', title: 'Aguardando Pagamento', color: 'border-yellow-500/40 text-yellow-400' },
  { id: 'venda_ganha', title: 'Venda Ganha (Gerar Pedido)', color: 'border-emerald-500/40 text-emerald-400' },
  { id: 'venda_perdida', title: 'Venda Perdida', color: 'border-slate-700 text-slate-500' },
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

  const getOriginIcon = (origin?: string) => {
    switch (origin) {
      case 'instagram_direct':
        return <Camera className="w-3 h-3 text-pink-400" />
      case 'loja_presencial':
        return <Store className="w-3 h-3 text-blue-400" />
      default:
        return <MessageSquare className="w-3 h-3 text-emerald-400" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <KanbanIcon className="w-6 h-6 text-orange-500" />
            <span>Funil Comercial de Vendas (Norlando)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Acompanhe o ciclo completo de cada lead inbound desde o WhatsApp/Instagram até o fechamento da venda.
          </p>
        </div>

        {onOpenNewBudget && (
          <button
            onClick={onOpenNewBudget}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-md shadow-orange-500/10 self-start sm:self-auto"
          >
            + Novo Orçamento
          </button>
        )}
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
        {STAGES.map((col) => {
          const colOpps = opportunities.filter((o) => o.stage === col.id)
          const colTotal = colOpps.reduce((sum, o) => sum + (o.final_total || 0), 0)

          return (
            <div
              key={col.id}
              className="w-72 shrink-0 bg-slate-900/40 rounded-2xl border border-slate-800/80 flex flex-col max-h-[750px]"
            >
              {/* Column Header */}
              <div className={`p-3.5 border-b border-slate-800/80 border-t-2 ${col.color}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs tracking-tight text-white">{col.title}</h3>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {colOpps.length}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Total: {formatCurrency(colTotal)}
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                {colOpps.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-600">
                    Nenhum card nesta etapa
                  </div>
                ) : (
                  colOpps.map((opp) => (
                    <div
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp)}
                      className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 hover:border-slate-700 transition-all shadow-sm hover:shadow-md space-y-2.5 group cursor-pointer"
                    >
                      {/* Top Row: Customer & Origin */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate">
                          {opp.contact?.full_name || 'Lead sem nome'}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {getOriginIcon(opp.contact?.origin)}
                          <span className="text-[10px] text-slate-500 font-mono">
                            {opp.contact?.phone_e164 ? opp.contact.phone_e164.slice(-4) : ''}
                          </span>
                        </div>
                      </div>

                      {/* Vehicle & Fulfillment Badge */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-medium">
                          {opp.vehicle?.model || opp.vehicle_model_year || 'Veículo não def.'}
                        </span>

                        {opp.fulfillment_type === 'transportadora_envio' ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                            <Truck className="w-2.5 h-2.5" />
                            <span>Transp.</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <Wrench className="w-2.5 h-2.5" />
                            <span>Loja</span>
                          </span>
                        )}
                      </div>

                      {/* Value and Items Summary */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900 font-mono">
                        <span className="text-slate-500 text-[10px]">Valor Proposta:</span>
                        <span className="font-bold text-orange-400">{formatCurrency(opp.final_total)}</span>
                      </div>

                      {/* Action to advance or convert to order */}
                      <div className="pt-1 flex items-center gap-1.5">
                        {col.id === 'venda_ganha' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onConvertToOrder && onConvertToOrder(opp)
                            }}
                            className="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
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
                            className="w-full py-1 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-medium rounded-lg border border-slate-800 flex items-center justify-center gap-1 transition-colors"
                          >
                            <span>Avançar Etapa</span>
                            <ChevronRight className="w-3 h-3 text-orange-400" />
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
