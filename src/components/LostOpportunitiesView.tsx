import React, { useState, useMemo, useEffect } from 'react'
import { 
  ArchiveX, 
  Search, 
  RotateCcw, 
  Calendar, 
  Car, 
  Filter, 
  TrendingDown,
  Sparkles,
  X
} from 'lucide-react'
import { FaWhatsapp, FaInstagram, FaFacebook, FaGlobe, FaUser } from 'react-icons/fa6'
import type { Opportunity } from '../types'
import { formatCurrency, formatOrderCode, formatBRPhone } from '../utils/formatters'
import { CustomAlertModal } from './CustomAlertModal'
import { ColumnFilterDropdown, type ColumnFilterOption } from './KanbanView'

interface LostOpportunitiesViewProps {
  opportunities: Opportunity[]
  onOpenOpportunity: (opp: Opportunity) => void
  onReopenOpportunity: (oppId: string) => Promise<void> | void
}

const getWhatsAppLink = (phone?: string) => {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  const fullNumber = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${fullNumber}`
}

const getInstagramUrl = (val?: string) => {
  if (!val) return null
  const clean = val.trim()
  if (!clean) return null
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean
  if (clean.startsWith('@')) return `https://instagram.com/${clean.substring(1)}`
  return `https://instagram.com/${clean}`
}

const getFacebookUrl = (val?: string) => {
  if (!val) return null
  const clean = val.trim()
  if (!clean) return null
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean
  if (clean.startsWith('facebook.com/')) return `https://${clean}`
  return `https://facebook.com/${clean}`
}

const getWebsiteUrl = (val?: string) => {
  if (!val) return null
  const clean = val.trim()
  if (!clean) return null
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean
  return `https://${clean}`
}

