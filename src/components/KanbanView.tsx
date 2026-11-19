import React, { useState, useEffect, useMemo } from 'react'
import type { Opportunity, OpportunityStage, Order, OrderStatus } from '../types'
import { formatOrderCode } from '../utils/formatters'
import { CustomAlertModal } from './CustomAlertModal'
import { 
  Search, 
  Plus, 
  Filter,
  Truck, 
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  X,
  Columns3,
  Table2,
  ChevronRight,
  Clock,
  Calendar,
  MessageSquare,
  RotateCcw
} from 'lucide-react'
import { 
  FaWhatsapp, 
  FaInstagram, 
  FaFacebook, 
  FaStore, 
  FaUser, 
  FaGlobe, 
  FaTruck, 
  FaVanShuttle, 
  FaCarSide, 
  FaTruckPickup,
  FaUserPlus,
  FaMagnifyingGlass,
  FaCalculator,
  FaPaperPlane,
  FaComments,
  FaCreditCard,
  FaDollarSign,
  FaCircleXmark,
  FaFileLines,
  FaBoxesPacking,
  FaClock as FaClock6,
  FaTruckFast,
  FaCircleCheck,
  FaBan
} from 'react-icons/fa6'

interface KanbanViewProps {
  opportunities: Opportunity[]
  orders?: Order[]
  onMoveStage: (id: string, newStage: OpportunityStage) => void
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus) => void
  onConvertToOrder?: (opp: Opportunity) => void
  onOpenNewBudget?: () => void
  onSelectOpportunity?: (opp: Opportunity) => void
  mode?: 'vendas' | 'pedidos'
}

type PipelineType = 'vendas' | 'pedidos'

interface SalesStageConfig {
  id: OpportunityStage
  title: string
  stripeColor: string
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

interface OrderStageConfig {
  id: OrderStatus
  title: string
  stripeColor: string
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

// 8 Etapas com ícones representativos do Font Awesome para o Funil de Vendas
const SALES_STAGES: SalesStageConfig[] = [
  { 
    id: 'novo_lead', 
    title: 'Novo lead', 
    stripeColor: '#6366F1',
    Icon: FaUserPlus
  },
  { 
    id: 'em_qualificacao', 
    title: 'Em qualificação', 
    stripeColor: '#0EA5E9',
    Icon: FaMagnifyingGlass
  },
  { 
    id: 'aguardando_cotacao', 
    title: 'Aguardando Cotação', 
    stripeColor: '#2563EB',
    Icon: FaCalculator
  },
  { 
    id: 'orcamento_enviado', 
    title: 'Orçamento enviado', 
    stripeColor: '#EA580C',
    Icon: FaPaperPlane
  },
  { 
    id: 'em_negociacao', 
    title: 'Em negociação', 
    stripeColor: '#F59E0B',
    Icon: FaComments
  },
  { 
    id: 'aguardando_pagamento', 
    title: 'Aguardando Pagamento', 
    stripeColor: '#EAB308',
    Icon: FaCreditCard
  },
  { 
    id: 'venda_ganha', 
    title: 'Venda Ganha', 
    stripeColor: '#10B981',
    Icon: FaDollarSign
  },
  { 
    id: 'venda_perdida', 
    title: 'Venda Perdida', 
    stripeColor: '#EF4444',
    Icon: FaCircleXmark
  },
]

// 6 Etapas com ícones representativos do Font Awesome para o Funil de Pedidos
const ORDER_STAGES: OrderStageConfig[] = [
  { 
    id: 'pedido_gerado', 
    title: 'Pedido Gerado', 
    stripeColor: '#3B82F6',
    Icon: FaFileLines
  },
  { 
    id: 'em_preparacao', 
    title: 'Em preparação', 
    stripeColor: '#8B5CF6',
    Icon: FaBoxesPacking
  },
  { 
    id: 'aguardando_coleta_instalacao', 
    title: 'Aguardando Coleta/Instalação', 
    stripeColor: '#0284C7',
    Icon: FaClock6
  },
  { 
    id: 'em_entrega_instalacao', 
    title: 'Em entrega/Instalação', 
    stripeColor: '#06B6D4',
    Icon: FaTruckFast
  },
  { 
    id: 'pedido_concluido', 
    title: 'Pedido Concluído', 
    stripeColor: '#10B981',
    Icon: FaCircleCheck
  },
  { 
    id: 'pedido_cancelado', 
    title: 'Pedido Cancelado', 
    stripeColor: '#EF4444',
    Icon: FaBan
  },
]

interface VehicleInfo {
  modelName: string
  iconType: 'kombi' | 'large_van' | 'medium_van' | 'small_van' | 'truck' | 'default'
}

interface ColumnFilterOption {
  value: string
  label: string
  count: number
  icon?: React.ReactNode
}

interface ColumnFilterDropdownProps {
  title: string
  isOpen: boolean
  onClose: () => void
  options: ColumnFilterOption[]
  selectedValues: string[]
  onToggleValue: (val: string) => void
  onSelectAll: () => void
  onClearSelection: () => void
  alignRight?: boolean
}

const ColumnFilterDropdown: React.FC<ColumnFilterDropdownProps> = ({
  title,
  isOpen,
  onClose,
  options,
  selectedValues,
  onToggleValue,
  onSelectAll,
  onClearSelection,
  alignRight = false,
}) => {
  const [search, setSearch] = useState('')

  if (!isOpen) return null

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase().trim())
  )

  return (
    <div
      data-filter-popover
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-full mt-1.5 z-40 w-64 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-3 text-slate-800 space-y-2.5 animate-in fade-in zoom-in-95 duration-100 font-sans normal-case tracking-normal ${
        alignRight ? 'right-0' : 'left-0'
      }`}
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <Filter className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
          <span className="text-xs font-bold text-slate-800 truncate">{title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {options.length > 3 && (
        <div className="relative">
          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#EA580C] focus:bg-white transition-all font-medium"
          />
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold px-0.5">
        <button
          type="button"
          onClick={onSelectAll}
          className="hover:text-[#EA580C] transition-colors cursor-pointer"
        >
          Marcar todos
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          className="hover:text-rose-600 transition-colors cursor-pointer"
        >
          Desmarcar todos
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 kanban-col-scroll">
        {filteredOptions.length === 0 ? (
          <div className="py-4 text-center text-[11px] text-slate-400 font-medium">
            Nenhum item encontrado
          </div>
        ) : (
          filteredOptions.map((opt) => {
            const isChecked = selectedValues.includes(opt.value)
            return (
              <label
                key={opt.value}
                className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700 transition-colors select-none"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleValue(opt.value)}
                    className="w-3.5 h-3.5 text-[#EA580C] rounded border-slate-300 focus:ring-[#EA580C] cursor-pointer"
                  />
                  {opt.icon}
                  <span className="truncate text-[11px]">{opt.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-bold px-1.5 py-0.2 bg-slate-100 rounded-full shrink-0">
                  {opt.count}
                </span>
              </label>
            )
          })
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onClearSelection}
          disabled={selectedValues.length === 0}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
        >
          Limpar filtro
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 bg-[#EA580C] hover:bg-[#C2410C] text-white text-[11px] font-bold rounded-lg transition-all shadow-2xs cursor-pointer"
        >
          Concluir
        </button>
      </div>
    </div>
  )
}

interface PendingStageChange {
  type: 'opportunity' | 'order'
  id: string
  code: string
  clientName: string
  fromStageId: string
  fromStageTitle: string
  toStageId: string
  toStageTitle: string
  toColor: string
}

export const KanbanView: React.FC<KanbanViewProps> = ({ 
  opportunities, 
  orders = [],
  onMoveStage,
  onUpdateOrderStatus,
  onConvertToOrder,
  onOpenNewBudget,
  onSelectOpportunity,
  mode = 'vendas'
}) => {
  const pipelineType: PipelineType = mode
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const density: 'detailed' | 'compact' = 'compact'

  useEffect(() => {
    setStageFilter('all')
    setSearchTerm('')
  }, [mode])

  // Filtros de Coluna no formato Excel para o Funil de Vendas
  const [salesColumnFilters, setSalesColumnFilters] = useState<{
    vehicles: string[]
    origins: string[]
    stages: string[]
    responsibles: string[]
  }>({
    vehicles: [],
    origins: [],
    stages: [],
    responsibles: []
  })

  // Filtros de Coluna no formato Excel para o Funil de Pedidos
  const [ordersColumnFilters, setOrdersColumnFilters] = useState<{
    vehicles: string[]
    origins: string[]
    fulfillments: string[]
    stages: string[]
    responsibles: string[]
  }>({
    vehicles: [],
    origins: [],
    fulfillments: [],
    stages: [],
    responsibles: []
  })

  // Dropdown de filtro atualmente aberto
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null)

  // Estado para Confirmação de Mudança de Etapa (Modal)
  const [pendingStageChange, setPendingStageChange] = useState<PendingStageChange | null>(null)

  // Drag and Drop State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)

  // Fechar dropdown de filtro ao clicar fora
  useEffect(() => {
    if (!activeFilterDropdown) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-filter-popover]') && !target.closest('[data-filter-trigger]')) {
        setActiveFilterDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeFilterDropdown])

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
    if (ord.opportunity?.final_total !== undefined) return ord.opportunity.final_total
    const matched = opportunities.find((o) => o.id === ord.opportunity_id)
    if (matched?.final_total !== undefined) return matched.final_total
    return 0
  }

  // Obter modelo do veículo do pedido para o card espelho
  const getOrderVehicleModel = (ord: Order): string => {
    if (ord.opportunity?.vehicle?.model) return ord.opportunity.vehicle.model
    if (ord.opportunity?.vehicle_model_year) return ord.opportunity.vehicle_model_year
    const matched = opportunities.find((o) => o.id === ord.opportunity_id)
    if (matched?.vehicle?.model) return matched.vehicle.model
    if (matched?.vehicle_model_year) return matched.vehicle_model_year
    return 'Utilitário'
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

  // Helper para o badge de origem no topo do card (ícone + nome)
  const getOriginBadge = (origin?: string) => {
    switch (origin) {
      case 'whatsapp_inbound':
        return {
          label: 'WhatsApp',
          Icon: FaWhatsapp,
          bgClasses: 'bg-emerald-50 text-[#15803D] border-emerald-200/90',
          iconColor: 'text-[#25D366]'
        }
      case 'instagram_direct':
        return {
          label: 'Instagram',
          Icon: FaInstagram,
          bgClasses: 'bg-pink-50 text-[#BE185D] border-pink-200/90',
          iconColor: 'text-[#E1306C]'
        }
      case 'meta_lead_ads':
        return {
          label: 'Facebook Ads',
          Icon: FaFacebook,
          bgClasses: 'bg-blue-50 text-[#1D4ED8] border-blue-200/90',
          iconColor: 'text-[#1877F2]'
        }
      case 'site_form':
      case 'site':
        return {
          label: 'Site Oficial',
          Icon: FaGlobe,
          bgClasses: 'bg-sky-50 text-[#0369A1] border-sky-200/90',
          iconColor: 'text-sky-600'
        }
      case 'loja_presencial':
      case 'manual':
        return {
          label: 'Loja Balcão',
          Icon: FaStore,
          bgClasses: 'bg-amber-50 text-[#B45309] border-amber-200/90',
          iconColor: 'text-amber-600'
        }
      default:
        return {
          label: 'Atendimento Direto',
          Icon: FaGlobe,
          bgClasses: 'bg-slate-100 text-slate-700 border-slate-200/90',
          iconColor: 'text-slate-500'
        }
    }
  }

  const getOriginTitle = (origin?: string) => {
    switch (origin) {
      case 'whatsapp_inbound': return 'Canal: WhatsApp Comercial Robusty'
      case 'instagram_direct': return 'Canal: Direct Instagram @robusty'
      case 'meta_lead_ads': return 'Canal: Meta Lead Ads (Facebook/Instagram)'
      case 'site_form':
      case 'site': return 'Canal: Formulário do Site Robusty'
      case 'loja_presencial':
      case 'manual': return 'Canal: Balcão / Loja Presencial'
      default: return 'Canal: Atendimento Direto'
    }
  }

  // Helper para exibir o responsável com ícone do Font Awesome sem formato de badge (eliminando excesso de badges no card)
  const renderResponsibleInfo = (assignedName?: string) => {
    const name = assignedName || 'Norlando'
    const isLoja = name.toLowerCase() === 'loja'

    return (
      <div 
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors"
        title={`Responsável: ${name}`}
      >
        {isLoja ? (
          <FaStore className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        ) : (
          <FaUser className="w-3 h-3 text-slate-400 shrink-0" />
        )}
        <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[110px]">
          {name}
        </span>
      </div>
    )
  }

  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return null
    const clean = phone.replace(/\D/g, '')
    if (!clean) return null
    const full = clean.startsWith('55') ? clean : `55${clean}`
    return `https://wa.me/${full}`
  }

