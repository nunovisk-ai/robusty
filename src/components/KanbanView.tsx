import React, { useState } from 'react'
import type { Opportunity, OpportunityStage, Order, OrderStatus } from '../types'
import { 
  Search, 
  Plus, 
  Filter,
  Truck, 
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  X,
  LayoutGrid,
  List,
  Clock,
  Calendar,
  MessageSquare
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
  const [density, setDensity] = useState<'detailed' | 'compact'>('detailed')

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

        {/* Controles: Densidade, Busca e Botão Novo Orçamento */}
        <div className="flex items-center gap-2 flex-1 max-w-lg justify-end flex-wrap">
          {/* Seletor de Densidade (Detalhado vs Compacto) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setDensity('detailed')}
              title="Exibição Detalhada dos Cards"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                density === 'detailed'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Detalhado</span>
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              title="Exibição Compacta (Alta Densidade)"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                density === 'compact'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Compacto</span>
            </button>
          </div>

          {/* Busca em Tempo Real com Botão Limpar */}
          <div className="relative flex-1 min-w-[170px] max-w-xs">
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

          {onOpenNewBudget && (
            <button
              onClick={onOpenNewBudget}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer shrink-0 outline-none"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Nova Oportunidade</span>
              <span className="sm:hidden">Novo</span>
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
                className={`w-[290px] flex-shrink-0 bg-slate-100/90 rounded-2xl border border-slate-200/90 flex flex-col h-full max-h-full shadow-2xs transition-all duration-200 overflow-hidden ${
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
                              {/* Linha 1: Headline #ROB-xxxx + Badge Origem */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-bold text-[10px] text-slate-800 tracking-tight">
                                  #ROB-{opp.order_number || 1040}
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
                                        onMoveStage(opp.id, SALES_STAGES[colIdx - 1].id)
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
                                        onMoveStage(opp.id, SALES_STAGES[colIdx + 1].id)
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
                              {/* Linha 1: Headline #ROB-xxxx no topo à esquerda + Badge completo de Origem no topo à direita */}
                              <div className="flex items-center justify-between gap-1.5 pb-0.5">
                                <span className="font-mono font-bold text-xs text-slate-800 tracking-tight flex items-center gap-1">
                                  <span className="text-slate-400 font-normal">#</span>
                                  ROB-{opp.order_number || 1040}
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
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
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
                className={`w-[290px] flex-shrink-0 bg-slate-100/90 rounded-2xl border border-slate-200/90 flex flex-col h-full max-h-full shadow-2xs transition-all duration-200 overflow-hidden ${
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
                              {/* Linha 1: Headline #ROB-xxxx + Badge Origem */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-bold text-[10px] text-slate-800 tracking-tight">
                                  #ROB-{ord.order_number}
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
                                        onUpdateOrderStatus(ord.id, ORDER_STAGES[colIdx - 1].id)
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
                                        onUpdateOrderStatus(ord.id, ORDER_STAGES[colIdx + 1].id)
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
                              {/* Linha 1: Headline #ROB-xxxx no topo à esquerda + Badge completo de Origem no topo à direita */}
                              <div className="flex items-center justify-between gap-1.5 pb-0.5">
                                <span className="font-mono font-bold text-xs text-slate-800 tracking-tight flex items-center gap-1">
                                  <span className="text-slate-400 font-normal">#</span>
                                  ROB-{ord.order_number}
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
    </div>
  )
}
