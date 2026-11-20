import React, { useState, useMemo } from 'react'
import { 
  ArchiveX, 
  Search, 
  RotateCcw, 
  Eye, 
  Calendar, 
  Car, 
  Phone, 
  Filter, 
  UserCheck, 
  ArrowRight,
  TrendingDown,
  Sparkles,
  Info
} from 'lucide-react'
import { FaWhatsapp, FaInstagram, FaFacebook, FaGlobe, FaUser } from 'react-icons/fa6'
import type { Opportunity } from '../types'
import { formatCurrency, formatOrderCode, formatBRPhone } from '../utils/formatters'
import { COMMON_LOSS_REASONS } from './CloseOpportunityModal'
import { CustomAlertModal } from './CustomAlertModal'

interface LostOpportunitiesViewProps {
  opportunities: Opportunity[]
  onOpenOpportunity: (opp: Opportunity) => void
  onReopenOpportunity: (oppId: string) => Promise<void> | void
}

export const LostOpportunitiesView: React.FC<LostOpportunitiesViewProps> = ({
  opportunities,
  onOpenOpportunity,
  onReopenOpportunity
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string>('all')
  const [selectedResponsibleFilter, setSelectedResponsibleFilter] = useState<string>('all')
  const [oppToReactivate, setOppToReactivate] = useState<Opportunity | null>(null)
  const [isReactivating, setIsReactivating] = useState(false)

  // Oportunidades perdidas/encerradas
  const lostOpps = useMemo(() => {
    return opportunities.filter(
      (o) => o.stage === 'venda_perdida' || Boolean(o.closed_at) || Boolean(o.lost_reason)
    )
  }, [opportunities])

  // Filtragem
  const filteredOpps = useMemo(() => {
    return lostOpps.filter((opp) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (opp.contact?.full_name || '').toLowerCase().includes(q) ||
        (opp.contact?.phone_e164 || '').includes(q) ||
        (opp.vehicle_model_year || opp.vehicle?.model || '').toLowerCase().includes(q) ||
        (opp.lost_reason || '').toLowerCase().includes(q) ||
        (opp.lost_reason_details || '').toLowerCase().includes(q) ||
        (opp.order_number?.toString() || '').includes(q)

      const matchesReason =
        selectedReasonFilter === 'all' || opp.lost_reason === selectedReasonFilter

      const matchesResponsible =
        selectedResponsibleFilter === 'all' || opp.assigned_to === selectedResponsibleFilter

      return matchesSearch && matchesReason && matchesResponsible
    })
  }, [lostOpps, searchTerm, selectedReasonFilter, selectedResponsibleFilter])

  // Métricas
  const totalLostValue = useMemo(() => {
    return filteredOpps.reduce((acc, curr) => acc + (curr.final_total || 0), 0)
  }, [filteredOpps])

  const handleConfirmReactivate = async () => {
    if (!oppToReactivate) return
    setIsReactivating(true)
    try {
      await onReopenOpportunity(oppToReactivate.id)
      setOppToReactivate(null)
    } finally {
      setIsReactivating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-nexo flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
            <ArchiveX className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                Oportunidades Perdidas
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {lostOpps.length} {lostOpps.length === 1 ? 'negociação' : 'negociações'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Registro completo de negociações encerradas para acompanhamento, follow-up e reativação comercial.
            </p>
          </div>
        </div>

        {/* Resumo Financeiro Potencial */}
        <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200/80 flex items-center gap-3 shrink-0">
          <TrendingDown className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Valor Potencial em Recuperação:
            </span>
            <span className="font-mono text-base font-bold text-slate-900">
              {formatCurrency(totalLostValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-nexo flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, veículo, telefone, código ou motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] transition-all font-medium"
          />
        </div>

        {/* Filtro por Motivo de Encerramento */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedReasonFilter}
            onChange={(e) => setSelectedReasonFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-[#EA580C] cursor-pointer"
          >
            <option value="all">Todos os Motivos</option>
            {COMMON_LOSS_REASONS.map((r) => (
              <option key={r} value={r === 'Outro motivo (especificar)' ? 'Outro motivo' : r}>
                {r}
              </option>
            ))}
          </select>

          {/* Filtro por Responsável */}
          <select
            value={selectedResponsibleFilter}
            onChange={(e) => setSelectedResponsibleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-[#EA580C] cursor-pointer"
          >
            <option value="all">Todos os Responsáveis</option>
            <option value="Norlando">Norlando</option>
            <option value="Igor">Igor</option>
            <option value="Loja">Loja</option>
          </select>
        </div>
      </div>

      {/* Lista / Tabela de Oportunidades Perdidas */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-nexo overflow-hidden">
        {filteredOpps.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <ArchiveX className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {lostOpps.length === 0 ? 'Nenhuma oportunidade perdida' : 'Nenhum resultado para os filtros aplicados'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {lostOpps.length === 0 
                ? 'Quando uma negociação for encerrada pelo vendedor, ela será listada aqui para posterior follow-up e reativação.'
                : 'Tente ajustar os termos de busca ou filtros selecionados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-28">Código</th>
                  <th className="py-3 px-4">Cliente & Contato</th>
                  <th className="py-3 px-4">Veículo</th>
                  <th className="py-3 px-4">Motivo do Encerramento</th>
                  <th className="py-3 px-4">Data Encerramento</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4 text-right">Valor Orçado</th>
                  <th className="py-3 px-4 text-center w-36">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOpps.map((opp) => {
                  const clientName = opp.contact?.full_name || 'Cliente'
                  const rawDate = opp.closed_at || opp.updated_at || opp.created_at
                  const formattedDate = new Date(rawDate).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })

                  return (
                    <tr 
                      key={opp.id} 
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Código */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        <span className="px-2 py-1 bg-slate-100 rounded-lg">
                          {formatOrderCode(opp.order_number)}
                        </span>
                      </td>

                      {/* Cliente e Contato */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {clientName}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs mt-0.5">
                          {opp.contact?.phone_e164 ? (
                            <span className="font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {formatBRPhone(opp.contact.phone_e164.replace('+55', ''))}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">Sem telefone</span>
                          )}
                          {opp.contact?.email && (
                            <span className="text-slate-400 truncate max-w-[150px]" title={opp.contact.email}>
                              • {opp.contact.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Veículo */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-xs">
                          <Car className="w-3.5 h-3.5 text-[#EA580C]" />
                          <span>{opp.vehicle?.model || opp.vehicle_model_year || 'Utilitário'}</span>
                        </span>
                      </td>

                      {/* Motivo do Encerramento */}
                      <td className="py-3.5 px-4 max-w-[250px]">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                          {opp.lost_reason || 'Encerrado sem motivo'}
                        </span>
                        {opp.lost_reason_details && (
                          <p className="text-xs text-slate-500 mt-1 truncate" title={opp.lost_reason_details}>
                            {opp.lost_reason_details}
                          </p>
                        )}
                      </td>

                      {/* Data de Encerramento */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 text-xs">
                          <FaUser className="w-3 h-3 text-slate-400" />
                          <span>{opp.assigned_to || 'Equipe'}</span>
                        </span>
                      </td>

                      {/* Valor Orçado */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                        {formatCurrency(opp.final_total || 0)}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenOpportunity(opp)}
                            title="Ver histórico e proposta anterior"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setOppToReactivate(opp)}
                            title="Reativar oportunidade (retorna para Novo Lead)"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Reativar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Reativação */}
      <CustomAlertModal
        isOpen={Boolean(oppToReactivate)}
        onClose={() => setOppToReactivate(null)}
        type="info"
        title="Reativar Oportunidade"
        message={
          oppToReactivate ? (
            <div className="space-y-3">
              <p className="text-slate-600 text-xs leading-relaxed">
                Deseja reativar a oportunidade{' '}
                <strong className="text-slate-900">{formatOrderCode(oppToReactivate.order_number)}</strong> do cliente{' '}
                <strong className="text-slate-900">{oppToReactivate.contact?.full_name || 'Cliente'}</strong>?
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>A oportunidade retornará para o Funil de Vendas na etapa:</span>
                </div>
                <p className="font-extrabold text-sm text-emerald-900 pl-5">
                  1. Novo lead
                </p>
                <p className="text-[11px] text-emerald-700 pl-5 pt-0.5">
                  Todas as informações, produtos e veículo anteriores serão mantidos integralmente.
                </p>
              </div>
            </div>
          ) : (
            ''
          )
        }
        primaryButtonText={isReactivating ? 'Reativando...' : 'Sim, Reativar Lead'}
        onPrimaryAction={() => void handleConfirmReactivate()}
        secondaryButtonText="Cancelar"
        onSecondaryAction={() => setOppToReactivate(null)}
      />
    </div>
  )
}