  const getInstagramUrl = (val?: string) => {
    if (!val) return null
    const clean = val.trim()
    if (!clean) return null
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean
    if (clean.startsWith('instagram.com/')) return `https://${clean}`
    const handle = clean.replace(/^@/, '')
    return `https://instagram.com/${handle}`
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

  interface SocialLinksProps {
    phone?: string
    instagram?: string
    facebook?: string
    website?: string
    clientName?: string
    isCompact?: boolean
  }

  const renderSocialDock = ({
    phone,
    instagram,
    facebook,
    website,
    clientName,
    isCompact = false
  }: SocialLinksProps) => {
    const waUrl = getWhatsAppLink(phone)
    const igUrl = getInstagramUrl(instagram)
    const fbUrl = getFacebookUrl(facebook)
    const webUrl = getWebsiteUrl(website)

    const iconSize = isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'
    const btnPadding = isCompact ? 'p-1 rounded-md' : 'p-1.5 rounded-lg'

    return (
      <div className="flex items-center gap-1">
        {/* WhatsApp */}
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`WhatsApp: Conversar com ${clientName || 'cliente'}`}
            className={`${btnPadding} bg-emerald-50 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-emerald-200 hover:border-[#25D366] transition-all cursor-pointer shadow-2xs flex items-center justify-center`}
          >
            <FaWhatsapp className={iconSize} />
          </a>
        ) : (
          <span
            onClick={(e) => e.stopPropagation()}
            title="WhatsApp não informado"
            className={`${btnPadding} bg-slate-50 text-slate-300 border border-slate-150 cursor-not-allowed opacity-40 flex items-center justify-center`}
          >
            <FaWhatsapp className={iconSize} />
          </span>
        )}