export const LostOpportunitiesView: React.FC<LostOpportunitiesViewProps> = ({
  opportunities,
  onOpenOpportunity,
  onReopenOpportunity
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null)
  const [columnFilters, setColumnFilters] = useState<{
    vehicles: string[]
    reasons: string[]
    responsibles: string[]
  }>({
    vehicles: [],
    reasons: [],
    responsibles: [],
  })

  const [oppToReactivate, setOppToReactivate] = useState<Opportunity | null>(null)
  const [isReactivating, setIsReactivating] = useState(false)

  // Oportunidades perdidas/encerradas: apenas oportunidades com stage === 'venda_perdida'
  const lostOpps = useMemo(() => {
    return opportunities.filter((o) => o.stage === 'venda_perdida')
  }, [opportunities])

  // Fechar popover ao clicar fora
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (
        !target?.closest('[data-filter-popover]') &&
        !target?.closest('[data-filter-trigger]')
      ) {
        setActiveFilterDropdown(null)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  // Opções para filtro de Veículo
  const vehicleOptions: ColumnFilterOption[] = useMemo(() => {
    const counts: Record<string, number> = {}
    lostOpps.forEach((o) => {
      const v = o.vehicle?.model || o.vehicle_model_year || 'Utilitário'
      counts[v] = (counts[v] || 0) + 1
    })
    return Object.entries(counts).map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
  }, [lostOpps])

  // Opções para filtro de Motivo
  const reasonOptions: ColumnFilterOption[] = useMemo(() => {
    const counts: Record<string, number> = {}
    lostOpps.forEach((o) => {
      const r = o.lost_reason || 'Encerrado sem motivo'
      counts[r] = (counts[r] || 0) + 1
    })
    return Object.entries(counts).map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
  }, [lostOpps])

  // Opções para filtro de Responsável
  const responsibleOptions: ColumnFilterOption[] = useMemo(() => {
    const counts: Record<string, number> = {}
    lostOpps.forEach((o) => {
      const resp = o.assigned_to || 'Equipe'
      counts[resp] = (counts[resp] || 0) + 1
    })
    return Object.entries(counts).map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
  }, [lostOpps])

  // Filtragem completa
  const filteredOpps = useMemo(() => {
    return lostOpps.filter((opp) => {
      const q = searchTerm.toLowerCase().trim()
      const vModel = opp.vehicle?.model || opp.vehicle_model_year || 'Utilitário'
      const oppReason = opp.lost_reason || 'Encerrado sem motivo'
      const oppResp = opp.assigned_to || 'Equipe'

      const matchesSearch =
        !q ||
        (opp.contact?.full_name || '').toLowerCase().includes(q) ||
        (opp.contact?.phone_e164 || '').includes(q) ||
        vModel.toLowerCase().includes(q) ||
        oppReason.toLowerCase().includes(q) ||
        oppResp.toLowerCase().includes(q) ||
        (opp.order_number?.toString() || '').includes(q)

      const matchesVehicle =
        columnFilters.vehicles.length === 0 || columnFilters.vehicles.includes(vModel)

      const matchesReason =
        columnFilters.reasons.length === 0 || columnFilters.reasons.includes(oppReason)

      const matchesResponsible =
        columnFilters.responsibles.length === 0 || columnFilters.responsibles.includes(oppResp)

      return matchesSearch && matchesVehicle && matchesReason && matchesResponsible
    })
  }, [lostOpps, searchTerm, columnFilters])

  // Métricas
  const totalLostValue = useMemo(() => {
    return filteredOpps.reduce((acc, curr) => acc + (curr.final_total || 0), 0)
  }, [filteredOpps])

  const totalActiveColumnFilters =
    columnFilters.vehicles.length +
    columnFilters.reasons.length +
    columnFilters.responsibles.length

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

  const renderSocialDock = (opp: Opportunity) => {
    const waUrl = getWhatsAppLink(opp.contact?.phone_e164)
    const igUrl = getInstagramUrl(opp.instagram_url || opp.contact?.instagram_url || opp.contact?.instagram_handle)
    const fbUrl = getFacebookUrl(opp.facebook_url || opp.contact?.facebook_url)
    const webUrl = getWebsiteUrl(opp.website_url || opp.contact?.website_url)

    return (
      <div className="flex items-center gap-1 shrink-0">
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`WhatsApp: Conversar com ${opp.contact?.full_name || 'cliente'}`}
            className="p-1 rounded-md text-emerald-600 hover:text-white hover:bg-emerald-600 transition-colors bg-emerald-50 border border-emerald-200"
          >
            <FaWhatsapp className="w-2.5 h-2.5" />
          </a>
        )}
        {igUrl && (
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Abrir Instagram"
            className="p-1 rounded-md text-pink-600 hover:text-white hover:bg-pink-600 transition-colors bg-pink-50 border border-pink-200"
          >
            <FaInstagram className="w-2.5 h-2.5" />
          </a>
        )}
        {fbUrl && (
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Abrir Facebook"
            className="p-1 rounded-md text-blue-600 hover:text-white hover:bg-blue-600 transition-colors bg-blue-50 border border-blue-200"
          >
            <FaFacebook className="w-2.5 h-2.5" />
          </a>
        )}
        {webUrl && (
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Abrir Site"
            className="p-1 rounded-md text-slate-600 hover:text-white hover:bg-slate-700 transition-colors bg-slate-100 border border-slate-200"
          >
            <FaGlobe className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
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
              Registro de negociações encerradas para acompanhamento, follow-up e reativação comercial.
            </p>
          </div>
        </div>

        {/* Resumo Financeiro Potencial */}
        <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200/80 flex items-center gap-3 shrink-0">
          <TrendingDown className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Valor Potencial em Recuperação:
            </span>
            <span className="font-mono text-base font-bold text-slate-900">
              {formatCurrency(totalLostValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Ações Rápidas */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-nexo flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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

        {/* Botão para limpar filtros de coluna */}
        {totalActiveColumnFilters > 0 && (
          <button
            type="button"
            onClick={() => setColumnFilters({ vehicles: [], reasons: [], responsibles: [] })}
            className="px-3 py-2 rounded-xl text-xs font-bold text-[#EA580C] bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar filtros de coluna ({totalActiveColumnFilters})</span>
          </button>
        )}
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
            <table className="w-full text-left border-collapse min-w-[880px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-3 w-24">Código</th>
                  <th className="py-3 px-3">Cliente & Contato</th>
                  
                  {/* Veículo com filtro estilo Excel */}
                  <th className="py-3 px-3 relative w-44">
                    <div className="flex items-center gap-1.5">
                      <span>Veículo</span>
                      <button
                        type="button"
                        data-filter-trigger
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveFilterDropdown((c) => (c === 'lost-vehicle' ? null : 'lost-vehicle'))
                        }}
                        title="Filtrar por Veículo"
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          columnFilters.vehicles.length > 0
                            ? 'bg-orange-100 text-[#EA580C] ring-1 ring-orange-400 font-bold'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                        }`}
                      >
                        <Filter className="w-3 h-3" />
                      </button>
                    </div>
                    <ColumnFilterDropdown
                      title="Filtrar por Veículo"
                      isOpen={activeFilterDropdown === 'lost-vehicle'}
                      onClose={() => setActiveFilterDropdown(null)}
                      options={vehicleOptions}
                      selectedValues={columnFilters.vehicles}
                      onToggleValue={(val) =>
                        setColumnFilters((prev) => ({
                          ...prev,
                          vehicles: prev.vehicles.includes(val)
                            ? prev.vehicles.filter((v) => v !== val)
                            : [...prev.vehicles, val],
                        }))
                      }
                      onSelectAll={() =>
                        setColumnFilters((prev) => ({
                          ...prev,
                          vehicles: vehicleOptions.map((o) => o.value),
                        }))
                      }
                      onClearSelection={() =>
                        setColumnFilters((prev) => ({ ...prev, vehicles: [] }))
                      }
                    />
                  </th>

                  {/* Motivo do Encerramento com filtro estilo Excel */}
                  <th className="py-3 px-3 relative w-56">
                    <div className="flex items-center gap-1.5">
                      <span>Motivo do Encerramento</span>
                      <button
                        type="button"
                        data-filter-trigger
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveFilterDropdown((c) => (c === 'lost-reason' ? null : 'lost-reason'))
                        }}
                        title="Filtrar por Motivo"
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          columnFilters.reasons.length > 0
                            ? 'bg-orange-100 text-[#EA580C] ring-1 ring-orange-400 font-bold'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                        }`}
                      >
                        <Filter className="w-3 h-3" />
                      </button>
                    </div>
                    <ColumnFilterDropdown
                      title="Filtrar por Motivo"
                      isOpen={activeFilterDropdown === 'lost-reason'}
                      onClose={() => setActiveFilterDropdown(null)}
                      options={reasonOptions}
                      selectedValues={columnFilters.reasons}
                      onToggleValue={(val) =>
                        setColumnFilters((prev) => ({
                          ...prev,
                          reasons: prev.reasons.includes(val)
                            ? prev.reasons.filter((v) => v !== val)
                            : [...prev.reasons, val],
                        }))
                      }
                      onSelectAll={() =>
                        setColumnFilters((prev) => ({
                          ...prev,
                          reasons: reasonOptions.map((o) => o.value),
                        }))
                      }
                      onClearSelection={() =>
                        setColumnFilters((prev) => ({ ...prev, reasons: [] }))
                      }
                    />
                  </th>

                  <th className="py-3 px-3 w-32">Data Encerramento</th>

                  {/* Responsável com filtro estilo Excel */}
                  <th className="py-3 px-3 relative w-36">
                    <div className="flex items-center gap-1.5">
                      <span>Responsável</span>
                      <button
                        type="button"
                        data-filter-trigger
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveFilterDropdown((c) => (c === 'lost-resp' ? null : 'lost-resp'))
                        }}
                        title="Filtrar por Responsável"
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          columnFilters.responsibles.length > 0
                            ? 'bg-orange-100 text-[#EA580C] ring-1 ring-orange-400 font-bold'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                        }`}
                      >
                        <Filter className="w-3 h-3" />
                      </button>
                    </div>
                    <ColumnFilterDropdown
                      title="Filtrar por Responsável"
                      isOpen={activeFilterDropdown === 'lost-resp'}
                      onClose={() => setActiveFilterDropdown(null)}
                      options={responsibleOptions}
                      selectedValues={columnFilters.responsibles}
                      onToggleValue={(val) =>
                        setColumnFilters((prev) => ({
                          ...prev,
                          responsibles: prev.responsibles.includes(val)
                            ? prev.responsibles.filter((v) => v !== val)
                            : [...prev.responsibles, val],
                        }))
                      }
                      onSelectAll={() =>
                        setColumnFilters((prev) => ({
                          ...prev,
                          responsibles: responsibleOptions.map((o) => o.value),
                        }))
                      }
                      onClearSelection={() =>
                        setColumnFilters((prev) => ({ ...prev, responsibles: [] }))
                      }
                      alignRight
                    />
                  </th>

                  <th className="py-3 px-3 text-right w-28">Valor Orçado</th>
                  <th className="py-3 px-4 text-center w-28">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOpps.map((opp) => {
                  const clientName = opp.contact?.full_name || 'Cliente sem nome'
                  const rawDate = opp.closed_at || opp.updated_at || opp.created_at
                  const formattedDate = new Date(rawDate).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })

                  return (
                    <tr 
                      key={opp.id} 
                      onClick={() => onOpenOpportunity(opp)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      {/* Código */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                        <span className="px-2 py-1 bg-slate-100 rounded-lg group-hover:bg-orange-100 group-hover:text-[#EA580C] transition-colors">
                          {formatOrderCode(opp.order_number)}
                        </span>
                      </td>

                      {/* Cliente e Contato (com botões de contato, truncamento seguro e sem • contato) */}
                      <td className="py-3 px-3 align-middle max-w-[340px]">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span 
                            className="font-bold text-slate-900 group-hover:text-[#EA580C] transition-colors text-xs truncate max-w-[280px] sm:max-w-[340px] block"
                            title={clientName}
                          >
                            {clientName}
                          </span>
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            {opp.contact?.phone_e164 ? (
                              <span className="text-[11px] font-mono text-slate-500 shrink-0">
                                {formatBRPhone(opp.contact.phone_e164.replace('+55', ''))}
                              </span>
                            ) : (
                              <span className="text-[11px] italic text-slate-400 shrink-0">Sem telefone</span>
                            )}
                            {renderSocialDock(opp)}
                          </div>
                        </div>
                      </td>

                      {/* Veículo */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-xs">
                          <Car className="w-3.5 h-3.5 text-[#EA580C]" />
                          <span>{opp.vehicle?.model || opp.vehicle_model_year || 'Utilitário'}</span>
                        </span>
                      </td>

                      {/* Motivo do Encerramento (apenas a badge principal) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                          {opp.lost_reason || 'Encerrado sem motivo'}
                        </span>
                      </td>

                      {/* Data de Encerramento */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 text-xs">
                          <FaUser className="w-3 h-3 text-slate-400" />
                          <span>{opp.assigned_to || 'Equipe'}</span>
                        </span>
                      </td>

                      {/* Valor Orçado */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                        {formatCurrency(opp.final_total || 0)}
                      </td>

                      {/* Ação (Última coluna: Botão Reativar, sem botão de olho) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOppToReactivate(opp)}
                          title="Reativar oportunidade (retorna para Novo Lead)"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Reativar</span>
                        </button>
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