        {/* Instagram */}
        {igUrl ? (
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Instagram: Abrir perfil de ${clientName || 'cliente'}`}
            className={`${btnPadding} bg-pink-50 hover:bg-[#E1306C] text-[#E1306C] hover:text-white border border-pink-200 hover:border-[#E1306C] transition-all cursor-pointer shadow-2xs flex items-center justify-center`}
          >
            <FaInstagram className={iconSize} />
          </a>
        ) : (
          <span
            onClick={(e) => e.stopPropagation()}
            title="Instagram não informado"
            className={`${btnPadding} bg-slate-50 text-slate-300 border border-slate-150 cursor-not-allowed opacity-40 flex items-center justify-center`}
          >
            <FaInstagram className={iconSize} />
          </span>
        )}

        {/* Facebook */}
        {fbUrl ? (
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Facebook: Abrir página de ${clientName || 'cliente'}`}
            className={`${btnPadding} bg-blue-50 hover:bg-[#1877F2] text-[#1877F2] hover:text-white border border-blue-200 hover:border-[#1877F2] transition-all cursor-pointer shadow-2xs flex items-center justify-center`}
          >
            <FaFacebook className={iconSize} />
          </a>
        ) : (
          <span
            onClick={(e) => e.stopPropagation()}
            title="Facebook não informado"
            className={`${btnPadding} bg-slate-50 text-slate-300 border border-slate-150 cursor-not-allowed opacity-40 flex items-center justify-center`}
          >
            <FaFacebook className={iconSize} />
          </span>
        )}

        {/* Website */}
        {webUrl ? (
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Site: Visitar página de ${clientName || 'cliente'}`}
            className={`${btnPadding} bg-sky-50 hover:bg-sky-600 text-sky-600 hover:text-white border border-sky-200 hover:border-sky-600 transition-all cursor-pointer shadow-2xs flex items-center justify-center`}
          >
            <FaGlobe className={iconSize} />
          </a>
        ) : (
          <span
            onClick={(e) => e.stopPropagation()}
            title="Website não informado"
            className={`${btnPadding} bg-slate-50 text-slate-300 border border-slate-150 cursor-not-allowed opacity-40 flex items-center justify-center`}
          >
            <FaGlobe className={iconSize} />
          </span>
        )}
      </div>
    )
  }

  // Filtrar Oportunidades de Vendas (Nome, Telefone, Veículo, Número do Pedido, Transportadora)
  const filteredOpportunities = opportunities.filter((opp) => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    return (
      (opp.contact?.full_name || '').toLowerCase().includes(q) ||
      (opp.vehicle_model_year || '').toLowerCase().includes(q) ||
      (opp.vehicle?.model || '').toLowerCase().includes(q) ||
      (opp.contact?.phone_e164 || '').includes(q) ||
      (opp.order_number?.toString() || '').includes(q) ||
      (opp.shipping_carrier_name || '').toLowerCase().includes(q)
    )
  })

  // Filtrar Pedidos Operacionais (Nome, Número, Veículo, Transportadora, Telefone)
  const filteredOrders = orders.filter((ord) => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    return (
      (ord.contact?.full_name || '').toLowerCase().includes(q) ||
      (ord.order_number?.toString() || '').includes(q) ||
      (ord.shipping_carrier_name || '').toLowerCase().includes(q) ||
      (ord.contact?.phone_e164 || '').includes(q) ||
      (getOrderVehicleModel(ord) || '').toLowerCase().includes(q)
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

  // Solicitar confirmação de mudança de etapa / status
  const requestChangeOpportunityStage = (opp: Opportunity, targetStage: OpportunityStage) => {
    const fromStageId = normalizeOppStage(opp.stage)
    if (fromStageId === targetStage) return

    const fromStageCfg = SALES_STAGES.find((s) => s.id === fromStageId)
    const toStageCfg = SALES_STAGES.find((s) => s.id === targetStage)

    setPendingStageChange({
      type: 'opportunity',
      id: opp.id,
      code: formatOrderCode(opp.order_number),
      clientName: opp.contact?.full_name || 'Lead',
      fromStageId,
      fromStageTitle: fromStageCfg?.title || fromStageId,
      toStageId: targetStage,
      toStageTitle: toStageCfg?.title || targetStage,
      toColor: toStageCfg?.stripeColor || '#EA580C',
    })
  }

  const requestChangeOrderStatus = (ord: Order, targetStatus: OrderStatus) => {
    const fromStatusId = normalizeOrdStatus(ord.status)
    if (fromStatusId === targetStatus) return

    const fromStatusCfg = ORDER_STAGES.find((s) => s.id === fromStatusId)
    const toStatusCfg = ORDER_STAGES.find((s) => s.id === targetStatus)
    const linkedOpp = ord.opportunity || opportunities.find((o) => o.id === ord.opportunity_id || o.order_number === ord.order_number)

    setPendingStageChange({
      type: 'order',
      id: ord.id,
      code: formatOrderCode(ord.order_number),
      clientName: ord.contact?.full_name || linkedOpp?.contact?.full_name || 'Cliente',
      fromStageId: fromStatusId,
      fromStageTitle: fromStatusCfg?.title || fromStatusId,
      toStageId: targetStatus,
      toStageTitle: toStatusCfg?.title || targetStatus,
      toColor: toStatusCfg?.stripeColor || '#EA580C',
    })
  }

  const handleDropOpportunity = (e: React.DragEvent, targetStage: OpportunityStage) => {
    e.preventDefault()
    const oppId = e.dataTransfer.getData('text/plain') || draggedItemId
    if (oppId) {
      const targetOpp = opportunities.find((o) => o.id === oppId)
      if (targetOpp) {
        requestChangeOpportunityStage(targetOpp, targetStage)
      }
    }
    setDraggedItemId(null)
    setDragOverStageId(null)
  }

  const handleDropOrder = (e: React.DragEvent, targetStage: OrderStatus) => {
    e.preventDefault()
    const ordId = e.dataTransfer.getData('text/plain') || draggedItemId
    if (ordId) {
      const targetOrd = orders.find((o) => o.id === ordId)
      if (targetOrd) {
        requestChangeOrderStatus(targetOrd, targetStage)
      }
    }
    setDraggedItemId(null)
    setDragOverStageId(null)
  }

  const handleConfirmStageChange = () => {
    if (!pendingStageChange) return

    if (pendingStageChange.type === 'opportunity') {
      onMoveStage?.(pendingStageChange.id, pendingStageChange.toStageId as OpportunityStage)
    } else if (pendingStageChange.type === 'order') {
      onUpdateOrderStatus?.(pendingStageChange.id, pendingStageChange.toStageId as OrderStatus)
    }

    setPendingStageChange(null)
  }

  const handleCancelStageChange = () => {
    setPendingStageChange(null)
  }

  const openOrderDetails = (ord: Order) => {
    if (!onSelectOpportunity) return
    const linkedOpp =
      ord.opportunity ||
      opportunities.find((o) => o.id === ord.opportunity_id || o.order_number === ord.order_number)
    if (linkedOpp) {
      onSelectOpportunity(linkedOpp)
      return
    }
    const vehicle = getVehicleModelInfo(getOrderVehicleModel(ord))
    const ordTotal = getOrderTotal(ord)
    onSelectOpportunity({
      id: ord.opportunity_id || `opp-${ord.id}`,
      order_number: ord.order_number,
      assigned_to: ord.assigned_to || 'Igor',
      contact_id: ord.contact_id,
      contact: ord.contact,
      instagram_url: ord.instagram_url || ord.contact?.instagram_url,
      facebook_url: ord.facebook_url || ord.contact?.facebook_url,
      website_url: ord.website_url || ord.contact?.website_url,
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
      attachments: ord.attachments,
      created_at: ord.created_at,
      updated_at: ord.created_at,
    })
  }

  const getFulfillmentLabel = (type?: string) => {
    switch (type) {
      case 'instalacao_loja': return 'Instalação na Loja'
      case 'retirada_loja': return 'Retirada na Loja'
      case 'envio_transportadora': return 'Transportadora'
      default: return 'A definir'
    }
  }

  // Opções para filtros de coluna (Funil de Vendas)
  const salesVehicleOptions = useMemo<ColumnFilterOption[]>(() => {
    const counts: Record<string, number> = {}
    filteredOpportunities.forEach((opp) => {
      const vModel = getVehicleModelInfo(opp.vehicle?.model || opp.vehicle_model_year).modelName
      counts[vModel] = (counts[vModel] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([modelName, count]) => ({
        value: modelName,
        label: modelName,
        count,
      }))
  }, [filteredOpportunities])

  const salesOriginOptions = useMemo<ColumnFilterOption[]>(() => {
    const counts: Record<string, number> = {}
    filteredOpportunities.forEach((opp) => {
      const orig = opp.contact?.origin || 'outros'
      counts[orig] = (counts[orig] || 0) + 1
    })
    return Object.entries(counts).map(([orig, count]) => {
      const badge = getOriginBadge(orig)
      const Icon = badge.Icon
      return {
        value: orig,
        label: badge.label,
        count,
        icon: <Icon className={`w-3 h-3 ${badge.iconColor}`} />,
      }
    })
  }, [filteredOpportunities])

  const salesStageOptions = useMemo<ColumnFilterOption[]>(() => {
    const counts: Record<string, number> = {}
    filteredOpportunities.forEach((opp) => {
      const st = normalizeOppStage(opp.stage)
      counts[st] = (counts[st] || 0) + 1
    })
    return SALES_STAGES.map((st) => ({
      value: st.id,
      label: st.title,
      count: counts[st.id] || 0,
      icon: <st.Icon className="w-3 h-3" style={{ color: st.stripeColor }} />,
    })).filter((o) => o.count > 0)
  }, [filteredOpportunities])

  const salesResponsibleOptions = useMemo<ColumnFilterOption[]>(() => {
    const counts: Record<string, number> = {}
    filteredOpportunities.forEach((opp) => {
      const resp = opp.assigned_to || 'Não atribuído'
      counts[resp] = (counts[resp] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({
      value: name,
      label: name,
      count,
      icon: <FaUser className="w-3 h-3 text-slate-400" />,
    }))
  }, [filteredOpportunities])

  // Opções para filtros de coluna (Funil de Pedidos)
  const ordersVehicleOptions = useMemo<ColumnFilterOption[]>(() => {
    const counts: Record<string, number> = {}
    filteredOrders.forEach((ord) => {
      const vModel = getVehicleModelInfo(getOrderVehicleModel(ord)).modelName
      counts[vModel] = (counts[vModel] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([modelName, count]) => ({
        value: modelName,
        label: modelName,
        count,
      }))
  }, [filteredOrders])

  const ordersOriginOptions = useMemo<ColumnFilterOption[]>(() => {
    const counts: Record<string, number> = {}
    filteredOrders.forEach((ord) => {
      const linkedOpp = ord.opportunity || opportunities.find((o) => o.id === ord.opportunity_id || o.order_number === ord.order_number)
      const orig = ord.contact?.origin || linkedOpp?.contact?.origin || 'outros'
      counts[orig] = (counts[orig] || 0) + 1
    })
    return Object.entries(counts).map(([orig, count]) => {
      const badge = getOriginBadge(orig)
      const Icon = badge.Icon
      return {
        value: orig,
        label: badge.label,
        count,
        icon: <Icon className={`w-3 h-3 ${badge.iconColor}`} />,
      }
    })
  }, [filteredOrders, opportunities])

  const ordersFulfillmentOptions = useMemo<ColumnFilterOption[]>(() => {
    const counts: Record<string, number> = {}
    filteredOrders.forEach((ord) => {
      const ful = ord.fulfillment_type || 'outro'
      counts[ful] = (counts[ful] || 0) + 1
    })
    return Object.entries(counts).map(([type, count]) => ({
      value: type,
      label: getFulfillmentLabel(type),
      count,
    }))
  }, [filteredOrders])

  const ordersStageOptions = useMemo<ColumnFilterOption[]>(() => {
    const counts: Record<string, number> = {}
    filteredOrders.forEach((ord) => {
      const st = normalizeOrdStatus(ord.status)
      counts[st] = (counts[st] || 0) + 1
    })
    return ORDER_STAGES.map((st) => ({
      value: st.id,
      label: st.title,
      count: counts[st.id] || 0,
      icon: <st.Icon className="w-3 h-3" style={{ color: st.stripeColor }} />,
    })).filter((o) => o.count > 0)
  }, [filteredOrders])

  const ordersResponsibleOptions = useMemo<ColumnFilterOption[]>(() => {
    const counts: Record<string, number> = {}
    filteredOrders.forEach((ord) => {
      const linkedOpp = ord.opportunity || opportunities.find((o) => o.id === ord.opportunity_id || o.order_number === ord.order_number)
      const resp = ord.assigned_to || linkedOpp?.assigned_to || 'Não atribuído'
      counts[resp] = (counts[resp] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({
      value: name,
      label: name,
      count,
      icon: <FaUser className="w-3 h-3 text-slate-400" />,
    }))
  }, [filteredOrders, opportunities])

  // Limpeza de todos os filtros de Vendas
  const clearAllSalesFilters = () => {
    setSalesColumnFilters({
      vehicles: [],
      origins: [],
      stages: [],
      responsibles: []
    })
    setStageFilter('all')
  }

  // Limpeza de todos os filtros de Pedidos
  const clearAllOrdersFilters = () => {
    setOrdersColumnFilters({
      vehicles: [],
      origins: [],
      fulfillments: [],
      stages: [],
      responsibles: []
    })
    setStageFilter('all')
  }

  // Filtragem composta para a Lista de Vendas
  const listOpportunities = filteredOpportunities.filter((opp) => {
    if (stageFilter !== 'all' && normalizeOppStage(opp.stage) !== stageFilter) {
      return false
    }
    if (salesColumnFilters.vehicles.length > 0) {
      const vModel = getVehicleModelInfo(opp.vehicle?.model || opp.vehicle_model_year).modelName
      if (!salesColumnFilters.vehicles.includes(vModel)) return false
    }
    if (salesColumnFilters.origins.length > 0) {
      const orig = opp.contact?.origin || 'outros'
      if (!salesColumnFilters.origins.includes(orig)) return false
    }
    if (salesColumnFilters.stages.length > 0) {
      const st = normalizeOppStage(opp.stage)
      if (!salesColumnFilters.stages.includes(st)) return false
    }
    if (salesColumnFilters.responsibles.length > 0) {
      const resp = opp.assigned_to || 'Não atribuído'
      if (!salesColumnFilters.responsibles.includes(resp)) return false
    }
    return true
  })

  // Filtragem composta para a Lista de Pedidos
  const listOrders = filteredOrders.filter((ord) => {
    const linkedOpp = ord.opportunity || opportunities.find((o) => o.id === ord.opportunity_id || o.order_number === ord.order_number)
    if (stageFilter !== 'all' && normalizeOrdStatus(ord.status) !== stageFilter) {
      return false
    }
    if (ordersColumnFilters.vehicles.length > 0) {
      const vModel = getVehicleModelInfo(getOrderVehicleModel(ord)).modelName
      if (!ordersColumnFilters.vehicles.includes(vModel)) return false
    }
    if (ordersColumnFilters.origins.length > 0) {
      const orig = ord.contact?.origin || linkedOpp?.contact?.origin || 'outros'
      if (!ordersColumnFilters.origins.includes(orig)) return false
    }
    if (ordersColumnFilters.fulfillments.length > 0) {
      const ful = ord.fulfillment_type || 'outro'
      if (!ordersColumnFilters.fulfillments.includes(ful)) return false
    }
    if (ordersColumnFilters.stages.length > 0) {
      const st = normalizeOrdStatus(ord.status)
      if (!ordersColumnFilters.stages.includes(st)) return false
    }
    if (ordersColumnFilters.responsibles.length > 0) {
      const resp = ord.assigned_to || linkedOpp?.assigned_to || 'Não atribuído'
      if (!ordersColumnFilters.responsibles.includes(resp)) return false
    }
    return true
  })

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3">
      {/* Top Header & Controles (Kanban / Lista, Densidade, Busca e Botão Novo Orçamento) */}
      <div className="bg-white rounded-2xl p-2.5 sm:px-4 sm:py-2.5 border border-slate-200/90 shadow-2xs shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Lado Esquerdo: Alternador de Visualização: Kanban vs Lista */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              title="Visualização em Kanban (Colunas)"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#EA580C] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="Visualização em Lista (Tabela)"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#EA580C] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Lista</span>
            </button>
          </div>
        </div>

        {/* Lado Direito: Busca e Botão Nova Oportunidade (Apenas em Vendas) - alinhados inline sem quebra */}
        <div className="flex items-center gap-2 justify-end">
          {/* Busca em Tempo Real com Botão Limpar */}
          <div className="relative w-48 sm:w-64 md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={pipelineType === 'vendas' ? 'Buscar cliente ou veículo...' : 'Buscar pedido ou transportadora...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                title="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botão Nova Oportunidade: exibido APENAS no Funil de Vendas conforme solicitado */}
          {pipelineType === 'vendas' && onOpenNewBudget && (
            <button
              onClick={onOpenNewBudget}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer shrink-0 outline-none whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Nova Oportunidade</span>
              <span className="sm:hidden">Novo</span>
            </button>
          )}
        </div>
      </div>

      {/* 1A. FUNIL DE VENDAS — MODO KANBAN (8 Etapas com scroll vertical interno por container de etapa) */}
      {pipelineType === 'vendas' && viewMode === 'kanban' && (
        <div className="flex-1 flex gap-3 overflow-x-auto pb-2 kanban-scroll items-stretch min-h-0">
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
                className={`w-[290px] flex-shrink-0 bg-slate-100/90 rounded-2xl border border-slate-200/90 flex flex-col h-full max-h-full min-h-0 shadow-2xs transition-all duration-200 overflow-hidden ${
                  isDragTarget ? 'bg-slate-200/70 ring-2 ring-slate-300/80 shadow-inner' : ''
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
                      <col.Icon 
                        className="w-3.5 h-3.5 shrink-0" 
                        style={{ color: col.stripeColor }}
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
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1 min-h-0 kanban-col-scroll">
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
                      const originBadge = getOriginBadge(opp.contact?.origin)
                      const OriginIcon = originBadge.Icon
                      const pendingTasks = (opp.tasks || []).filter((t) => !t.completed)
                      const hasComments = (opp.comments || []).length > 0

                      return (
                        <div
                          key={opp.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, opp.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onSelectOpportunity?.(opp)}
                          className={`bg-white rounded-xl border border-slate-200/90 hover:border-[#EA580C] shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer active:cursor-grabbing group select-none ${
                            density === 'compact' ? 'p-2.5 space-y-2' : 'p-3.5 space-y-2.5'
                          } ${
                            draggedItemId === opp.id ? 'opacity-30 scale-95 -rotate-1 shadow-2xl ring-2 ring-orange-500/20' : 'hover:-translate-y-0.5'
                          }`}
                        >
                          {density === 'compact' ? (
                            /* Layout Compacto (Alta Densidade) */
                            <>
                              {/* Linha 1: Headline #00000 + Badge Origem */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-bold text-[10px] text-slate-800 tracking-tight">
                                  {formatOrderCode(opp.order_number)}
                                </span>
                                <span 
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 shadow-2xs ${originBadge.bgClasses}`}
                                  title={getOriginTitle(opp.contact?.origin)}
                                >
                                  <OriginIcon className={`w-2.5 h-2.5 ${originBadge.iconColor} shrink-0`} />
                                  <span className="truncate max-w-[80px]">{originBadge.label}</span>
                                </span>
                              </div>

                              {/* Linha 2: Veículo (Pill Preto) + Valor Verde */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900 text-white flex items-center gap-1 shadow-2xs">
                                  {renderVehicleIcon(vehicle.iconType)}
                                  <span className="truncate max-w-[90px]">{vehicle.modelName}</span>
                                </span>
                                <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300">
                                  {formatCurrency(opp.final_total)}
                                </span>
                              </div>

                              {/* Linha 3: Nome do Cliente */}
                              <h4 
                                className="font-heading font-bold text-xs text-slate-900 group-hover:text-[#EA580C] transition-colors truncate"
                                title={opp.contact?.full_name || 'Cliente'}
                              >
                                {opp.contact?.full_name || 'Cliente'}
                              </h4>

                              {/* Lembretes e Comentários Compactos */}
                              {(pendingTasks.length > 0 || hasComments) && (
                                <div className="flex items-center justify-between gap-1 text-[9px]">
                                  {pendingTasks.length > 0 ? (() => {
                                    const today = new Date().toISOString().split('T')[0]
                                    const overdue = pendingTasks.find((t) => Boolean(t.due_date && t.due_date < today))
                                    const todayTask = pendingTasks.find((t) => Boolean(t.due_date && t.due_date === today))
                                    const targetTask = overdue || todayTask || pendingTasks[0]

                                    if (overdue) {
                                      return (
                                        <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded flex items-center gap-1 truncate max-w-[150px]">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                                          <span className="truncate">⚠️ {targetTask.title}</span>
                                        </span>
                                      )
                                    }
                                    if (todayTask) {
                                      return (
                                        <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded flex items-center gap-1 truncate max-w-[150px]">
                                          <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                          <span className="truncate">Hoje {targetTask.due_time}</span>
                                        </span>
                                      )
                                    }
                                    return (
                                      <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded flex items-center gap-1 truncate max-w-[150px]">
                                        <Calendar className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                        <span className="truncate">{targetTask.due_date}</span>
                                      </span>
                                    )
                                  })() : <div />}

                                  {hasComments && (
                                    <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1 py-0.2 rounded flex items-center gap-0.5 shrink-0" title={`${opp.comments?.length} observação(ões)`}>
                                      <MessageSquare className="w-2.5 h-2.5 text-slate-400" />
                                      <span>{opp.comments?.length}</span>
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Linha 4: Doca Social Compacta + Ações */}
                              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                                {renderSocialDock({
                                  phone: opp.contact?.phone_e164,
                                  instagram: opp.instagram_url || opp.contact?.instagram_url || opp.contact?.instagram_handle,
                                  facebook: opp.facebook_url || opp.contact?.facebook_url,
                                  website: opp.website_url || opp.contact?.website_url,
                                  clientName: opp.contact?.full_name,
                                  isCompact: true
                                })}

                                <div className="flex items-center gap-1">
                                  {canMovePrev && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        requestChangeOpportunityStage(opp, SALES_STAGES[colIdx - 1].id)
                                      }}
                                      title="Voltar etapa" 
                                      className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                    >
                                      <ArrowLeft className="w-3 h-3" />
                                    </button>
                                  )}

                                  {isWonStage ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onConvertToOrder && onConvertToOrder(opp)
                                      }}
                                      className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      <span>Pedido</span>
                                    </button>
                                  ) : canMoveNext ? (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        requestChangeOpportunityStage(opp, SALES_STAGES[colIdx + 1].id)
                                      }}
                                      title="Avançar etapa" 
                                      className="p-1 bg-orange-50 hover:bg-[#EA580C] text-[#EA580C] hover:text-white rounded transition-colors cursor-pointer"
                                    >
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </>
                          ) : (
                            /* Layout Detalhado (Padrão Completo) */
                            <>
                              {/* Linha 1: Headline #00000 no topo à esquerda + Badge completo de Origem no topo à direita */}
                              <div className="flex items-center justify-between gap-1.5 pb-0.5">
                                <span className="font-mono font-bold text-xs text-slate-800 tracking-tight">
                                  {formatOrderCode(opp.order_number)}
                                </span>
                                <span 
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 shadow-2xs ${originBadge.bgClasses}`}
                                  title={getOriginTitle(opp.contact?.origin)}
                                >
                                  <OriginIcon className={`w-3 h-3 ${originBadge.iconColor} shrink-0`} />
                                  <span className="truncate max-w-[110px]">{originBadge.label}</span>
                                </span>
                              </div>

                              {/* Linha 2: Modelo do Veículo em destaque (Pill Preto) + Responsável (Sem badge, com ícone Font Awesome) */}
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white flex items-center gap-1.5 shadow-2xs">
                                  {renderVehicleIcon(vehicle.iconType)}
                                  <span className="truncate max-w-[120px]">{vehicle.modelName}</span>
                                </span>

                                {renderResponsibleInfo(opp.assigned_to)}
                              </div>

                              {/* Linha 3: Nome do Cliente */}
                              <div>
                                <h4 
                                  className="font-heading font-bold text-xs text-slate-900 group-hover:text-[#EA580C] transition-colors leading-snug line-clamp-2"
                                  title={opp.contact?.full_name || 'Cliente'}
                                >
                                  {opp.contact?.full_name || 'Cliente Sem Nome'}
                                </h4>
                              </div>

                              {/* Linha 4: Caixa de Descrição do Produto & Especificações */}
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] space-y-0.5">
                                <p className="font-medium text-slate-800 truncate">
                                  Bagageiro {vehicle.modelName} Modelo EXTREME
                                </p>
                                <div className="flex items-center justify-between text-[10px] text-slate-500">
                                  <span>
                                    {opp.fulfillment_type === 'instalacao_loja' 
                                      ? 'Instalação na Loja' 
                                      : 'Entrega Transportadora'}
                                  </span>
                                  <span className="font-mono">Preto Epóxi</span>
                                </div>
                              </div>

                              {/* Linha 5: Badge do Preço em destaque verde (substituindo Cotação Igor e Nota Fiscal) */}
                              <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[11px] font-semibold text-slate-500">Valor Total:</span>
                                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                                  {formatCurrency(opp.final_total)}
                                </span>
                              </div>

                              {/* Linha de Lembretes / Tarefas e Observações */}
                              {(pendingTasks.length > 0 || hasComments) && (
                                <div className="flex items-center justify-between gap-1 text-[10px] pt-1 border-t border-slate-100/70">
                                  {pendingTasks.length > 0 ? (() => {
                                    const today = new Date().toISOString().split('T')[0]
                                    const overdue = pendingTasks.find((t) => Boolean(t.due_date && t.due_date < today))
                                    const todayTask = pendingTasks.find((t) => Boolean(t.due_date && t.due_date === today))
                                    const targetTask = overdue || todayTask || pendingTasks[0]

                                    if (overdue) {
                                      return (
                                        <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1.5 truncate max-w-[200px]" title={`Tarefa atrasada: ${targetTask.title}`}>
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                                          <span className="truncate">⚠️ {targetTask.title}</span>
                                        </span>
                                      )
                                    }
                                    if (todayTask) {
                                      return (
                                        <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1.5 truncate max-w-[200px]" title={`Lembrete para hoje às ${targetTask.due_time}: ${targetTask.title}`}>
                                          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                          <span className="truncate">Hoje {targetTask.due_time}: {targetTask.title}</span>
                                        </span>
                                      )
                                    }
                                    return (
                                      <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1.5 truncate max-w-[200px]" title={`Lembrete para ${targetTask.due_date}: ${targetTask.title}`}>
                                        <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                                        <span className="truncate">{targetTask.due_date}: {targetTask.title}</span>
                                      </span>
                                    )
                                  })() : <div />}

                                  {hasComments && (
                                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0" title={`${opp.comments?.length} observação(ões) registrada(s)`}>
                                      <MessageSquare className="w-3 h-3 text-slate-400" />
                                      <span>{opp.comments?.length}</span>
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Linha 6: Rodapé com Doca de Redes Sociais + Ações de Avanço de Etapa (Sem botão Detalhes) */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                {renderSocialDock({
                                  phone: opp.contact?.phone_e164,
                                  instagram: opp.instagram_url || opp.contact?.instagram_url || opp.contact?.instagram_handle,
                                  facebook: opp.facebook_url || opp.contact?.facebook_url,
                                  website: opp.website_url || opp.contact?.website_url,
                                  clientName: opp.contact?.full_name,
                                })}

                                <div className="flex items-center gap-1">
                                  {canMovePrev && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        requestChangeOpportunityStage(opp, SALES_STAGES[colIdx - 1].id)
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
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Gerar Pedido</span>
                                    </button>
                                  ) : canMoveNext ? (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        requestChangeOpportunityStage(opp, SALES_STAGES[colIdx + 1].id)
                                      }}
                                      title="Avançar etapa" 
                                      className="p-1 bg-orange-50 hover:bg-[#EA580C] text-[#EA580C] hover:text-white rounded-lg transition-colors cursor-pointer"
                                    >
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </>
                          )}
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

      {/* 1B. FUNIL DE VENDAS — MODO LISTA (Tabela com filtros estilo Excel e troca rápida de etapa) */}
      {pipelineType === 'vendas' && viewMode === 'list' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
          {/* Filtro rápido por Etapa + Resumo Financeiro */}
          <div className="bg-white rounded-2xl p-2 sm:px-3 border border-slate-200/90 shadow-2xs shrink-0 flex items-center justify-between gap-3 overflow-x-auto kanban-scroll">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setStageFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  stageFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <span>Todas</span>
                <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${stageFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
                  {filteredOpportunities.length}
                </span>
              </button>

              {SALES_STAGES.map((st) => {
                const count = filteredOpportunities.filter((o) => normalizeOppStage(o.stage) === st.id).length
                const isSelected = stageFilter === st.id
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStageFilter(st.id)}
                    style={isSelected ? { backgroundColor: st.stripeColor, borderColor: st.stripeColor } : undefined}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'text-white shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                    }`}
                  >
                    <st.Icon
                      className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : ''}`}
                      style={!isSelected ? { color: st.stripeColor } : undefined}
                    />
                    <span className="whitespace-nowrap">{st.title}</span>
                    <span className={`font-mono text-[10px] px-1.5 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-slate-700'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="hidden xl:flex items-center gap-2 shrink-0 pl-3 border-l border-slate-200 text-xs font-mono">
              <span className="text-slate-400">Total exibido:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                {formatCurrency(listOpportunities.reduce((sum, o) => sum + (o.final_total || 0), 0))}
              </span>
            </div>
          </div>

          {/* Barra de Filtros Ativos com Botão de Limpar Todos os Filtros */}
          {(salesColumnFilters.vehicles.length > 0 ||
            salesColumnFilters.origins.length > 0 ||
            salesColumnFilters.stages.length > 0 ||
            salesColumnFilters.responsibles.length > 0 ||
            stageFilter !== 'all') && (
            <div className="bg-white rounded-xl px-3 py-2 border border-slate-200/90 shadow-2xs flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Filtros ativos:
              </span>

              {stageFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[#EA580C]">
                  <span>Etapa: {SALES_STAGES.find((s) => s.id === stageFilter)?.title}</span>
                  <button
                    type="button"
                    onClick={() => setStageFilter('all')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {salesColumnFilters.origins.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  <span>Canal: {salesColumnFilters.origins.map((o) => getOriginBadge(o).label).join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => setSalesColumnFilters((prev) => ({ ...prev, origins: [] }))}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {salesColumnFilters.vehicles.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  <span>Veículo: {salesColumnFilters.vehicles.join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => setSalesColumnFilters((prev) => ({ ...prev, vehicles: [] }))}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {salesColumnFilters.stages.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  <span>Etapa: {salesColumnFilters.stages.map((st) => SALES_STAGES.find((s) => s.id === st)?.title).join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => setSalesColumnFilters((prev) => ({ ...prev, stages: [] }))}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {salesColumnFilters.responsibles.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  <span>Responsável: {salesColumnFilters.responsibles.join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => setSalesColumnFilters((prev) => ({ ...prev, responsibles: [] }))}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={clearAllSalesFilters}
                className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar todos os filtros</span>
              </button>
            </div>
          )}

          {/* Tabela de Oportunidades com Scroll Interno */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="overflow-auto flex-1 min-h-0 kanban-col-scroll">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur border-b border-slate-200/90">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 w-24">Código</th>

                    {/* Cliente & Canal com filtro estilo Excel */}
                    <th className="py-3 px-3 relative">
                      <div className="flex items-center gap-1.5">
                        <span>Cliente & Canal</span>
                        <button
                          type="button"
                          data-filter-trigger
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveFilterDropdown((c) => (c === 'vendas-origin' ? null : 'vendas-origin'))
                          }}
                          title="Filtrar por Canal"
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            salesColumnFilters.origins.length > 0
                              ? 'bg-orange-100 text-[#EA580C] ring-1 ring-orange-400 font-bold'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      <ColumnFilterDropdown
                        title="Filtrar por Canal"
                        isOpen={activeFilterDropdown === 'vendas-origin'}
                        onClose={() => setActiveFilterDropdown(null)}
                        options={salesOriginOptions}
                        selectedValues={salesColumnFilters.origins}
                        onToggleValue={(val) =>
                          setSalesColumnFilters((prev) => ({
                            ...prev,
                            origins: prev.origins.includes(val)
                              ? prev.origins.filter((v) => v !== val)
                              : [...prev.origins, val],
                          }))
                        }
                        onSelectAll={() =>
                          setSalesColumnFilters((prev) => ({
                            ...prev,
                            origins: salesOriginOptions.map((o) => o.value),
                          }))
                        }
                        onClearSelection={() =>
                          setSalesColumnFilters((prev) => ({ ...prev, origins: [] }))
                        }
                      />
                    </th>

                    {/* Veículo com filtro estilo Excel */}
                    <th className="py-3 px-3 w-40 relative">
                      <div className="flex items-center gap-1.5">
                        <span>Veículo</span>
                        <button
                          type="button"
                          data-filter-trigger
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveFilterDropdown((c) => (c === 'vendas-vehicle' ? null : 'vendas-vehicle'))
                          }}
                          title="Filtrar por Veículo"
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            salesColumnFilters.vehicles.length > 0
                              ? 'bg-orange-100 text-[#EA580C] ring-1 ring-orange-400 font-bold'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      <ColumnFilterDropdown
                        title="Filtrar por Veículo"
                        isOpen={activeFilterDropdown === 'vendas-vehicle'}
                        onClose={() => setActiveFilterDropdown(null)}
                        options={salesVehicleOptions}
                        selectedValues={salesColumnFilters.vehicles}
                        onToggleValue={(val) =>
                          setSalesColumnFilters((prev) => ({
                            ...prev,
                            vehicles: prev.vehicles.includes(val)
                              ? prev.vehicles.filter((v) => v !== val)
                              : [...prev.vehicles, val],
                          }))
                        }
                        onSelectAll={() =>
                          setSalesColumnFilters((prev) => ({
                            ...prev,
                            vehicles: salesVehicleOptions.map((o) => o.value),
                          }))
                        }
                        onClearSelection={() =>
                          setSalesColumnFilters((prev) => ({ ...prev, vehicles: [] }))
                        }
                      />
                    </th>

                    {/* Etapa do Funil com filtro estilo Excel */}
                    <th className="py-3 px-3 w-48 relative">
                      <div className="flex items-center gap-1.5">
                        <span>Etapa do Funil</span>
                        <button
                          type="button"
                          data-filter-trigger
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveFilterDropdown((c) => (c === 'vendas-stage' ? null : 'vendas-stage'))
                          }}
                          title="Filtrar por Etapa"
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            salesColumnFilters.stages.length > 0
                              ? 'bg-orange-100 text-[#EA580C] ring-1 ring-orange-400 font-bold'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      <ColumnFilterDropdown
                        title="Filtrar por Etapa"
                        isOpen={activeFilterDropdown === 'vendas-stage'}
                        onClose={() => setActiveFilterDropdown(null)}
                        options={salesStageOptions}
                        selectedValues={salesColumnFilters.stages}
                        onToggleValue={(val) =>
                          setSalesColumnFilters((prev) => ({
                            ...prev,
                            stages: prev.stages.includes(val)
                              ? prev.stages.filter((v) => v !== val)
                              : [...prev.stages, val],
                          }))
                        }
                        onSelectAll={() =>
                          setSalesColumnFilters((prev) => ({
                            ...prev,
                            stages: salesStageOptions.map((o) => o.value),
                          }))
                        }
                        onClearSelection={() =>
                          setSalesColumnFilters((prev) => ({ ...prev, stages: [] }))
                        }
                      />
                    </th>

                    {/* Responsável com filtro estilo Excel */}
                    <th className="py-3 px-3 w-36 relative">
                      <div className="flex items-center gap-1.5">
                        <span>Responsável</span>
                        <button
                          type="button"
                          data-filter-trigger
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveFilterDropdown((c) => (c === 'vendas-responsible' ? null : 'vendas-responsible'))
                          }}
                          title="Filtrar por Responsável"
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            salesColumnFilters.responsibles.length > 0
                              ? 'bg-orange-100 text-[#EA580C] ring-1 ring-orange-400 font-bold'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      <ColumnFilterDropdown
                        title="Filtrar por Responsável"
                        isOpen={activeFilterDropdown === 'vendas-responsible'}
                        onClose={() => setActiveFilterDropdown(null)}
                        options={salesResponsibleOptions}
                        selectedValues={salesColumnFilters.responsibles}
                        onToggleValue={(val) =>
                          setSalesColumnFilters((prev) => ({
                            ...prev,
                            responsibles: prev.responsibles.includes(val)
                              ? prev.responsibles.filter((v) => v !== val)
                              : [...prev.responsibles, val],
                          }))
                        }
                        onSelectAll={() =>
                          setSalesColumnFilters((prev) => ({
                            ...prev,
                            responsibles: salesResponsibleOptions.map((o) => o.value),
                          }))
                        }
                        onClearSelection={() =>
                          setSalesColumnFilters((prev) => ({ ...prev, responsibles: [] }))
                        }
                        alignRight
                      />
                    </th>

                    <th className="py-3 px-3 w-32 text-right">Valor</th>
                    <th className="py-3 px-4 w-28 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {listOpportunities.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400 font-medium">
                        Nenhuma oportunidade encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    listOpportunities.map((opp) => {
                      const normStage = normalizeOppStage(opp.stage)
                      const stageIdx = SALES_STAGES.findIndex((s) => s.id === normStage)
                      const stageCfg = SALES_STAGES[stageIdx] || SALES_STAGES[0]
                      const vehicle = getVehicleModelInfo(opp.vehicle?.model || opp.vehicle_model_year)
                      const originBadge = getOriginBadge(opp.contact?.origin)
                      const OriginIcon = originBadge.Icon
                      const isWonStage = normStage === 'venda_ganha'
                      const pendingTasks = (opp.tasks || []).filter((t) => !t.completed)

                      return (
                        <tr
                          key={opp.id}
                          onClick={() => onSelectOpportunity?.(opp)}
                          className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                        >
                          {/* Código */}
                          <td className="py-3 px-4 align-middle">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg text-[11px]">
                              {formatOrderCode(opp.order_number)}
                            </span>
                          </td>

                          {/* Cliente + Origem + Social */}
                          <td className="py-3 px-3 align-middle">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 group-hover:text-[#EA580C] transition-colors text-[13px]">
                                  {opp.contact?.full_name || 'Cliente sem nome'}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${originBadge.bgClasses}`}
                                  title={getOriginTitle(opp.contact?.origin)}
                                >
                                  <OriginIcon className={`w-2.5 h-2.5 ${originBadge.iconColor}`} />
                                  {originBadge.label}
                                </span>
                                {pendingTasks.length > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                                    title={`${pendingTasks.length} tarefa(s) pendente(s)`}
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    {pendingTasks.length}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {renderSocialDock({
                                  phone: opp.contact?.phone_e164,
                                  instagram: opp.instagram_url || opp.contact?.instagram_url,
                                  facebook: opp.facebook_url || opp.contact?.facebook_url,
                                  website: opp.website_url || opp.contact?.website_url,
                                  clientName: opp.contact?.full_name,
                                  isCompact: true,
                                })}
                              </div>
                            </div>
                          </td>

                          {/* Veículo */}
                          <td className="py-2.5 px-3 align-middle w-40">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[11px] font-bold shadow-2xs whitespace-nowrap">
                              {renderVehicleIcon(vehicle.iconType)}
                              <span>{vehicle.modelName}</span>
                            </span>
                          </td>

                          {/* Etapa Interativa com Ícone Font Awesome dentro do seletor */}
                          <td className="py-2.5 px-3 align-middle w-48" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-flex items-center">
                              <stageCfg.Icon
                                className="w-3.5 h-3.5 absolute left-2.5 pointer-events-none shrink-0"
                                style={{ color: stageCfg.stripeColor }}
                              />
                              <select
                                value={normStage}
                                onChange={(e) => requestChangeOpportunityStage(opp, e.target.value as OpportunityStage)}
                                aria-label="Alterar etapa da oportunidade"
                                className="w-[165px] pl-8 pr-6 py-1.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 focus:border-[#EA580C] rounded-lg text-[11px] font-bold text-slate-800 outline-none cursor-pointer transition-colors shadow-2xs"
                              >
                                {SALES_STAGES.map((st) => (
                                  <option key={st.id} value={st.id}>
                                    {st.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Responsável */}
                          <td className="py-2.5 px-3 align-middle w-36">
                            {renderResponsibleInfo(opp.assigned_to)}
                          </td>

                          {/* Valor */}
                          <td className="py-2.5 px-3 align-middle text-right w-32 whitespace-nowrap">
                            <span className="inline-block font-mono font-bold text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                              {formatCurrency(opp.final_total || 0)}
                            </span>
                          </td>

                          {/* Ações */}
                          <td className="py-2.5 px-4 align-middle text-right w-28 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {isWonStage && onConvertToOrder && (
                                <button
                                  type="button"
                                  onClick={() => onConvertToOrder(opp)}
                                  title="Gerar Pedido"
                                  className="px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Pedido</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onSelectOpportunity?.(opp)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#EA580C] text-slate-700 hover:text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>Abrir</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2A. FUNIL DE PEDIDOS — MODO KANBAN (Espelho fiel do Funil de Vendas com scroll interno por etapa) */}
      {pipelineType === 'pedidos' && viewMode === 'kanban' && (
        <div className="flex-1 flex gap-3 overflow-x-auto pb-2 kanban-scroll items-stretch min-h-0">
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
                className={`w-[290px] flex-shrink-0 bg-slate-100/90 rounded-2xl border border-slate-200/90 flex flex-col h-full max-h-full min-h-0 shadow-2xs transition-all duration-200 overflow-hidden ${
                  isDragTarget ? 'bg-slate-200/70 ring-2 ring-slate-300/80 shadow-inner' : ''
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
                      <col.Icon
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: col.stripeColor }}
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

                {/* Cards Container de Pedidos com Scroll Vertical Interno por Etapa */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1 min-h-0 kanban-col-scroll">
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
                      const originBadge = getOriginBadge(ord.contact?.origin || linkedOpp?.contact?.origin)
                      const OriginIcon = originBadge.Icon

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
                              instagram_url: ord.instagram_url || ord.contact?.instagram_url,
                              facebook_url: ord.facebook_url || ord.contact?.facebook_url,
                              website_url: ord.website_url || ord.contact?.website_url,
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
                              attachments: ord.attachments,
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
                          onClick={handleOpenOrderDetails}
                          className={`bg-white rounded-xl border border-slate-200/90 hover:border-[#EA580C] shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer active:cursor-grabbing group select-none ${
                            density === 'compact' ? 'p-2.5 space-y-2' : 'p-3.5 space-y-2.5'
                          } ${
                            draggedItemId === ord.id ? 'opacity-30 scale-95 -rotate-1 shadow-2xl ring-2 ring-orange-500/20' : 'hover:-translate-y-0.5'
                          }`}
                        >
                          {density === 'compact' ? (
                            /* Layout Compacto (Alta Densidade) */
                            <>
                              {/* Linha 1: Headline #00000 + Badge Origem */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-bold text-[10px] text-slate-800 tracking-tight">
                                  {formatOrderCode(ord.order_number)}
                                </span>
                                <span 
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 shadow-2xs ${originBadge.bgClasses}`}
                                  title={getOriginTitle(ord.contact?.origin || linkedOpp?.contact?.origin)}
                                >
                                  <OriginIcon className={`w-2.5 h-2.5 ${originBadge.iconColor} shrink-0`} />
                                  <span className="truncate max-w-[80px]">{originBadge.label}</span>
                                </span>
                              </div>

                              {/* Linha 2: Veículo (Pill Preto) + Valor Verde */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900 text-white flex items-center gap-1 shadow-2xs">
                                  {renderVehicleIcon(vehicle.iconType)}
                                  <span className="truncate max-w-[90px]">{vehicle.modelName}</span>
                                </span>
                                <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300">
                                  {formatCurrency(ordTotal)}
                                </span>
                              </div>

                              {/* Linha 3: Nome do Cliente */}
                              <h4 
                                className="font-heading font-bold text-xs text-slate-900 group-hover:text-[#EA580C] transition-colors truncate"
                                title={ord.contact?.full_name || linkedOpp?.contact?.full_name || 'Cliente'}
                              >
                                {ord.contact?.full_name || linkedOpp?.contact?.full_name || 'Cliente'}
                              </h4>

                              {/* Linha 4: Doca Social Compacta + Ações */}
                              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                                {renderSocialDock({
                                  phone: ord.contact?.phone_e164 || linkedOpp?.contact?.phone_e164,
                                  instagram: ord.instagram_url || ord.contact?.instagram_url || ord.contact?.instagram_handle || linkedOpp?.instagram_url || linkedOpp?.contact?.instagram_url,
                                  facebook: ord.facebook_url || ord.contact?.facebook_url || linkedOpp?.facebook_url || linkedOpp?.contact?.facebook_url,
                                  website: ord.website_url || ord.contact?.website_url || linkedOpp?.website_url || linkedOpp?.contact?.website_url,
                                  clientName: ord.contact?.full_name || linkedOpp?.contact?.full_name,
                                  isCompact: true
                                })}

                                <div className="flex items-center gap-1">
                                  {canMovePrev && onUpdateOrderStatus && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        requestChangeOrderStatus(ord, ORDER_STAGES[colIdx - 1].id)
                                      }}
                                      title="Voltar etapa" 
                                      className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                    >
                                      <ArrowLeft className="w-3 h-3" />
                                    </button>
                                  )}

                                  {canMoveNext && onUpdateOrderStatus && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        requestChangeOrderStatus(ord, ORDER_STAGES[colIdx + 1].id)
                                      }}
                                      title="Avançar etapa" 
                                      className="p-1 bg-orange-50 hover:bg-[#EA580C] text-[#EA580C] hover:text-white rounded transition-colors cursor-pointer"
                                    >
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            /* Layout Detalhado (Espelho Fiel do Card de Vendas) */
                            <>
                              {/* Linha 1: Headline #00000 no topo à esquerda + Badge completo de Origem no topo à direita */}
                              <div className="flex items-center justify-between gap-1.5 pb-0.5">
                                <span className="font-mono font-bold text-xs text-slate-800 tracking-tight">
                                  {formatOrderCode(ord.order_number)}
                                </span>
                                <span 
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 shadow-2xs ${originBadge.bgClasses}`}
                                  title={getOriginTitle(ord.contact?.origin || linkedOpp?.contact?.origin)}
                                >
                                  <OriginIcon className={`w-3 h-3 ${originBadge.iconColor} shrink-0`} />
                                  <span className="truncate max-w-[110px]">{originBadge.label}</span>
                                </span>
                              </div>

                              {/* Linha 2: Modelo do Veículo em destaque (Pill Preto) + Responsável (Sem badge, com ícone Font Awesome) */}
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white flex items-center gap-1.5 shadow-2xs">
                                  {renderVehicleIcon(vehicle.iconType)}
                                  <span className="truncate max-w-[120px]">{vehicle.modelName}</span>
                                </span>

                                {renderResponsibleInfo(ord.assigned_to || linkedOpp?.assigned_to || 'Igor')}
                              </div>

                              {/* Linha 3: Cliente */}
                              <div>
                                <h4 
                                  className="font-heading font-bold text-xs text-slate-900 group-hover:text-[#EA580C] transition-colors leading-snug line-clamp-2"
                                  title={ord.contact?.full_name || linkedOpp?.contact?.full_name || 'Cliente'}
                                >
                                  {ord.contact?.full_name || linkedOpp?.contact?.full_name || 'Cliente'}
                                </h4>
                              </div>

                              {/* Linha 4: Caixa de Descrição do Produto & Especificações */}
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] space-y-0.5">
                                <p className="font-medium text-slate-800 truncate">
                                  Bagageiro {vehicle.modelName} Modelo EXTREME
                                </p>
                                <div className="flex items-center justify-between text-[10px] text-slate-500">
                                  <span>
                                    {ord.fulfillment_type === 'instalacao_loja' 
                                      ? 'Instalação na Loja' 
                                      : 'Entrega Transportadora'}
                                  </span>
                                  <span className="font-mono">Preto Epóxi</span>
                                </div>
                              </div>

                              {/* Linha 5: Badge do Preço em destaque verde (substituindo Cotação Igor e Nota Fiscal) */}
                              <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[11px] font-semibold text-slate-500">Valor do Pedido:</span>
                                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                                  {formatCurrency(ordTotal)}
                                </span>
                              </div>

                              {/* Linha 6: Rodapé com Doca de Redes Sociais + Ações de Avanço de Etapa (Sem botão Detalhes) */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                {renderSocialDock({
                                  phone: ord.contact?.phone_e164 || linkedOpp?.contact?.phone_e164,
                                  instagram: ord.instagram_url || ord.contact?.instagram_url || ord.contact?.instagram_handle || linkedOpp?.instagram_url || linkedOpp?.contact?.instagram_url,
                                  facebook: ord.facebook_url || ord.contact?.facebook_url || linkedOpp?.facebook_url || linkedOpp?.contact?.facebook_url,
                                  website: ord.website_url || ord.contact?.website_url || linkedOpp?.website_url || linkedOpp?.contact?.website_url,
                                  clientName: ord.contact?.full_name || linkedOpp?.contact?.full_name,
                                })}

                                <div className="flex items-center gap-1">
                                  {canMovePrev && onUpdateOrderStatus && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        requestChangeOrderStatus(ord, ORDER_STAGES[colIdx - 1].id)
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
                                        requestChangeOrderStatus(ord, ORDER_STAGES[colIdx + 1].id)
                                      }}
                                      title="Avançar etapa" 
                                      className="p-1 bg-orange-50 hover:bg-[#EA580C] text-[#EA580C] hover:text-white rounded transition-colors cursor-pointer"
                                    >
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
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

      {/* 2B. FUNIL DE PEDIDOS — MODO LISTA (Tabela com filtro por etapa e troca/avanço rápido de status) */}
      {pipelineType === 'pedidos' && viewMode === 'list' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
          {/* Filtro rápido por Etapa de Pedido + Resumo Financeiro */}
          <div className="bg-white rounded-2xl p-2 sm:px-3 border border-slate-200/90 shadow-2xs shrink-0 flex items-center justify-between gap-3 overflow-x-auto kanban-scroll">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setStageFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  stageFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <span>Todos</span>
                <span className={`font-mono text-[10px] px-1.5 rounded-full ${stageFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
                  {filteredOrders.length}
                </span>
              </button>

              {ORDER_STAGES.map((st) => {
                const count = filteredOrders.filter((o) => normalizeOrdStatus(o.status) === st.id).length
                const isSelected = stageFilter === st.id
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStageFilter(st.id)}
                    style={isSelected ? { backgroundColor: st.stripeColor, borderColor: st.stripeColor } : undefined}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'text-white shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                    }`}
                  >
                    <st.Icon
                      className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : ''}`}
                      style={!isSelected ? { color: st.stripeColor } : undefined}
                    />
                    <span className="whitespace-nowrap">{st.title}</span>
                    <span className={`font-mono text-[10px] px-1.5 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-slate-700'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="hidden xl:flex items-center gap-2 shrink-0 pl-3 border-l border-slate-200 text-xs font-mono">
              <span className="text-slate-400">Total exibido:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                {formatCurrency(listOrders.reduce((sum, o) => sum + getOrderTotal(o), 0))}
              </span>
            </div>
          </div>

          {/* Barra de Filtros Ativos com Botão de Limpar Todos os Filtros */}
          {(ordersColumnFilters.vehicles.length > 0 ||
            ordersColumnFilters.origins.length > 0 ||
            ordersColumnFilters.fulfillments.length > 0 ||
            ordersColumnFilters.stages.length > 0 ||
            ordersColumnFilters.responsibles.length > 0 ||
            stageFilter !== 'all') && (
            <div className="bg-white rounded-xl px-3 py-2 border border-slate-200/90 shadow-2xs flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Filtros ativos:
              </span>

              {stageFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[#EA580C]">
                  <span>Etapa: {ORDER_STAGES.find((s) => s.id === stageFilter)?.title}</span>
                  <button
                    type="button"
                    onClick={() => setStageFilter('all')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {ordersColumnFilters.origins.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  <span>Canal: {ordersColumnFilters.origins.map((o) => getOriginBadge(o).label).join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => setOrdersColumnFilters((prev) => ({ ...prev, origins: [] }))}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {ordersColumnFilters.vehicles.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  <span>Veículo: {ordersColumnFilters.vehicles.join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => setOrdersColumnFilters((prev) => ({ ...prev, vehicles: [] }))}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {ordersColumnFilters.fulfillments.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  <span>Modalidade: {ordersColumnFilters.fulfillments.map((f) => getFulfillmentLabel(f)).join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => setOrdersColumnFilters((prev) => ({ ...prev, fulfillments: [] }))}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {ordersColumnFilters.stages.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  <span>Etapa: {ordersColumnFilters.stages.map((st) => ORDER_STAGES.find((s) => s.id === st)?.title || st).join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => setOrdersColumnFilters((prev) => ({ ...prev, stages: [] }))}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {ordersColumnFilters.responsibles.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  <span>Responsável: {ordersColumnFilters.responsibles.join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => setOrdersColumnFilters((prev) => ({ ...prev, responsibles: [] }))}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={clearAllOrdersFilters}
                className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar todos os filtros</span>
              </button>
            </div>
          )}

          {/* Tabela de Pedidos com Scroll Interno */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="overflow-auto flex-1 min-h-0 kanban-col-scroll">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur border-b border-slate-200/90">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 w-24">Pedido</th>

                    {/* Cliente & Canal com filtro estilo Excel */}
                    <th className="py-3 px-3 relative">
                      <div className="flex items-center gap-1.5">
                        <span>Cliente & Canal</span>
                        <button
                          type="button"
                          data-filter-trigger
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveFilterDropdown((c) => (c === 'pedidos-origin' ? null : 'pedidos-origin'))
                          }}
                          title="Filtrar por Canal"
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            ordersColumnFilters.origins.length > 0
                              ? 'bg-orange-100 text-[#EA580C] ring-1 ring-orange-400 font-bold'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      <ColumnFilterDropdown
                        title="Filtrar por Canal"
                        isOpen={activeFilterDropdown === 'pedidos-origin'}
                        onClose={() => setActiveFilterDropdown(null)}
                        options={ordersOriginOptions}
                        selectedValues={ordersColumnFilters.origins}
                        onToggleValue={(val) =>
                          setOrdersColumnFilters((prev) => ({
                            ...prev,
                            origins: prev.origins.includes(val)
                              ? prev.origins.filter((v) => v !== val)
                              : [...prev.origins, val],
                          }))
                        }
                        onSelectAll={() =>
                          setOrdersColumnFilters((prev) => ({
                            ...prev,
                            origins: ordersOriginOptions.map((o) => o.value),
                          }))
                        }
                        onClearSelection={() =>
                          setOrdersColumnFilters((prev) => ({ ...prev, origins: [] }))
                        }
                      />
                    </th>

                    {/* Veículo com filtro estilo Excel */}
                    <th className="py-3 px-3 w-40 relative">
                      <div className="flex items-center gap-1.5">
                        <span>Veículo</span>
                        <button
                          type="button"
                          data-filter-trigger
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveFilterDropdown((c) => (c === 'pedidos-vehicle' ? null : 'pedidos-vehicle'))
                          }}
                          title="Filtrar por Veículo"
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            ordersColumnFilters.vehicles.length > 0
                              ? 'bg-orange-100 text-[#EA580C] ring-1 ring-orange-400 font-bold'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      <ColumnFilterDropdown
                        title="Filtrar por Veículo"
                        isOpen={activeFilterDropdown === 'pedidos-vehicle'}
                        onClose={() => setActiveFilterDropdown(null)}
                        options={ordersVehicleOptions}
                        selectedValues={ordersColumnFilters.vehicles}
                        onToggleValue={(val) =>
                          setOrdersColumnFilters((prev) => ({
                            ...prev,
                            vehicles: prev.vehicles.includes(val)
                              ? prev.vehicles.filter((v) => v !== val)
                              : [...prev.vehicles, val],
                          }))
                        }
                        onSelectAll={() =>
                          setOrdersColumnFilters((prev) => ({
                            ...prev,
                            vehicles: ordersVehicleOptions.map((o) => o.value),
                          }))
                        }
                        onClearSelection={() =>
                          setOrdersColumnFilters((prev) => ({ ...prev, vehicles: [] }))
                        }
                      />
                    </th>

                    {/* Modalidade com filtro estilo Excel */}
                    <th className="py-3 px-3 w-40 relative">
                      <div className="flex items-center gap-1.5">
                        <span>Modalidade</span>
                        <button
                          type="button"
                          data-filter-trigger
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveFilterDropdown((c) => (c === 'pedidos-fulfillment' ? null : 'pedidos-fulfillment'))
                          }}
                          title="Filtrar por Modalidade"
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            ordersColumnFilters.fulfillments.length > 0
                              ? 'bg-orange-100 text-[#EA580C] ring-1 ring-orange-400 font-bold'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      <ColumnFilterDropdown
                        title="Filtrar por Modalidade"
                        isOpen={activeFilterDropdown === 'pedidos-fulfillment'}
                        onClose={() => setActiveFilterDropdown(null)}
                        options={ordersFulfillmentOptions}
                        selectedValues={ordersColumnFilters.fulfillments}
                        onToggleValue={(val) =>
                          setOrdersColumnFilters((prev) => ({
                            ...prev,
                            fulfillments: prev.fulfillments.includes(val)
                              ? prev.fulfillments.filter((v) => v !== val)
                              : [...prev.fulfillments, val],
                          }))
                        }
                        onSelectAll={() =>
                          setOrdersColumnFilters((prev) => ({
                            ...prev,
                            fulfillments: ordersFulfillmentOptions.map((o) => o.value),
                          }))
                        }
                        onClearSelection={() =>
                          setOrdersColumnFilters((prev) => ({ ...prev, fulfillments: [] }))
                        }
                      />
                    </th>

                    {/* Etapa do Pedido com filtro estilo Excel */}
                    <th className="py-3 px-3 w-48 relative">
                      <div className="flex items-center gap-1.5">
                        <span>Etapa do Pedido</span>
                        <button
                          type="button"
                          data-filter-trigger
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveFilterDropdown((c) => (c === 'pedidos-stage' ? null : 'pedidos-stage'))
                          }}
                          title="Filtrar por Etapa"
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            ordersColumnFilters.stages.length > 0
                              ? 'bg-orange-100 text-[#EA580C] ring-1 ring-orange-400 font-bold'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      <ColumnFilterDropdown
                        title="Filtrar por Etapa"
                        isOpen={activeFilterDropdown === 'pedidos-stage'}
                        onClose={() => setActiveFilterDropdown(null)}
                        options={ordersStageOptions}
                        selectedValues={ordersColumnFilters.stages}
                        onToggleValue={(val) =>
                          setOrdersColumnFilters((prev) => ({
                            ...prev,
                            stages: prev.stages.includes(val)
                              ? prev.stages.filter((v) => v !== val)
                              : [...prev.stages, val],
                          }))
                        }
                        onSelectAll={() =>
                          setOrdersColumnFilters((prev) => ({
                            ...prev,
                            stages: ordersStageOptions.map((o) => o.value),
                          }))
                        }
                        onClearSelection={() =>
                          setOrdersColumnFilters((prev) => ({ ...prev, stages: [] }))
                        }
                      />
                    </th>

                    {/* Responsável com filtro estilo Excel */}
                    <th className="py-3 px-3 w-36 relative">
                      <div className="flex items-center gap-1.5">
                        <span>Responsável</span>
                        <button
                          type="button"
                          data-filter-trigger
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveFilterDropdown((c) => (c === 'pedidos-responsible' ? null : 'pedidos-responsible'))
                          }}
                          title="Filtrar por Responsável"
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            ordersColumnFilters.responsibles.length > 0
                              ? 'bg-orange-100 text-[#EA580C] ring-1 ring-orange-400 font-bold'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      <ColumnFilterDropdown
                        title="Filtrar por Responsável"
                        isOpen={activeFilterDropdown === 'pedidos-responsible'}
                        onClose={() => setActiveFilterDropdown(null)}
                        options={ordersResponsibleOptions}
                        selectedValues={ordersColumnFilters.responsibles}
                        onToggleValue={(val) =>
                          setOrdersColumnFilters((prev) => ({
                            ...prev,
                            responsibles: prev.responsibles.includes(val)
                              ? prev.responsibles.filter((v) => v !== val)
                              : [...prev.responsibles, val],
                          }))
                        }
                        onSelectAll={() =>
                          setOrdersColumnFilters((prev) => ({
                            ...prev,
                            responsibles: ordersResponsibleOptions.map((o) => o.value),
                          }))
                        }
                        onClearSelection={() =>
                          setOrdersColumnFilters((prev) => ({ ...prev, responsibles: [] }))
                        }
                        alignRight
                      />
                    </th>

                    <th className="py-3 px-3 w-32 text-right">Valor</th>
                    <th className="py-3 px-4 w-28 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {listOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400 font-medium">
                        Nenhum pedido encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    listOrders.map((ord) => {
                      const linkedOpp = ord.opportunity || opportunities.find((o) => o.id === ord.opportunity_id || o.order_number === ord.order_number)
                      const normStatus = normalizeOrdStatus(ord.status)
                      const stageIdx = ORDER_STAGES.findIndex((s) => s.id === normStatus)
                      const stageCfg = ORDER_STAGES[stageIdx] || ORDER_STAGES[0]
                      const vehicle = getVehicleModelInfo(getOrderVehicleModel(ord))
                      const ordTotal = getOrderTotal(ord)
                      const originBadge = getOriginBadge(ord.contact?.origin || linkedOpp?.contact?.origin)
                      const OriginIcon = originBadge.Icon
                      const canAdvance = stageIdx >= 0 && stageIdx < ORDER_STAGES.length - 2
                      const scheduleDate = ord.installation_date || ord.pickup_date
                      const scheduleTime = ord.installation_time || ord.pickup_time

                      return (
                        <tr
                          key={ord.id}
                          onClick={() => openOrderDetails(ord)}
                          className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                        >
                          {/* Código */}
                          <td className="py-3 px-4 align-middle">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg text-[11px]">
                              {formatOrderCode(ord.order_number)}
                            </span>
                          </td>

                          {/* Cliente + Origem + Social */}
                          <td className="py-3 px-3 align-middle">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 group-hover:text-[#EA580C] transition-colors text-[13px]">
                                  {ord.contact?.full_name || linkedOpp?.contact?.full_name || 'Cliente'}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${originBadge.bgClasses}`}
                                  title={getOriginTitle(ord.contact?.origin || linkedOpp?.contact?.origin)}
                                >
                                  <OriginIcon className={`w-2.5 h-2.5 ${originBadge.iconColor}`} />
                                  {originBadge.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {renderSocialDock({
                                  phone: ord.contact?.phone_e164 || linkedOpp?.contact?.phone_e164,
                                  instagram: ord.instagram_url || ord.contact?.instagram_url || linkedOpp?.instagram_url || linkedOpp?.contact?.instagram_url,
                                  facebook: ord.facebook_url || ord.contact?.facebook_url || linkedOpp?.facebook_url || linkedOpp?.contact?.facebook_url,
                                  website: ord.website_url || ord.contact?.website_url || linkedOpp?.website_url || linkedOpp?.contact?.website_url,
                                  clientName: ord.contact?.full_name || linkedOpp?.contact?.full_name,
                                  isCompact: true,
                                })}
                              </div>
                            </div>
                          </td>

                          {/* Veículo */}
                          <td className="py-2.5 px-3 align-middle w-40">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[11px] font-bold shadow-2xs whitespace-nowrap">
                              {renderVehicleIcon(vehicle.iconType)}
                              <span>{vehicle.modelName}</span>
                            </span>
                          </td>

                          {/* Modalidade + Agendamento */}
                          <td className="py-2.5 px-3 align-middle w-40">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-700 text-[11px] whitespace-nowrap">
                                {getFulfillmentLabel(ord.fulfillment_type)}
                              </span>
                              {scheduleDate && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 whitespace-nowrap">
                                  <Calendar className="w-3 h-3 text-[#EA580C]" />
                                  {scheduleDate.split('-').reverse().join('/')}
                                  {scheduleTime ? ` às ${scheduleTime}` : ''}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Etapa do Pedido com Ícone Font Awesome dentro do seletor */}
                          <td className="py-2.5 px-3 align-middle w-48" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-flex items-center">
                              <stageCfg.Icon
                                className="w-3.5 h-3.5 absolute left-2.5 pointer-events-none shrink-0"
                                style={{ color: stageCfg.stripeColor }}
                              />
                              <select
                                value={normStatus}
                                disabled={!onUpdateOrderStatus}
                                onChange={(e) => requestChangeOrderStatus(ord, e.target.value as OrderStatus)}
                                aria-label="Alterar etapa do pedido"
                                className="w-[165px] pl-8 pr-6 py-1.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 focus:border-[#EA580C] rounded-lg text-[11px] font-bold text-slate-800 outline-none cursor-pointer transition-colors shadow-2xs disabled:opacity-60"
                              >
                                {ORDER_STAGES.map((st) => (
                                  <option key={st.id} value={st.id}>
                                    {st.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Responsável */}
                          <td className="py-2.5 px-3 align-middle w-36">
                            {renderResponsibleInfo(ord.assigned_to || linkedOpp?.assigned_to)}
                          </td>

                          {/* Valor */}
                          <td className="py-2.5 px-3 align-middle text-right w-32 whitespace-nowrap">
                            <span className="inline-block font-mono font-bold text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                              {formatCurrency(ordTotal)}
                            </span>
                          </td>

                          {/* Ações */}
                          <td className="py-2.5 px-4 align-middle text-right w-28 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => openOrderDetails(ord)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#EA580C] text-slate-700 hover:text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>Abrir</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR MUDANÇA DE ETAPA (Vendas e Pedidos) */}
      <CustomAlertModal
        isOpen={!!pendingStageChange}
        onClose={handleCancelStageChange}
        type="warning"
        title={
          pendingStageChange?.type === 'opportunity'
            ? 'Confirmar Mudança de Etapa da Oportunidade'
            : 'Confirmar Mudança de Etapa do Pedido'
        }
        message={
          pendingStageChange ? (
            <div className="space-y-3">
              <p className="text-slate-600 text-sm">
                Deseja alterar a etapa de{' '}
                <strong className="text-slate-900 font-bold">
                  {pendingStageChange.code} — {pendingStageChange.clientName}
                </strong>{' '}
                de:
              </p>
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="font-bold text-slate-700 text-xs px-2.5 py-1 rounded-xl bg-slate-200/80">
                  {pendingStageChange.fromStageTitle}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <span
                  className="font-bold text-white text-xs px-2.5 py-1 rounded-xl shadow-2xs"
                  style={{
                    backgroundColor: pendingStageChange.toColor,
                  }}
                >
                  {pendingStageChange.toStageTitle}
                </span>
              </div>
            </div>
          ) : (
            ''
          )
        }
        primaryButtonText="Confirmar Mudança"
        onPrimaryAction={handleConfirmStageChange}
        secondaryButtonText="Cancelar"
        onSecondaryAction={handleCancelStageChange}
      />
    </div>
  )
}
