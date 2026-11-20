import React, { useState, useEffect, useMemo, useRef } from 'react'
import type { 
  Vehicle, 
  Product, 
  PaymentMethod, 
  FulfillmentType, 
  Opportunity, 
  OpportunityStage,
  LeadOrigin, 
  Order, 
  Appointment, 
  AttachedDocument,
  OpportunityComment,
  OpportunityHistoryEvent,
  OpportunityTask,
  PersonType,
  DocumentType,
  PaymentSplit,
  CashPaymentSubtype
} from '../types'
import { fetchVehicles, fetchProducts, calculateBudget, getMaxDiscountForPaymentMethod } from '../services/catalogService'
import { lookupCep } from '../services/cepService'
import { lookupCnpj } from '../services/cnpjService'
import { CustomDatePicker } from './CustomDatePicker'
import { CustomTimePicker } from './CustomTimePicker'
import { CustomAlertModal } from './CustomAlertModal'
import {
  BudgetVehiclePillsSkeleton,
  BudgetProductListSkeleton,
} from './SkeletonScreens'
import { generateProposalHtml, type ProposalPayload } from '../utils/proposalGenerator'
import { ROBUSTY_LOGO_BASE64 } from '../assets/logoBase64'
import type { CurrentUser } from './LoginView'
import { 
  formatBRPhone, 
  formatBRCep, 
  formatCurrency, 
  getCleanVehicleModel, 
  formatOrderCode,
  formatCPF,
  formatCNPJ,
  formatRG,
  formatDocumentBy,
  formatIE,
  formatCurrencyInput,
  parseCurrencyInput,
  getLargestPackageDimensions
} from '../utils/formatters'
import { 
  Truck, 
  Wrench, 
  Plus, 
  Trash2, 
  Check, 
  MapPin, 
  Loader2, 
  Car,
  Clock,
  Send,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Weight,
  CreditCard,
  Banknote,
  ReceiptText,
  AlertTriangle,
  FileText,
  Paperclip,
  Upload,
  Eye,
  User,
  Building2,
  Share2,
  ExternalLink,
  MessageSquare,
  History,
  ListTodo,
  Download,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  Search,
  X,
  Lock,
  Pencil,
  Save,
  Percent,
  Split,
  Palette,
  ArchiveX,
  RotateCcw
} from 'lucide-react'
import { CloseOpportunityModal } from './CloseOpportunityModal'
import { 
  FaWhatsapp, 
  FaInstagram, 
  FaFacebook, 
  FaStore, 
  FaUser, 
  FaGlobe, 
  FaVanShuttle, 
  FaTruck, 
  FaCarSide, 
  FaTruckPickup, 
  FaWeightHanging,
  FaUserPlus,
  FaMagnifyingGlass,
  FaCalculator,
  FaPaperPlane,
  FaComments,
  FaCreditCard
} from 'react-icons/fa6'

type BudgetFormTab = 'contact' | 'products' | 'fulfillment' | 'history' | 'attachments'

interface PipelineStageOption {
  id: OpportunityStage
  title: string
  color: string
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

const SALES_PIPELINE_STAGES: PipelineStageOption[] = [
  { id: 'novo_lead', title: 'Novo lead', color: '#8B5CF6', Icon: FaUserPlus },
  { id: 'em_qualificacao', title: 'Em qualificação', color: '#0284C7', Icon: FaMagnifyingGlass },
  { id: 'aguardando_cotacao', title: 'Aguardando Cotação', color: '#0D9488', Icon: FaCalculator },
  { id: 'orcamento_enviado', title: 'Orçamento enviado', color: '#EA580C', Icon: FaPaperPlane },
  { id: 'em_negociacao', title: 'Em negociação', color: '#D97706', Icon: FaComments },
  { id: 'aguardando_pagamento', title: 'Aguardando Pagamento', color: '#DB2777', Icon: FaCreditCard },
]

const normalizePipelineStage = (rawStage?: string): OpportunityStage => {
  if (rawStage === 'venda_perdida' || rawStage === 'venda_ganha') return rawStage
  if (rawStage === 'aguardando_cotacao_frete' || rawStage === 'preparacao_orcamento') return 'aguardando_cotacao'
  if (rawStage === 'aguardando_atendimento') return 'em_qualificacao'
  if (rawStage && SALES_PIPELINE_STAGES.some((s) => s.id === rawStage)) {
    return rawStage as OpportunityStage
  }
  return 'novo_lead'
}

interface BudgetBuilderViewProps {
  initialVehicleId?: string
  initialOpportunity?: Opportunity | null
  existingOrderNumber?: number
  existingOrders?: Order[]
  existingOpportunities?: Opportunity[]
  existingAppointments?: Appointment[]
  currentUser?: CurrentUser | null
  onSaveToKanban?: (opportunityData: any, options?: { stayOnPage?: boolean }) => Promise<Opportunity | null> | void
  onAutoSaveOpportunity?: (opportunityData: any) => Promise<Opportunity | null> | void
  onChangeStage?: (oppId: string, newStage: OpportunityStage) => Promise<void> | void
  onGenerateOrder?: (opportunityData: any) => Promise<void> | void
  onDeleteOpportunity?: (oppId: string) => Promise<void> | void
  onMarkLost?: (oppId: string, reason: string, details?: string) => Promise<void> | void
  onReopenOpportunity?: (oppId: string) => Promise<void> | void
  onClose?: () => void
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', 
  '17:00', '17:30', '18:00'
]

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export const BudgetBuilderView: React.FC<BudgetBuilderViewProps> = ({ 
  initialVehicleId,
  initialOpportunity,
  existingOrderNumber,
  existingOrders = [],
  existingOpportunities = [],
  existingAppointments = [],
  currentUser,
  onSaveToKanban,
  onAutoSaveOpportunity,
  onChangeStage,
  onGenerateOrder,
  onDeleteOpportunity,
  onMarkLost,
  onReopenOpportunity,
  onClose
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    initialOpportunity?.vehicle_id || initialVehicleId || ''
  )
  
  // Número do Pedido / Identificador Único
  const [orderNumber, setOrderNumber] = useState<number>(() => {
    if (initialOpportunity?.order_number) return initialOpportunity.order_number
    if (existingOrderNumber) return existingOrderNumber
    return 1
  })

  // IDs reais no Supabase (null até o primeiro salvamento no banco)
  const [opportunityId, setOpportunityId] = useState<string | null>(() => initialOpportunity?.id || null)
  const [contactId, setContactId] = useState<string | null>(() => initialOpportunity?.contact_id || null)
  const [isSaving, setIsSaving] = useState(false)

  // Etapa atual do Funil de Vendas (sincronizada com o Supabase)
  const [stage, setStage] = useState<OpportunityStage>(() =>
    normalizePipelineStage(initialOpportunity?.stage || 'novo_lead')
  )
  const isReadOnly = stage === 'venda_perdida'
  const [stageToConfirm, setStageToConfirm] = useState<OpportunityStage | null>(null)
  const [isUpdatingStage, setIsUpdatingStage] = useState(false)

  // Responsável: Igor, Norlando ou Loja (por padrão vazio para nova oportunidade)
  const [assignedTo, setAssignedTo] = useState<'Igor' | 'Norlando' | 'Loja' | ''>(() => {
    return initialOpportunity?.assigned_to || ''
  })

  // 1. Dados do Contato & Redes Sociais
  const [customerPhone, setCustomerPhone] = useState(() => {
    const raw = initialOpportunity?.contact?.phone_e164 || ''
    return formatBRPhone(raw.replace('+55', ''))
  })
  const [customerEmail, setCustomerEmail] = useState(() => initialOpportunity?.customer_email || initialOpportunity?.contact?.email || '')
  
  // Tipo de Pessoa (PF vs PJ)
  const [personType, setPersonType] = useState<PersonType>(() => {
    return initialOpportunity?.person_type || initialOpportunity?.contact?.person_type || 'fisica'
  })

  // 1.1 Campos exclusivos Pessoa Física (PF)
  const [pfName, setPfName] = useState(() => {
    const isPj = (initialOpportunity?.person_type || initialOpportunity?.contact?.person_type) === 'juridica'
    return isPj ? '' : (initialOpportunity?.contact?.full_name || '')
  })
  const [pfDocType, setPfDocType] = useState<'cpf' | 'rg' | 'cnh'>(() => {
    const dType = initialOpportunity?.document_type || initialOpportunity?.contact?.document_type
    if (dType === 'rg' || dType === 'cnh' || dType === 'cpf') return dType
    return 'cpf'
  })
  const [pfDoc, setPfDoc] = useState(() => {
    const isPj = (initialOpportunity?.person_type || initialOpportunity?.contact?.person_type) === 'juridica'
    const raw = initialOpportunity?.document || initialOpportunity?.contact?.document || ''
    return isPj ? '' : (raw ? formatDocumentBy(raw, 'cpf') : '')
  })

  // 1.2 Campos exclusivos Pessoa Jurídica (PJ)
  const [pjCnpj, setPjCnpj] = useState(() => {
    const isPj = (initialOpportunity?.person_type || initialOpportunity?.contact?.person_type) === 'juridica'
    const raw = initialOpportunity?.document || initialOpportunity?.contact?.document || ''
    return isPj ? (raw ? formatCNPJ(raw) : '') : ''
  })
  const [pjCompanyName, setPjCompanyName] = useState(() => {
    const isPj = (initialOpportunity?.person_type || initialOpportunity?.contact?.person_type) === 'juridica'
    return isPj ? (initialOpportunity?.contact?.full_name || '') : ''
  })
  const [pjRepresentativeName, setPjRepresentativeName] = useState(() => {
    return initialOpportunity?.trade_name || initialOpportunity?.contact?.trade_name || ''
  })
  const [pjStateRegistration, setPjStateRegistration] = useState(() => {
    return initialOpportunity?.state_registration || initialOpportunity?.contact?.state_registration || ''
  })
  const [pjMunicipalRegistration, setPjMunicipalRegistration] = useState(() => {
    return initialOpportunity?.municipal_registration || initialOpportunity?.contact?.municipal_registration || ''
  })
  const [commercialPhone, setCommercialPhone] = useState(() => {
    return initialOpportunity?.commercial_phone || (initialOpportunity?.contact as any)?.commercial_phone || ''
  })
  const [loadingCnpj, setLoadingCnpj] = useState(false)
  const [cnpjFeedback, setCnpjFeedback] = useState<string | null>(null)

  // Valores derivados conforme o tipo de pessoa (PF vs PJ)
  const customerName = personType === 'fisica' ? pfName : pjCompanyName
  const document = personType === 'fisica' ? pfDoc : pjCnpj
  const documentType = personType === 'fisica' ? pfDocType : 'cnpj'
  const tradeName = personType === 'juridica' ? pjRepresentativeName : undefined
  const stateRegistration = personType === 'juridica' ? pjStateRegistration : undefined
  const municipalRegistration = personType === 'juridica' ? pjMunicipalRegistration : undefined

  const [instagramUrl, setInstagramUrl] = useState(() => 
    initialOpportunity?.instagram_url || 
    initialOpportunity?.contact?.instagram_url || 
    initialOpportunity?.contact?.instagram_handle || 
    ''
  )
  const [facebookUrl, setFacebookUrl] = useState(() => 
    initialOpportunity?.facebook_url || 
    initialOpportunity?.contact?.facebook_url || 
    ''
  )
  const [websiteUrl, setWebsiteUrl] = useState(() => 
    initialOpportunity?.website_url || 
    initialOpportunity?.contact?.website_url || 
    ''
  )
  
  // Origem do Lead: whatsapp, instagram, facebook, manual, site
  const [leadOrigin, setLeadOrigin] = useState<string>(() => {
    const orig = initialOpportunity?.contact?.origin
    if (orig === 'instagram_direct') return 'instagram'
    if (orig === 'meta_lead_ads') return 'facebook'
    if (orig === 'site_form' || orig === 'site') return 'site'
    if (orig === 'loja_presencial' || orig === 'manual') return 'manual'
    return 'whatsapp'
  })

  // Cor / Acabamento do Pedido (vazio por padrão)
  const [productColor, setProductColor] = useState<string>(() => {
    const raw = initialOpportunity?.product_color?.trim() || ''
    return raw.startsWith('{') ? '' : raw
  })

  // 2. Produtos Selecionados
  const [items, setItems] = useState<{ product: Product; quantity: number }[]>(() => {
    if (initialOpportunity?.items && initialOpportunity.items.length > 0) {
      return initialOpportunity.items
        .filter((item) => item.product)
        .map((item) => ({
          product: item.product!,
          quantity: item.quantity,
        }))
    }
    return []
  })

  const autoLargestDimensions = useMemo(() => getLargestPackageDimensions(items), [items])

  // 3. Modalidade de Atendimento
  const [fulfillment, setFulfillment] = useState<FulfillmentType>(() => {
    return initialOpportunity?.fulfillment_type || 'transportadora_envio'
  })

  // Endereço e CEP
  const [cep, setCep] = useState(() => {
    return formatBRCep(initialOpportunity?.address?.cep || '')
  })
  const [street, setStreet] = useState(() => initialOpportunity?.address?.street || '')
  const [number, setNumber] = useState(() => initialOpportunity?.address?.number || '')
  const [complement, setComplement] = useState(() => initialOpportunity?.address?.complement || '')
  const [neighborhood, setNeighborhood] = useState(() => initialOpportunity?.address?.neighborhood || '')
  const [city, setCity] = useState(() => initialOpportunity?.address?.city || '')
  const [state, setState] = useState(() => initialOpportunity?.address?.state || '')
  const [loadingCep, setLoadingCep] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)

  // Transportadora e Logística Oficial
  const [shippingCarrierName, setShippingCarrierName] = useState(() => initialOpportunity?.shipping_carrier_name || '')
  const [shippingTrackingCode, setShippingTrackingCode] = useState(() => initialOpportunity?.shipping_tracking_code || '')
  const [shippingQuoteNumber, setShippingQuoteNumber] = useState<string>(() => initialOpportunity?.shipping_quote_number || '')
  const [shippingCarrierContact, setShippingCarrierContact] = useState<string>(() => initialOpportunity?.shipping_carrier_contact || '')
  const [deliveryLeadTime, setDeliveryLeadTime] = useState<string>(() => initialOpportunity?.delivery_lead_time || '')
  const [productionLeadTime, setProductionLeadTime] = useState<string>(() => initialOpportunity?.production_lead_time || '')
  const [shippingPackageDimensions, setShippingPackageDimensions] = useState<string>(() => initialOpportunity?.shipping_package_dimensions || '')
  const [freightValue, setFreightValue] = useState<number>(() => initialOpportunity?.freight_value || 0)
  const [pickupDate, setPickupDate] = useState<string>(() => initialOpportunity?.pickup_date || '')
  const [pickupTime, setPickupTime] = useState<string>(() => initialOpportunity?.pickup_time || '')

  // Peso Total da Carga (calculado automaticamente com opção de edição manual)
  const [customWeight, setCustomWeight] = useState<number | null>(null)
  const [isEditingWeight, setIsEditingWeight] = useState(false)

  // Filtro Rápido de Categorias e Busca de Produtos
  const [productCategoryFilter, setProductCategoryFilter] = useState<'all' | 'bagageiro' | 'escada' | 'suporte' | 'outros'>('all')
  const [productSearchQuery, setProductSearchQuery] = useState('')

  // Instalação na Loja
  const [installationDate, setInstallationDate] = useState<string>(() => initialOpportunity?.installation_date || '')
  const [installationTime, setInstallationTime] = useState<string>(() => initialOpportunity?.installation_time || '')
  const [installationCost, setInstallationCost] = useState<number>(() => {
    if (initialOpportunity?.installation_value !== undefined) return initialOpportunity.installation_value
    return 0
  })

  // 4. Condições de Pagamento e Desconto
  // "o sistema deve pedir primeiro a forma de pagamento antes de exibir as opções de desconto"
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(() => {
    return initialOpportunity?.payment_method || ''
  })
  const [paymentSubtype, setPaymentSubtype] = useState<CashPaymentSubtype>(() => {
    const raw = initialOpportunity?.payment_subtype
    if (raw === 'debito' || raw === 'transferencia' || raw === 'dinheiro') return raw
    return 'pix'
  })
  const [cardInstallments, setCardInstallments] = useState<number>(() => {
    return initialOpportunity?.card_installments || 10
  })
  const [discountPercent, setDiscountPercent] = useState<number>(() => {
    if (initialOpportunity?.discount_percent !== undefined) return initialOpportunity.discount_percent
    return 0
  })

  // Pagamento Dividido / Múltiplas Formas
  const [paymentMode, setPaymentMode] = useState<'single' | 'split'>(() => {
    if (initialOpportunity?.payment_splits && initialOpportunity.payment_splits.length > 1) {
      return 'split'
    }
    return 'single'
  })
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>(() => {
    if (initialOpportunity?.payment_splits && initialOpportunity.payment_splits.length > 0) {
      return initialOpportunity.payment_splits
    }
    return []
  })

  // UI state
  const [copied, setCopied] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [orderGeneratedSuccess, setOrderGeneratedSuccess] = useState(false)

  // 5 Abas do Gerador de Orçamento:
  // 1. Contato & Redes | 2. Veículo & Produtos | 3. Modalidade & Entrega | 4. Histórico & Tarefas | 5. Anexos
  const [activeFormTab, setActiveFormTab] = useState<BudgetFormTab>('contact')

  // Anexos & Propostas em PDF
  const [attachments, setAttachments] = useState<AttachedDocument[]>(() => {
    return initialOpportunity?.attachments || []
  })
  const [proposalSuccessMsg, setProposalSuccessMsg] = useState(false)
  const [attachmentToDelete, setAttachmentToDelete] = useState<AttachedDocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // 5. Histórico, Comentários & Tarefas (Aba 5)
  const [comments, setComments] = useState<OpportunityComment[]>(() => {
    return initialOpportunity?.comments || []
  })
  const [newCommentText, setNewCommentText] = useState('')

  const [history, setHistory] = useState<OpportunityHistoryEvent[]>(() => {
    if (initialOpportunity?.history && initialOpportunity.history.length > 0) {
      return initialOpportunity.history
    }
    return [
      {
        id: `hist-init-${Date.now()}`,
        opportunity_id: opportunityId || undefined,
        type: 'created',
        description: `Orçamento ${formatOrderCode(orderNumber)} criado no CRM`,
        user: assignedTo,
        created_at: initialOpportunity?.created_at || new Date().toISOString()
      }
    ]
  })

  const [tasks, setTasks] = useState<OpportunityTask[]>(() => {
    return initialOpportunity?.tasks || []
  })
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [newTaskTime, setNewTaskTime] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState<'Norlando' | 'Igor' | 'Loja' | ''>('')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'comments' | 'history'>('all')

  // Feedback visual de salvamento imediato
  const [commentSavedMsg, setCommentSavedMsg] = useState(false)
  const [taskSavedMsg, setTaskSavedMsg] = useState(false)

  // Modais Padronizados
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'save' | 'order' | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [lostModalOpen, setLostModalOpen] = useState(false)
  const [discountModalOpen, setDiscountModalOpen] = useState(false)
  const [tempDiscountPercent, setTempDiscountPercent] = useState(0)

  const [loadingCatalog, setLoadingCatalog] = useState(true)

  // Load Vehicles & Products
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [vList, pList] = await Promise.all([fetchVehicles(), fetchProducts()])
        if (cancelled) return
        setVehicles(vList)
        setAllProducts(pList)
      } catch (err) {
        console.error('Erro ao carregar catálogo no orçamento:', err)
      } finally {
        if (!cancelled) setLoadingCatalog(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // Order vehicles alphabetically by model
  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => a.model.localeCompare(b.model, 'pt-BR'))
  }, [vehicles])

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)

  // Verifica se a oportunidade já está salva no Supabase (original ou via auto-save)
  const isOpportunitySaved = useMemo(() => {
    return Boolean(opportunityId && (initialOpportunity || existingOpportunities.some((o) => o.id === opportunityId)))
  }, [initialOpportunity, existingOpportunities, opportunityId])

  // Compatible products for vehicle (se nenhum veículo estiver selecionado, exibe todos os produtos)
  const compatibleProducts = useMemo(() => {
    if (!selectedVehicleId) return allProducts
    return allProducts.filter(
      (p) => !p.compatible_vehicle_id || p.compatible_vehicle_id === selectedVehicleId
    )
  }, [allProducts, selectedVehicleId])

  // Filtragem rápida por categoria e busca dinâmica em tempo real
  const filteredCompatibleProducts = useMemo(() => {
    const normalizeText = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

    const queryNorm = normalizeText(productSearchQuery.trim())

    return compatibleProducts.filter((p) => {
      // 1. Filtro por categoria
      if (productCategoryFilter === 'bagageiro' && p.category !== 'bagageiro') return false
      if (productCategoryFilter === 'escada' && p.category !== 'escada') return false
      if (productCategoryFilter === 'suporte' && p.category !== 'suporte' && p.category !== 'acessorio_fixacao') return false
      if (
        productCategoryFilter === 'outros' &&
        (p.category === 'bagageiro' || p.category === 'escada' || p.category === 'suporte' || p.category === 'acessorio_fixacao')
      ) {
        return false
      }

      // 2. Filtro por busca textual (se vazio, exibe todos os compatíveis)
      if (!queryNorm) return true

      const searchableText = normalizeText(
        `${p.name} ${p.sku || ''} ${p.dimensions || ''} ${p.model_version || ''} ${p.description || ''}`
      )
      return searchableText.includes(queryNorm)
    })
  }, [compatibleProducts, productCategoryFilter, productSearchQuery])

  // Automatically enforce discount limits when payment method changes
  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method)
    const maxDiscount = getMaxDiscountForPaymentMethod(method)
    // Only clamp if current discount exceeds max allowed; never force discount on change
    if (discountPercent > maxDiscount) {
      setDiscountPercent(maxDiscount)
    }
  }

  // Financial calculations
  const budget = calculateBudget(
    items,
    (paymentMethod as PaymentMethod) || 'pix',
    paymentMethod ? discountPercent : 0,
    fulfillment === 'transportadora_envio' ? freightValue : 0,
    fulfillment === 'instalacao_loja' ? installationCost : 0
  )

  const effectiveWeightKg = customWeight !== null ? customWeight : budget.totalWeightKg

  // Vehicle silhouette icon mapper
  const renderVehicleIcon = (modelStr?: string) => {
    const s = (modelStr || '').toLowerCase()
    if (s.includes('kombi') || s.includes('jumpy') || s.includes('expert') || s.includes('scudo')) {
      return <FaVanShuttle className="w-4 h-4 shrink-0" />
    }
    if (s.includes('ducato') || s.includes('master') || s.includes('sprinter') || s.includes('daily') || s.includes('jumper') || s.includes('boxer')) {
      return <FaTruck className="w-4 h-4 shrink-0" />
    }
    if (s.includes('hr') || s.includes('bongo') || s.includes('saveiro')) {
      return <FaTruckPickup className="w-4 h-4 shrink-0" />
    }
    return <FaCarSide className="w-4 h-4 shrink-0" />
  }

  // CEP Lookup
  const handleCepSearch = async () => {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    setLoadingCep(true)
    setCepError(null)
    const res = await lookupCep(clean)
    setLoadingCep(false)
    if (res.error) {
      setCepError(res.error)
      setStreet('')
      setNeighborhood('')
      setCity('')
      setState('')
    } else {
      setStreet(res.street || '')
      setNeighborhood(res.neighborhood || '')
      setCity(res.city || '')
      setState(res.state || '')
    }
  }

  // Auto search on 8 digits
  const handleCepChange = (raw: string) => {
    const formatted = formatBRCep(raw)
    setCep(formatted)
    const clean = formatted.replace(/\D/g, '')
    if (clean.length === 8) {
      setLoadingCep(true)
      setCepError(null)
      lookupCep(clean).then((res) => {
        setLoadingCep(false)
        if (res.error) {
          setCepError(res.error)
          setStreet('')
          setNeighborhood('')
          setCity('')
          setState('')
        } else {
          setStreet(res.street || '')
          setNeighborhood(res.neighborhood || '')
          setCity(res.city || '')
          setState(res.state || '')
        }
      })
    }
  }

  // CNPJ Lookup via BrasilAPI / MinhaReceita (traz apenas a Razão Social conforme solicitação)
  const handleCnpjSearch = async (cnpjToSearch?: string) => {
    const raw = (cnpjToSearch || pjCnpj).replace(/\D/g, '')
    if (raw.length !== 14) return
    setLoadingCnpj(true)
    setCnpjFeedback(null)
    const res = await lookupCnpj(raw)
    setLoadingCnpj(false)
    if (res.error || !res.companyName) {
      setCnpjFeedback(res.error || 'CNPJ não encontrado na base da Receita Federal.')
      setPjCompanyName('')
    } else {
      setPjCompanyName(res.companyName)
      setCnpjFeedback('Razão social localizada com sucesso!')
      setTimeout(() => setCnpjFeedback(null), 4000)
    }
  }

  const handleCnpjChange = (raw: string) => {
    const formatted = formatCNPJ(raw)
    setPjCnpj(formatted)
    const digits = formatted.replace(/\D/g, '')
    if (digits.length === 14) {
      handleCnpjSearch(digits)
    }
  }

  const handleAddItem = (prod: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === prod.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product: prod, quantity: 1 }]
    })
  }

  const handleRemoveItem = (prodId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== prodId))
  }

  const handleQuantityChange = (prodId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.product.id === prodId) {
            const nextQty = i.quantity + delta
            return nextQty > 0 ? { ...i, quantity: nextQty } : null
          }
          return i
        })
        .filter(Boolean) as { product: Product; quantity: number }[]
    )
  }

  // WhatsApp Message Generation
  const generateWhatsAppMessage = () => {
    const resolvedDimensions = shippingPackageDimensions.trim() || autoLargestDimensions
    const lines = [
      `*PROPOSTA COMERCIAL ROBUSTY — BAGAGEIROS AUTOMOTIVOS*`,
      `*Identificador Único:* ${formatOrderCode(orderNumber)}`,
      `*Responsável:* ${assignedTo}`,
      `Olá ${customerName ? customerName : 'Cliente'}! Segue sua proposta oficial:`,
      ...(document ? [`*${personType === 'juridica' ? 'CNPJ' : documentType.toUpperCase()}:* ${document}`] : []),
      ...(personType === 'juridica' && tradeName ? [`*Responsável:* ${tradeName}`] : []),
      ...(personType === 'juridica' && stateRegistration ? [`*Inscrição Estadual (IE):* ${stateRegistration}`] : []),
      ...(personType === 'juridica' && municipalRegistration ? [`*Inscrição Municipal (IM):* ${municipalRegistration}`] : []),
      ...(personType === 'juridica' && commercialPhone ? [`*Telefone Comercial:* ${commercialPhone}`] : []),
      ...(customerPhone ? [`*WhatsApp:* ${customerPhone}`] : []),
      ...(customerEmail ? [`*E-mail:* ${customerEmail}`] : []),
      ``,
      `*Veículo:* ${selectedVehicle ? getCleanVehicleModel(selectedVehicle.model) : 'Utilitário'}`,
      ...(productColor.trim() ? [`*Cor / Acabamento:* ${productColor}`] : []),
      `*Modalidade:* ${fulfillment === 'instalacao_loja' ? 'Instalação na Loja Robusty' : 'Envio por Transportadora'}`,
      ...(fulfillment === 'transportadora_envio' && city ? [`*Destino:* ${city}/${state} (CEP: ${cep})`] : []),
      ...(fulfillment === 'transportadora_envio' && shippingCarrierName ? [`*Transportadora:* ${shippingCarrierName}`] : []),
      ...(fulfillment === 'transportadora_envio' && shippingQuoteNumber ? [`*Cotação Frete Nº:* ${shippingQuoteNumber}`] : []),
      ...(productionLeadTime ? [`*Prazo de Produção:* ${productionLeadTime.split('-').reverse().join('/')}`] : []),
      ...(fulfillment === 'transportadora_envio' && deliveryLeadTime ? [`*Prazo de Entrega:* ${deliveryLeadTime.split('-').reverse().join('/')}`] : []),
      ...(fulfillment === 'transportadora_envio' && resolvedDimensions ? [`*Dimensões do Volume:* ${resolvedDimensions}`] : []),
      ...(fulfillment === 'transportadora_envio' && shippingTrackingCode ? [`*Código de Rastreio:* ${shippingTrackingCode}`] : []),
      ...(fulfillment === 'transportadora_envio' && pickupDate ? [`*Previsão de Coleta:* ${pickupDate.split('-').reverse().join('/')}${pickupTime ? ` às ${pickupTime}` : ' (horário a definir)'}`] : []),
      ...(fulfillment === 'instalacao_loja' && installationDate ? [`*Agendamento Instalação:* ${installationDate.split('-').reverse().join('/')} às ${installationTime}`] : []),
      ``,
      `*ITENS DO ORÇAMENTO:*`,
      ...items.map(
        (i, idx) =>
          `${idx + 1}. ${i.product.name} (x${i.quantity}) — ${formatCurrency(i.product.base_price_10x * i.quantity)} ${i.product.dimensions ? `(${i.product.dimensions})` : ''} ${i.product.weight_kg ? `[${i.product.weight_kg * i.quantity} kg]` : ''}`
      ),
      ``,
      `*RESUMO FINANCEIRO:*`,
      `• Subtotal Produtos: ${formatCurrency(budget.subtotal)}`,
      ...(budget.discountValue > 0 ? [`• Desconto Comercial (${budget.discountPercent}%): -${formatCurrency(budget.discountValue)}`] : []),
      ...(fulfillment === 'transportadora_envio' && budget.freightValue > 0 ? [`• Frete Transportadora: ${formatCurrency(budget.freightValue)} (Peso Total: ${effectiveWeightKg} kg)`] : []),
      ...(fulfillment === 'instalacao_loja' && budget.installationValue > 0 ? [`• Custo de Instalação: ${formatCurrency(budget.installationValue)}`] : []),
      ``,
      `*VALOR TOTAL:* *${formatCurrency(budget.finalTotal)}*`,
      ...(paymentMode === 'split' && paymentSplits.length > 0
        ? [
            `*Condição de Pagamento (Dividido):*`,
            ...paymentSplits.map((s, idx) => {
              const methodLabel = s.method === 'pix' ? 'PIX / À vista' : s.method === 'cartao_link_igor' || s.method === 'cartao_presencial' ? `Cartão de Crédito (${s.installments || 1}x de ${formatCurrency(Math.round(((s.amount || 0) / Math.max(1, s.installments || 1)) * 100) / 100)})` : s.method === 'boleto' ? 'Boleto Bancário' : 'Dinheiro / Transferência'
              return `  ${idx + 1}. ${methodLabel}: ${formatCurrency(s.amount)}${s.notes ? ` (${s.notes})` : ''}`
            })
          ]
        : [
            `*Condição:* ${
              paymentMethod === 'pix'
                ? `À vista via ${
                    paymentSubtype === 'pix'
                      ? 'PIX'
                      : paymentSubtype === 'debito'
                      ? 'Cartão de Débito'
                      : paymentSubtype === 'transferencia'
                      ? 'Transferência Bancária'
                      : 'Dinheiro'
                  } (com desconto)`
                : paymentMethod === 'boleto'
                ? 'À vista no Boleto Bancário'
                : `Cartão de Crédito em até ${cardInstallments}x de ${formatCurrency(Math.round((budget.finalTotal / Math.max(1, cardInstallments)) * 100) / 100)} sem juros`
            }`
          ]),
      ``,
      `Qualquer dúvida estamos à disposição para confirmar seu pedido!`,
    ]
    return lines.join('\n')
  }

  const handleCopyProposal = () => {
    const text = generateWhatsAppMessage()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Build payload com suporte a overrides para auto-save imediato
  const buildOpportunityData = (overrides?: {
    comments?: OpportunityComment[]
    tasks?: OpportunityTask[]
    history?: OpportunityHistoryEvent[]
    attachments?: AttachedDocument[]
    stage?: OpportunityStage
  }) => {
    const mappedOrigin = (() => {
      switch (leadOrigin) {
        case 'instagram': return 'instagram_direct'
        case 'facebook': return 'meta_lead_ads'
        case 'site': return 'site_form'
        case 'manual': return 'loja_presencial'
        default: return 'whatsapp_inbound'
      }
    })()

    return {
      id: opportunityId,
      contactId,
      orderNumber,
      orderCode: formatOrderCode(orderNumber),
      assignedTo,
      stage: overrides?.stage ?? stage,
      customerName: customerName || 'Novo Cliente',
      customerPhone,
      commercialPhone: personType === 'juridica' ? commercialPhone : undefined,
      customerEmail,
      personType,
      documentType: personType === 'fisica' ? documentType : 'cnpj',
      document,
      stateRegistration: personType === 'juridica' ? stateRegistration : undefined,
      municipalRegistration: personType === 'juridica' ? municipalRegistration : undefined,
      tradeName: personType === 'juridica' ? tradeName : undefined,
      instagramUrl: instagramUrl.trim() || undefined,
      facebookUrl: facebookUrl.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      leadOrigin: mappedOrigin as LeadOrigin,
      vehicle: selectedVehicle,
      vehicleId: selectedVehicle?.id,
      vehicleModel: selectedVehicle ? getCleanVehicleModel(selectedVehicle.model) : 'Utilitário',
      items,
      fulfillment,
      address: {
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      },
      freightValue,
      shippingCarrierName,
      shippingTrackingCode,
      shippingQuoteNumber,
      shippingCarrierContact,
      deliveryLeadTime,
      productionLeadTime,
      shippingPackageDimensions: shippingPackageDimensions.trim() || autoLargestDimensions,
      productColor,
      pickupDate,
      pickupTime,
      installationDate,
      installationTime,
      installationCost,
      totalWeightKg: effectiveWeightKg,
      budget,
      paymentMethod: (paymentMethod as PaymentMethod) || 'pix',
      paymentSubtype: paymentMethod === 'pix' ? paymentSubtype : undefined,
      discountPercent: budget.discountPercent,
      cardInstallments,
      paymentSplits: paymentMode === 'split' ? paymentSplits : (paymentSplits.length > 0 ? paymentSplits : undefined),
      attachments: overrides?.attachments ?? attachments,
      comments: overrides?.comments ?? comments,
      history: overrides?.history ?? history,
      tasks: overrides?.tasks ?? tasks,
    }
  }

  // Persistência Imediata no Perfil do Lead (Supabase + Kanban) sem sair da tela
  const autoSaveOpportunity = async (overrides?: {
    comments?: OpportunityComment[]
    tasks?: OpportunityTask[]
    history?: OpportunityHistoryEvent[]
    attachments?: AttachedDocument[]
    stage?: OpportunityStage
  }) => {
    const payload = buildOpportunityData(overrides)
    try {
      const saved = onAutoSaveOpportunity
        ? await onAutoSaveOpportunity(payload)
        : onSaveToKanban
        ? await onSaveToKanban(payload, { stayOnPage: true })
        : null

      if (saved) {
        setOpportunityId(saved.id)
        if (saved.contact_id) setContactId(saved.contact_id)
        if (saved.order_number) setOrderNumber(saved.order_number)
      }
    } catch (err) {
      console.error('Erro no salvamento automático da oportunidade:', err)
    }
  }

  // Executar mudança de etapa após confirmação do usuário (persiste imediatamente se já existir no banco)
  const applyStageChange = async (nextStage: OpportunityStage) => {
    if (nextStage === stage || isUpdatingStage) return

    const prevStage = stage
    const oldLabel = SALES_PIPELINE_STAGES.find((s) => s.id === prevStage)?.title || prevStage
    const newLabel = SALES_PIPELINE_STAGES.find((s) => s.id === nextStage)?.title || nextStage
    const authorName = currentUser?.name || assignedTo || 'Equipe'

    const stageEvent: OpportunityHistoryEvent = {
      id: `hist-stage-${Date.now()}`,
      opportunity_id: opportunityId || undefined,
      type: 'stage_change',
      description: `Movimentação de etapa: de "${oldLabel}" para "${newLabel}"`,
      user: authorName,
      created_at: new Date().toISOString(),
    }

    setStage(nextStage)
    setHistory((prev) => [stageEvent, ...prev])

    if (opportunityId && onChangeStage) {
      setIsUpdatingStage(true)
      try {
        await onChangeStage(opportunityId, nextStage)
      } catch (err) {
        console.error('Erro ao atualizar etapa da oportunidade:', err)
        setStage(prevStage)
      } finally {
        setIsUpdatingStage(false)
      }
    }
  }

  // Solicitar confirmação ao clicar em uma etapa
  const handleSelectStage = (nextStage: OpportunityStage) => {
    if (nextStage === stage || isUpdatingStage) return
    setStageToConfirm(nextStage)
  }

  // Detecção de Conflito de Instalação (ignorando o próprio registro/oportunidade)
  const installationConflict = useMemo(() => {
    if (fulfillment !== 'instalacao_loja' || !installationDate || !installationTime) return null

    const currentOppId = opportunityId || initialOpportunity?.id
    const currentContactId = contactId || initialOpportunity?.contact_id

    // 1. Procurar em existingOrders
    const orderConflict = existingOrders.find((ord) => {
      if (
        (currentOppId && (ord.id === currentOppId || ord.opportunity_id === currentOppId)) ||
        ord.order_number === orderNumber
      ) {
        return false
      }
      return (
        ord.fulfillment_type === 'instalacao_loja' &&
        ord.installation_date === installationDate &&
        ord.installation_time === installationTime &&
        ord.status !== 'pedido_cancelado'
      )
    })

    if (orderConflict) {
      return {
        type: 'order',
        code: orderConflict.order_code || formatOrderCode(orderConflict.order_number),
        client: orderConflict.contact?.full_name || 'Cliente com pedido ativo',
        vehicle: orderConflict.opportunity?.vehicle_model_year || 'Veículo utilitário',
        date: installationDate,
        time: installationTime
      }
    }

    // 2. Procurar em existingOpportunities
    const oppConflict = existingOpportunities.find((opp) => {
      if ((currentOppId && opp.id === currentOppId) || opp.order_number === orderNumber) {
        return false
      }
      return (
        opp.fulfillment_type === 'instalacao_loja' &&
        opp.installation_date === installationDate &&
        opp.installation_time === installationTime &&
        opp.stage !== 'venda_perdida'
      )
    })

    if (oppConflict) {
      return {
        type: 'opportunity',
        code: oppConflict.order_code || formatOrderCode(oppConflict.order_number),
        client: oppConflict.contact?.full_name || 'Lead em negociação',
        vehicle: oppConflict.vehicle_model_year || 'Veículo utilitário',
        date: installationDate,
        time: installationTime
      }
    }

    // 3. Procurar em existingAppointments (ignorando o agendamento do próprio pedido/contato)
    const aptConflict = existingAppointments.find((apt) => {
      if (currentOppId && apt.opportunity_id === currentOppId) return false
      if (currentContactId && apt.contact_id === currentContactId && initialOpportunity?.installation_date === installationDate) {
        return false
      }
      const start = apt.scheduled_start
      return (
        start.startsWith(installationDate) &&
        start.includes(installationTime) &&
        apt.status !== 'cancelado'
      )
    })

    if (aptConflict) {
      return {
        type: 'appointment',
        code: 'Agendamento Loja',
        client: aptConflict.contact?.full_name || 'Cliente agendado',
        vehicle: aptConflict.vehicle_description || 'Veículo utilitário',
        date: installationDate,
        time: installationTime
      }
    }

    return null
  }, [
    fulfillment,
    installationDate,
    installationTime,
    existingOrders,
    existingOpportunities,
    existingAppointments,
    initialOpportunity,
    opportunityId,
    contactId,
    orderNumber
  ])

  const buildProposalPayload = (): ProposalPayload => {
    return {
      orderNumber,
      customerName: customerName.trim(),
      customerPhone,
      commercialPhone: personType === 'juridica' ? commercialPhone : undefined,
      customerEmail,
      personType,
      documentType: personType === 'fisica' ? documentType : 'cnpj',
      document,
      stateRegistration: personType === 'juridica' ? stateRegistration : undefined,
      municipalRegistration: personType === 'juridica' ? municipalRegistration : undefined,
      tradeName: personType === 'juridica' ? tradeName : undefined,
      vehicleModel: selectedVehicle
        ? getCleanVehicleModel(selectedVehicle.model)
        : (initialOpportunity?.vehicle_model_year || ''),
      items,
      budget,
      fulfillment,
      address: {
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        cep,
      },
      pickupDate,
      pickupTime,
      installationDate,
      installationTime,
      paymentMethod: (paymentMethod as PaymentMethod) || 'pix',
      paymentSubtype: paymentMethod === 'pix' ? paymentSubtype : undefined,
      cardInstallments,
      paymentSplits: paymentMode === 'split' ? paymentSplits : undefined,
      shippingCarrierName,
      shippingQuoteNumber,
      shippingCarrierContact,
      deliveryLeadTime,
      productionLeadTime,
      shippingPackageDimensions: shippingPackageDimensions.trim() || autoLargestDimensions,
      shippingTrackingCode,
      productColor,
      totalWeightKg: effectiveWeightKg,
      assignedTo: currentUser?.name || assignedTo,
      notes: initialOpportunity?.notes || '',
    }
  }

  const handleGenerateAndAttachProposal = () => {
    const authorName = currentUser?.name || assignedTo || 'Usuário'
    const cleanCustomer = (customerName || 'Cliente').trim().replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚãõÃÕâêîôûÂÊÎÔÛçÇ_-]/g, '_')
    const payload = buildProposalPayload()
    const htmlContent = generateProposalHtml(payload)
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const fileUrl = URL.createObjectURL(blob)

    const newProposalDoc: AttachedDocument = {
      id: `doc-prop-${Date.now()}`,
      name: `Proposta_Comercial_${formatOrderCode(orderNumber)}_${cleanCustomer}.html`,
      type: 'orcamento_pdf',
      file_url: fileUrl,
      file_size: `${Math.max(1, Math.round(blob.size / 1024))} KB`,
      uploaded_at: new Date().toISOString(),
      uploaded_by: authorName
    }

    const updatedAttachments = [newProposalDoc, ...attachments.filter((d) => d.type !== 'orcamento_pdf')]
    setAttachments(updatedAttachments)

    const historyEvent: OpportunityHistoryEvent = {
      id: `hist-prop-${Date.now()}`,
      opportunity_id: opportunityId || undefined,
      type: 'note',
      description: `Gerou e anexou a proposta comercial oficial (${formatOrderCode(orderNumber)})`,
      user: authorName,
      created_at: new Date().toISOString()
    }
    const updatedHistory = [historyEvent, ...history]
    setHistory(updatedHistory)

    setProposalSuccessMsg(true)
    setTimeout(() => setProposalSuccessMsg(false), 4000)

    autoSaveOpportunity({ attachments: updatedAttachments, history: updatedHistory })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const authorName = currentUser?.name || assignedTo || 'Usuário'
    const newDocs: AttachedDocument[] = []
    const newHistoryEvents: OpportunityHistoryEvent[] = []

    Array.from(files).forEach((file, index) => {
      const fileUrl = URL.createObjectURL(file)
      const nameLower = file.name.toLowerCase()

      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(nameLower)
      const isXml = nameLower.endsWith('.xml')
      const isPdf = nameLower.endsWith('.pdf')
      const isSpreadsheet = /\.(xlsx?|csv)$/i.test(nameLower)
      const isDoc = /\.(docx?|txt|rtf|odt)$/i.test(nameLower)

      const docType: AttachedDocument['type'] = isImage 
        ? 'imagem' 
        : isXml 
        ? 'nfe_xml' 
        : isPdf 
        ? (nameLower.includes('nf') || nameLower.includes('danfe') ? 'nfe_pdf' : 'documento')
        : isSpreadsheet 
        ? 'planilha' 
        : isDoc 
        ? 'documento' 
        : 'outro'

      const doc: AttachedDocument = {
        id: `doc-${Date.now()}-${index}`,
        name: file.name,
        type: docType,
        file_url: fileUrl,
        file_size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        uploaded_at: new Date().toISOString(),
        uploaded_by: authorName
      }
      newDocs.push(doc)

      newHistoryEvents.push({
        id: `hist-attach-${Date.now()}-${index}`,
        opportunity_id: opportunityId || undefined,
        type: 'note',
        description: `Anexou o arquivo "${file.name}"`,
        user: authorName,
        created_at: new Date().toISOString()
      })
    })

    const updatedAttachments = [...newDocs, ...attachments]
    const updatedHistory = [...newHistoryEvents, ...history]
    setAttachments(updatedAttachments)
    setHistory(updatedHistory)
    e.target.value = ''

    autoSaveOpportunity({ attachments: updatedAttachments, history: updatedHistory })
  }

  const handleViewDocument = (doc: AttachedDocument) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank')
      return
    }
    if (doc.type === 'orcamento_pdf') {
      const payload = buildProposalPayload()
      const htmlContent = generateProposalHtml(payload)
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      return
    }
    const fallbackHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${doc.name} - Robusty CRM</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; background: #f8fafc; color: #1e293b; }
    .card { background: white; max-width: 600px; margin: 0 auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    h2 { color: #0f172a; margin-top: 0; font-size: 1.25rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
    .item { margin: 12px 0; font-size: 14px; }
    .label { font-weight: 600; color: #64748b; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background: #eff6ff; color: #1d4ed8; font-weight: 600; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>📄 ${doc.name}</h2>
    <div class="item"><span class="label">Tipo:</span> <span class="badge">${doc.type}</span></div>
    <div class="item"><span class="label">Pedido Vinculado:</span> ${formatOrderCode(orderNumber)}</div>
    <div class="item"><span class="label">Cliente:</span> ${customerName || 'Cliente'}</div>
    <div class="item"><span class="label">Tamanho:</span> ${doc.file_size || 'N/A'}</div>
    <div class="item"><span class="label">Data de Registro:</span> ${new Date(doc.uploaded_at).toLocaleString('pt-BR')}</div>
    ${doc.uploaded_by ? `<div class="item"><span class="label">Registrado por:</span> <strong>${doc.uploaded_by}</strong></div>` : ''}
  </div>
</body>
</html>`
    const blob = new Blob([fallbackHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const handleDownloadDocument = (doc: AttachedDocument) => {
    let url = doc.file_url
    if (!url && doc.type === 'orcamento_pdf') {
      const payload = buildProposalPayload()
      const htmlContent = generateProposalHtml(payload)
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      url = URL.createObjectURL(blob)
    }
    if (url) {
      const a = window.document.createElement('a')
      a.href = url
      a.download = doc.name
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      return
    }
  }

  const handleAddComment = () => {
    if (!newCommentText.trim()) return
    const authorName = currentUser?.name || assignedTo || 'Usuário'
    const comment: OpportunityComment = {
      id: `comm-${Date.now()}`,
      opportunity_id: opportunityId || undefined,
      author: authorName,
      text: newCommentText.trim(),
      created_at: new Date().toISOString()
    }
    const updatedComments = [comment, ...comments]
    setComments(updatedComments)
    setNewCommentText('')

    setCommentSavedMsg(true)
    setTimeout(() => setCommentSavedMsg(false), 3000)

    autoSaveOpportunity({ comments: updatedComments })
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    const authorName = currentUser?.name || assignedTo || 'Usuário'
    const task: OpportunityTask = {
      id: `task-${Date.now()}`,
      opportunity_id: opportunityId || undefined,
      order_number: orderNumber,
      client_name: customerName || 'Cliente',
      title: newTaskTitle.trim(),
      due_date: newTaskDate || undefined,
      due_time: newTaskTime || undefined,
      assigned_to: newTaskAssignee || undefined,
      completed: false,
      created_at: new Date().toISOString()
    }
    const updatedTasks = [task, ...tasks]
    setTasks(updatedTasks)
    setNewTaskTitle('')
    setNewTaskDate('')
    setNewTaskTime('')
    setNewTaskAssignee('')

    const historyEvent: OpportunityHistoryEvent = {
      id: `hist-task-${Date.now()}`,
      opportunity_id: opportunityId || undefined,
      type: 'note',
      description: `Criou a tarefa: "${task.title}"${task.assigned_to ? ` para ${task.assigned_to}` : ''}`,
      user: authorName,
      created_at: new Date().toISOString()
    }
    const updatedHistory = [historyEvent, ...history]
    setHistory(updatedHistory)

    setTaskSavedMsg(true)
    setTimeout(() => setTaskSavedMsg(false), 3000)

    autoSaveOpportunity({ tasks: updatedTasks, history: updatedHistory })
  }

  const handleToggleTask = (taskId: string) => {
    let toggledTaskTitle = ''
    let isNowCompleted = false
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed
        toggledTaskTitle = t.title
        isNowCompleted = nextCompleted
        return {
          ...t,
          completed: nextCompleted,
          completed_at: nextCompleted ? new Date().toISOString() : undefined
        }
      }
      return t
    })
    setTasks(updatedTasks)

    let updatedHistory = history
    if (toggledTaskTitle) {
      const historyEvent: OpportunityHistoryEvent = {
        id: `hist-task-toggle-${Date.now()}`,
        opportunity_id: opportunityId || undefined,
        type: 'note',
        description: isNowCompleted ? `Concluiu a tarefa: "${toggledTaskTitle}"` : `Reabriu a tarefa: "${toggledTaskTitle}"`,
        user: currentUser?.name || assignedTo || 'Usuário',
        created_at: new Date().toISOString()
      }
      updatedHistory = [historyEvent, ...history]
      setHistory(updatedHistory)
    }

    autoSaveOpportunity({ tasks: updatedTasks, history: updatedHistory })
  }

  const handleDeleteTask = (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId)
    const updatedTasks = tasks.filter((t) => t.id !== taskId)
    setTasks(updatedTasks)

    let updatedHistory = history
    if (targetTask) {
      const historyEvent: OpportunityHistoryEvent = {
        id: `hist-task-del-${Date.now()}`,
        opportunity_id: opportunityId || undefined,
        type: 'note',
        description: `Excluiu a tarefa: "${targetTask.title}"`,
        user: currentUser?.name || assignedTo || 'Usuário',
        created_at: new Date().toISOString()
      }
      updatedHistory = [historyEvent, ...history]
      setHistory(updatedHistory)
    }

    autoSaveOpportunity({ tasks: updatedTasks, history: updatedHistory })
  }

  // Linha do tempo unificada ordenada da mais recente para a mais antiga
  const timelineItems = useMemo(() => {
    const list: Array<{
      id: string
      date: string
      title: string
      content: string
      author?: string
      isComment: boolean
    }> = []

    if (historyFilter === 'all' || historyFilter === 'comments') {
      comments.forEach((c) => {
        list.push({
          id: c.id,
          date: c.created_at,
          title: `Observação registrada por ${c.author}`,
          content: c.text,
          author: c.author,
          isComment: true
        })
      })
    }

    if (historyFilter === 'all' || historyFilter === 'history') {
      history.forEach((h) => {
        list.push({
          id: h.id,
          date: h.created_at,
          title: h.type === 'stage_change' ? 'Mudança de Etapa' : 'Histórico do CRM',
          content: h.description,
          author: h.user,
          isComment: false
        })
      })
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [comments, history, historyFilter])

  const handleConfirmDeleteAttachment = () => {
    if (attachmentToDelete) {
      const updatedAttachments = attachments.filter((a) => a.id !== attachmentToDelete.id)
      setAttachments(updatedAttachments)
      setAttachmentToDelete(null)
      autoSaveOpportunity({ attachments: updatedAttachments })
    }
  }

  const executePendingAction = () => {
    if (pendingAction === 'save') {
      executeSave()
    } else if (pendingAction === 'order') {
      executeGenerateOrder()
    }
    setPendingAction(null)
    setConflictModalOpen(false)
  }

  const executeSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const data = buildOpportunityData()
      if (onSaveToKanban) {
        const saved = await onSaveToKanban(data)
        if (saved) {
          setOpportunityId(saved.id)
          if (saved.contact_id) setContactId(saved.contact_id)
          if (saved.order_number) setOrderNumber(saved.order_number)
        }
      }
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const executeGenerateOrder = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const data = buildOpportunityData()
      if (onGenerateOrder) {
        await onGenerateOrder(data)
      } else if (onSaveToKanban) {
        await onSaveToKanban({ ...data, autoGenerateOrder: true })
      }
      setOrderGeneratedSuccess(true)
      setTimeout(() => setOrderGeneratedSuccess(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // 1. Salvar: cria/atualiza o card no Funil de Vendas com checagem de conflito
  const handleSave = () => {
    if (isSaving) return
    if (installationConflict) {
      setPendingAction('save')
      setConflictModalOpen(true)
      return
    }
    void executeSave()
  }

  // 2. Gerar Pedido: integra o card diretamente com o Funil de Pedidos com checagem de conflito
  const handleGenerateOrderAction = () => {
    if (isSaving) return
    if (installationConflict) {
      setPendingAction('order')
      setConflictModalOpen(true)
      return
    }
    void executeGenerateOrder()
  }

  // 3. Apagar Orçamento
  const handleDelete = async () => {
    if (opportunityId && onDeleteOpportunity) {
      await onDeleteOpportunity(opportunityId)
    }
    setDeleteModalOpen(false)
  }

  const [isClosingOpportunity, setIsClosingOpportunity] = useState(false)
  const [isReopeningOpportunity, setIsReopeningOpportunity] = useState(false)

  // 4. Marcar Oportunidade Perdida / Venda Não Concluída com Motivo
  const handleConfirmCloseOpportunity = async (reason: string, details?: string) => {
    if (opportunityId && onMarkLost) {
      setIsClosingOpportunity(true)
      try {
        await onMarkLost(opportunityId, reason, details)
        setLostModalOpen(false)
        onClose?.()
      } finally {
        setIsClosingOpportunity(false)
      }
    } else {
      setLostModalOpen(false)
      onClose?.()
    }
  }

  const handleConfirmReopenOpportunity = async () => {
    if (opportunityId && onReopenOpportunity) {
      setIsReopeningOpportunity(true)
      try {
        await onReopenOpportunity(opportunityId)
        setStage('novo_lead')
      } finally {
        setIsReopeningOpportunity(false)
      }
    }
  }

  const maxAllowedDiscount = getMaxDiscountForPaymentMethod(paymentMethod)

  // Cálculos em tempo real para Pagamento Dividido
  const totalSplitsAllocated = useMemo(() => {
    return paymentSplits.reduce((acc, s) => acc + (Number(s.amount) || 0), 0)
  }, [paymentSplits])

  const remainingSplitBalance = Math.round((budget.finalTotal - totalSplitsAllocated) * 100) / 100

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header with Back Button & Unique Identifier */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:px-6 rounded-2xl border border-slate-100 shadow-nexo">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Voltar ao Pipeline"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Oportunidade {formatOrderCode(orderNumber)}
              </h2>
            </div>
          </div>
        </div>

        {/* Responsável Pill Selector: Igor, Norlando ou Loja */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-200">
          <span className="text-xs font-bold text-slate-500 pl-2 pr-1">Responsável:</span>
          {(['Norlando', 'Igor', 'Loja'] as const).map((resp) => {
            const isSelected = assignedTo === resp
            return (
              <button
                type="button"
                key={resp}
                disabled={isReadOnly}
                onClick={() => {
                  if (isReadOnly) return
                  setAssignedTo(assignedTo === resp ? '' : resp)
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#EA580C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                } ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                {resp === 'Loja' ? <FaStore className="w-3 h-3" /> : <FaUser className="w-2.5 h-2.5" />}
                <span>{resp}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navegação por Abas do Orçamento (Seções do Formulário) */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFormTab('contact')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeFormTab === 'contact'
                ? 'bg-orange-50 text-[#EA580C] border-orange-200 shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <User className={`w-4 h-4 shrink-0 ${activeFormTab === 'contact' ? 'text-[#EA580C]' : 'text-slate-400'}`} />
            <span className="truncate">1. Contato & Redes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormTab('products')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeFormTab === 'products'
                ? 'bg-orange-50 text-[#EA580C] border-orange-200 shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <Car className={`w-4 h-4 shrink-0 ${activeFormTab === 'products' ? 'text-[#EA580C]' : 'text-slate-400'}`} />
            <span className="truncate">2. Veículo & Produtos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormTab('fulfillment')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeFormTab === 'fulfillment'
                ? 'bg-orange-50 text-[#EA580C] border-orange-200 shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <Truck className={`w-4 h-4 shrink-0 ${activeFormTab === 'fulfillment' ? 'text-[#EA580C]' : 'text-slate-400'}`} />
            <span className="truncate">3. Modalidade & Entrega</span>
            {installationConflict && (
              <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Conflito de horário detectado" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveFormTab('history')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeFormTab === 'history'
                ? 'bg-orange-50 text-[#EA580C] border-orange-200 shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <History className={`w-4 h-4 shrink-0 ${activeFormTab === 'history' ? 'text-[#EA580C]' : 'text-slate-400'}`} />
            <span className="truncate">4. Observações & Tarefas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormTab('attachments')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeFormTab === 'attachments'
                ? 'bg-orange-50 text-[#EA580C] border-orange-200 shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <Paperclip className={`w-4 h-4 shrink-0 ${activeFormTab === 'attachments' ? 'text-[#EA580C]' : 'text-slate-400'}`} />
            <span className="truncate">5. Anexos</span>
          </button>
        </div>
      </div>

      {/* Banner de Aviso caso Oportunidade Perdida / Encerrada */}
      {stage === 'venda_perdida' && (
        <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ArchiveX className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Oportunidade Perdida (Encerrada)
                </span>
                {initialOpportunity?.lost_reason && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-200/90 text-rose-900 border border-rose-300">
                    Motivo: {initialOpportunity.lost_reason}
                  </span>
                )}
              </div>
            </div>
          </div>
          {onReopenOpportunity && opportunityId && (
            <button
              type="button"
              disabled={isReopeningOpportunity}
              onClick={() => void handleConfirmReopenOpportunity()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isReopeningOpportunity ? 'Reativando...' : 'Reativar Oportunidade'}</span>
            </button>
          )}
        </div>
      )}

      {/* Barra de Progresso do Funil de Vendas (Chevron linear limpo) */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-100 shadow-nexo">
        <div className="flex items-stretch overflow-x-auto no-scrollbar rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 gap-0.5">
          {SALES_PIPELINE_STAGES.map((st, idx) => {
            const isActive = st.id === stage

            // Clip-path de Chevron que conecta perfeitamente cada etapa
            const isFirst = idx === 0
            const isLast = idx === SALES_PIPELINE_STAGES.length - 1
            const clipPath = isFirst
              ? 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%)'
              : isLast
              ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 12px 50%)'
              : 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%)'

            return (
              <button
                key={st.id}
                type="button"
                disabled={isReadOnly || isUpdatingStage}
                onClick={() => {
                  if (isReadOnly) return
                  void handleSelectStage(st.id)
                }}
                title={isReadOnly ? `Etapa: ${st.title} (somente leitura)` : `Mover lead para: ${st.title}`}
                style={{
                  clipPath,
                  ...(isActive ? { backgroundColor: st.color } : {}),
                }}
                className={`group relative flex-1 min-w-[130px] py-2.5 px-3.5 flex items-center justify-center gap-1.5 text-xs font-bold transition-all whitespace-nowrap select-none disabled:opacity-60 ${
                  isActive
                    ? 'text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <st.Icon
                  className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : ''}`}
                  style={!isActive ? { color: st.color } : undefined}
                />
                <span className="truncate">{st.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main 2-Column Layout: Left = Active Tab Content | Right = Persistent Sticky Summary & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Tab Content */}
        <fieldset disabled={isReadOnly} className={`lg:col-span-7 space-y-5 border-none p-0 m-0 ${isReadOnly ? 'opacity-95' : ''}`}>
          {/* =========================================================================
              ABA 1: 1. CONTATO & REDES
             ========================================================================= */}
          {activeFormTab === 'contact' && (
            <>
              {/* Bloco 1.1: Dados do Contato / Cliente */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#EA580C]" />
                    <span>1. Dados do Contato / Cliente</span>
                  </h3>

                  {/* Seletor PF vs PJ */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPersonType('fisica')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        personType === 'fisica'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>Pessoa Física (PF)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersonType('juridica')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        personType === 'juridica'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>Pessoa Jurídica (PJ)</span>
                    </button>
                  </div>
                </div>

                {personType === 'fisica' ? (
                  /* ================= CAMPOS PESSOA FÍSICA ================= */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Nome Completo */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Nome Completo do Cliente:</label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos Eduardo dos Santos"
                        value={pfName}
                        onChange={(e) => setPfName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
                      />
                    </div>

                    {/* Documento com Tipo Dinâmico (CPF, RG ou CNH) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-600">Documento:</label>
                        <div className="flex items-center gap-1">
                          {(['cpf', 'rg', 'cnh'] as const).map((docOpt) => (
                            <button
                              key={docOpt}
                              type="button"
                              onClick={() => {
                                setPfDocType(docOpt)
                                if (pfDoc) setPfDoc(formatDocumentBy(pfDoc, docOpt))
                              }}
                              className={`px-2 py-0.5 rounded text-xs font-bold uppercase cursor-pointer transition-all ${
                                pfDocType === docOpt
                                  ? 'bg-[#EA580C] text-white'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {docOpt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder={
                          pfDocType === 'cpf'
                            ? '000.000.000-00'
                            : pfDocType === 'rg'
                            ? '00.000.000-0'
                            : '00000000000 (11 dígitos)'
                        }
                        value={pfDoc}
                        onChange={(e) => setPfDoc(formatDocumentBy(e.target.value, pfDocType))}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 font-mono transition-all font-medium"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">WhatsApp:</label>
                      <input
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(formatBRPhone(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 font-mono transition-all font-medium"
                      />
                    </div>

                    {/* E-mail */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">E-mail:</label>
                      <input
                        type="email"
                        placeholder="cliente@email.com.br"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  /* ================= CAMPOS PESSOA JURÍDICA ================= */
                  <div className="space-y-4">
                    {/* Bloco 1: Dados da Empresa */}
                    <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                        <Building2 className="w-4 h-4 text-[#EA580C]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Dados da Empresa
                        </h4>
                      </div>

                      {/* Linha 1: CNPJ e Razão Social */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        {/* CNPJ (5 cols) */}
                        <div className="sm:col-span-5">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-600">CNPJ:</label>
                            {loadingCnpj && (
                              <span className="text-xs text-[#EA580C] font-semibold flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Consultando...
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="00.000.000/0000-00"
                              value={pjCnpj}
                              onChange={(e) => handleCnpjChange(e.target.value)}
                              className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 font-mono transition-all font-medium pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => void handleCnpjSearch()}
                              title="Buscar Razão Social do CNPJ na Receita"
                              disabled={loadingCnpj || pjCnpj.replace(/\D/g, '').length !== 14}
                              className="absolute right-1.5 top-1.5 bottom-1.5 px-2 bg-slate-100 hover:bg-[#EA580C] hover:text-white text-slate-600 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-600 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {cnpjFeedback && (
                            <div className={`text-xs mt-1 font-medium ${cnpjFeedback.includes('sucesso') || cnpjFeedback.includes('localizada') ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {cnpjFeedback}
                            </div>
                          )}
                        </div>

                        {/* Razão Social (7 cols) */}
                        <div className="sm:col-span-7">
                          <label className="text-xs font-bold text-slate-600 block mb-1">Razão Social:</label>
                          <input
                            type="text"
                            placeholder="Ex: Empresa de Transportes e Frotas Ltda."
                            value={pjCompanyName}
                            onChange={(e) => setPjCompanyName(e.target.value)}
                            className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
                          />
                        </div>
                      </div>

                      {/* Linha 2: Inscrição Estadual (IE), Inscrição Municipal (IM) e Telefone Comercial */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">Inscrição Estadual (IE):</label>
                          <input
                            type="text"
                            placeholder="Ex: 123.456.789.012 ou ISENTO"
                            value={pjStateRegistration}
                            onChange={(e) => setPjStateRegistration(formatIE(e.target.value))}
                            className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 font-mono transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">Inscrição Municipal (IM):</label>
                          <input
                            type="text"
                            placeholder="Ex: 987654321 ou ISENTO"
                            value={pjMunicipalRegistration}
                            onChange={(e) => setPjMunicipalRegistration(e.target.value)}
                            className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 font-mono transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">Telefone Comercial:</label>
                          <input
                            type="text"
                            placeholder="(11) 3333-3333"
                            value={commercialPhone}
                            onChange={(e) => setCommercialPhone(formatBRPhone(e.target.value))}
                            className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 font-mono transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bloco 2: Dados do Responsável */}
                    <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                        <User className="w-4 h-4 text-[#EA580C]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Dados do Responsável
                        </h4>
                      </div>

                      {/* Linha 1: Nome do Responsável */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Nome do Responsável:</label>
                        <input
                          type="text"
                          placeholder="Ex: Marcos Silva (Diretor / Comprador)"
                          value={pjRepresentativeName}
                          onChange={(e) => setPjRepresentativeName(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
                        />
                      </div>

                      {/* Linha 2: WhatsApp e E-mail */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">WhatsApp:</label>
                          <input
                            type="text"
                            placeholder="(11) 99999-9999"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(formatBRPhone(e.target.value))}
                            className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 font-mono transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">E-mail:</label>
                          <input
                            type="email"
                            placeholder="contato@empresa.com.br"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Origem do Lead: WhatsApp, Instagram, Facebook, Manual, Site */}
                <div className="pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-600 block mb-1">Origem do Lead:</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLeadOrigin('whatsapp')}
                        title="WhatsApp"
                        className={`py-2 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                          leadOrigin === 'whatsapp'
                            ? 'bg-emerald-50 border-emerald-500 text-[#25D366] shadow-xs'
                            : 'bg-slate-50 border-slate-200/80 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <FaWhatsapp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setLeadOrigin('instagram')}
                        title="Instagram"
                        className={`py-2 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                          leadOrigin === 'instagram'
                            ? 'bg-pink-50 border-pink-500 text-[#E1306C] shadow-xs'
                            : 'bg-slate-50 border-slate-200/80 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <FaInstagram className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setLeadOrigin('facebook')}
                        title="Facebook"
                        className={`py-2 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                          leadOrigin === 'facebook'
                            ? 'bg-blue-50 border-blue-500 text-[#1877F2] shadow-xs'
                            : 'bg-slate-50 border-slate-200/80 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <FaFacebook className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setLeadOrigin('site')}
                        title="Site"
                        className={`py-2 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                          leadOrigin === 'site'
                            ? 'bg-orange-50 border-[#EA580C] text-[#EA580C] shadow-xs'
                            : 'bg-slate-50 border-slate-200/80 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <FaGlobe className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setLeadOrigin('manual')}
                        title="Manual / Loja"
                        className={`py-2 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                          leadOrigin === 'manual'
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200/80 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <FaStore className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

              {/* Bloco 1.2: Redes Sociais & Presença Digital (Instagram, Facebook e Website) */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#EA580C]" />
                    <span>Redes Sociais & Website do Cliente</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Instagram */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-1">
                      <FaInstagram className="w-3.5 h-3.5 text-[#E1306C]" />
                      <span>Link do Instagram:</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="url"
                        placeholder="https://instagram.com/perfil"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#E1306C] focus:ring-2 focus:ring-[#E1306C]/10 transition-all font-medium"
                      />
                      {instagramUrl.trim() && (
                        <a
                          href={
                            instagramUrl.trim().startsWith('http')
                              ? instagramUrl.trim()
                              : instagramUrl.trim().startsWith('instagram.com')
                              ? `https://${instagramUrl.trim()}`
                              : `https://instagram.com/${instagramUrl.trim().replace(/^@/, '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir perfil no Instagram"
                          className="absolute right-2.5 text-slate-400 hover:text-[#E1306C] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Facebook */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-1">
                      <FaFacebook className="w-3.5 h-3.5 text-[#1877F2]" />
                      <span>Link do Facebook:</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="url"
                        placeholder="https://facebook.com/pagina"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/10 transition-all font-medium"
                      />
                      {facebookUrl.trim() && (
                        <a
                          href={
                            facebookUrl.trim().startsWith('http')
                              ? facebookUrl.trim()
                              : facebookUrl.trim().startsWith('facebook.com')
                              ? `https://${facebookUrl.trim()}`
                              : `https://facebook.com/${facebookUrl.trim()}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir página no Facebook"
                          className="absolute right-2.5 text-slate-400 hover:text-[#1877F2] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-1">
                      <FaGlobe className="w-3.5 h-3.5 text-sky-600" />
                      <span>Website:</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="url"
                        placeholder="https://www.empresa.com.br"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/10 transition-all font-medium"
                      />
                      {websiteUrl.trim() && (
                        <a
                          href={
                            websiteUrl.trim().startsWith('http')
                              ? websiteUrl.trim()
                              : `https://${websiteUrl.trim()}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir Website"
                          className="absolute right-2.5 text-slate-400 hover:text-sky-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              ABA 2: 2. VEÍCULO & PRODUTOS
             ========================================================================= */}
          {activeFormTab === 'products' && (
            <>
              {/* 2.1 Veículo do Cliente */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#EA580C]" />
                    <span>Veículo do Cliente</span>
                  </h3>
                </div>

                {/* Grade de veículos distribuída em múltiplas linhas (sem rolagem horizontal) */}
                <div className="flex flex-wrap gap-2">
                  {loadingCatalog ? (
                    <BudgetVehiclePillsSkeleton />
                  ) : (
                    sortedVehicles.map((v) => {
                      const isSelected = selectedVehicleId === v.id
                      const cleanModel = getCleanVehicleModel(v.model)

                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            if (selectedVehicleId === v.id) {
                              setSelectedVehicleId('')
                              setItems([])
                            } else {
                              setSelectedVehicleId(v.id)
                              setItems([])
                            }
                          }}
                          className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#FFF3EA] border-[#EA580C] text-[#EA580C] font-bold shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700 font-medium'
                          }`}
                        >
                          <span className={isSelected ? 'text-[#EA580C]' : 'text-slate-400'}>
                            {renderVehicleIcon(v.model)}
                          </span>
                          <span className="text-xs whitespace-nowrap">{cleanModel}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* 2.2 Cor do Pedido (nível de pedido, vazio por padrão) */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#EA580C]" />
                  <span>Cor</span>
                </h3>
                <select
                  value={productColor}
                  onChange={(e) => setProductColor(e.target.value)}
                  aria-label="Cor do pedido"
                  className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#EA580C] cursor-pointer"
                >
                  <option value=""> </option>
                  <option value="Preto">Preto</option>
                  <option value="Branco">Branco</option>
                </select>
              </div>

              {/* 2.3 Bagageiros e Acessórios Compatíveis */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Bagageiros e Acessórios Compatíveis
                  </h3>
                </div>

                {/* Campo de Busca Dinâmica em Tempo Real */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Buscar item por nome, medida ou característica..."
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
                  />
                  {productSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setProductSearchQuery('')}
                      title="Limpar busca"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Pílulas de Filtragem Rápida por Categoria */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'bagageiro', label: 'Bagageiros' },
                    { id: 'escada', label: 'Escadas' },
                    { id: 'suporte', label: 'Suportes & Fixação' },
                    { id: 'outros', label: 'Outros' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setProductCategoryFilter(cat.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        productCategoryFilter === cat.id
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {loadingCatalog ? (
                    <BudgetProductListSkeleton />
                  ) : filteredCompatibleProducts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
                      Nenhum produto encontrado para este filtro ou busca.
                    </div>
                  ) : (
                    filteredCompatibleProducts.map((p) => {
                      const inBudget = items.find((i) => i.product.id === p.id)

                      return (
                        <div
                          key={p.id}
                          className={`p-3 rounded-xl border transition-colors ${
                            inBudget
                              ? 'bg-orange-50/40 border-orange-200/90'
                              : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">{p.name}</span>
                              </div>

                              {/* Dimensões, Peso e Valor do Produto */}
                              <div className="flex items-center gap-2 flex-wrap text-xs mt-1.5 font-mono text-slate-500">
                                {p.dimensions && (
                                  <span className="text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1.5">
                                    <span>📏</span>
                                    <span>{p.dimensions}</span>
                                  </span>
                                )}
                                {p.weight_kg !== undefined && p.weight_kg > 0 && (
                                  <span className="text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1.5">
                                    <FaWeightHanging className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{p.weight_kg} kg</span>
                                  </span>
                                )}
                                <span className="text-slate-900 font-bold ml-auto font-sans">
                                  {formatCurrency(p.base_price_10x)}
                                </span>
                              </div>
                            </div>

                            {inBudget ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleAddItem(p)}
                                  title="Adicionar mais uma unidade"
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Adicionado ({inBudget.quantity})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(p.id)}
                                  title="Remover item do orçamento"
                                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddItem(p)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 bg-white hover:bg-orange-50 text-slate-700 hover:text-[#EA580C] border border-slate-200"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adicionar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              ABA 3: 3. MODALIDADE & ENTREGA/COLETA
             ========================================================================= */}
          {activeFormTab === 'fulfillment' && (
            <>
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  3. Modalidade & Entrega / Coleta
                </h3>

                {/* Toggle de Modalidade */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillment('transportadora_envio')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      fulfillment === 'transportadora_envio'
                        ? 'bg-[#FFF3EA] border-[#EA580C] text-slate-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${fulfillment === 'transportadora_envio' ? 'bg-[#EA580C] text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold">Transportadora (Envio)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillment('instalacao_loja')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      fulfillment === 'instalacao_loja'
                        ? 'bg-[#FFF3EA] border-[#EA580C] text-slate-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${fulfillment === 'instalacao_loja' ? 'bg-[#EA580C] text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold">Instalação na Loja</div>
                    </div>
                  </button>
                </div>

                {/* Se for Transportadora */}
                {fulfillment === 'transportadora_envio' && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                    {/* CEP do Cliente */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">
                        CEP do Cliente:
                      </label>
                      <div className="flex gap-2 max-w-sm">
                        <input
                          type="text"
                          placeholder="00000-000"
                          value={cep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleCepSearch}
                          disabled={loadingCep}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {loadingCep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                          <span>Buscar</span>
                        </button>
                      </div>
                    </div>

                    {cepError && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                        {cepError}. Preencha os campos abaixo manualmente.
                      </div>
                    )}

                    {/* Campos de endereço completos */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-8">
                        <label className="text-xs font-bold text-slate-500 block mb-0.5">Rua / Logradouro:</label>
                        <input
                          type="text"
                          placeholder="Ex: Av. Amazonas"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C]"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-xs font-bold text-slate-500 block mb-0.5">Número:</label>
                        <input
                          type="text"
                          placeholder="Ex: 1420"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-4">
                        <label className="text-xs font-bold text-slate-500 block mb-0.5">Bairro:</label>
                        <input
                          type="text"
                          placeholder="Ex: Centro"
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C]"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="text-xs font-bold text-slate-500 block mb-0.5">Cidade:</label>
                        <input
                          type="text"
                          placeholder="Ex: Belo Horizonte"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C]"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-xs font-bold text-slate-500 block mb-0.5">UF:</label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-medium cursor-pointer"
                        >
                          <option value="">UF</option>
                          {BRAZILIAN_STATES.map((uf) => (
                            <option key={uf} value={uf}>
                              {uf}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Peso Total da Carga e Valor do Frete alinhados */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Peso Total da Carga */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <FaWeightHanging className="w-3 h-3 text-slate-400" />
                            <span>Peso Total da Carga:</span>
                          </label>
                          {isEditingWeight ? (
                            <div className="flex items-center gap-2">
                              {customWeight !== null && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomWeight(null)
                                    setIsEditingWeight(false)
                                  }}
                                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                                  title="Restaurar soma automática dos produtos do orçamento"
                                >
                                  Restaurar auto
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setIsEditingWeight(false)}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Concluir
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (customWeight === null) {
                                  setCustomWeight(budget.totalWeightKg)
                                }
                                setIsEditingWeight(true)
                              }}
                              className="text-xs font-bold text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                              {customWeight !== null ? 'Alterar manual' : 'Editar'}
                            </button>
                          )}
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            readOnly={!isEditingWeight}
                            disabled={!isEditingWeight}
                            value={customWeight !== null ? customWeight : (budget.totalWeightKg || '')}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseFloat(e.target.value)
                              setCustomWeight(val)
                            }}
                            className={`w-full border rounded-xl px-3 py-2 pr-12 text-xs font-mono transition-colors ${
                              isEditingWeight
                                ? 'bg-white border-[#EA580C] text-slate-900 focus:outline-none ring-2 ring-orange-500/10'
                                : 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed select-none'
                            }`}
                            placeholder="0"
                          />
                          <div className="absolute right-3 flex items-center gap-1 text-slate-400 pointer-events-none">
                            {!isEditingWeight && <Lock className="w-3 h-3 text-slate-400" />}
                            <span className="text-xs font-mono">kg</span>
                          </div>
                        </div>
                      </div>

                      {/* Valor do Frete */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          Valor do Frete (R$):
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="R$ 0,00"
                          value={formatCurrencyInput(freightValue)}
                          onChange={(e) => setFreightValue(parseCurrencyInput(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono"
                        />
                      </div>
                    </div>

                    {/* Nome da Transportadora, Cotação Nº e Contato */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          Nome da Transportadora:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Braspress, Jadlog, Jamef..."
                          value={shippingCarrierName}
                          onChange={(e) => setShippingCarrierName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          Cotação Frete Nº:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 21856"
                          value={shippingQuoteNumber}
                          onChange={(e) => setShippingQuoteNumber(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          Contato Transportadora:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: (11) 3774-4674 / Sr. Marcos"
                          value={shippingCarrierContact}
                          onChange={(e) => setShippingCarrierContact(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C]"
                        />
                      </div>
                    </div>

                    {/* Prazos de Produção e Entrega (formato data) & Dimensões do Volume */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <CustomDatePicker
                        label="Prazo de Produção:"
                        value={productionLeadTime}
                        onChange={setProductionLeadTime}
                        placeholder="Selecione a data"
                      />

                      <CustomDatePicker
                        label="Prazo de Entrega:"
                        value={deliveryLeadTime}
                        onChange={setDeliveryLeadTime}
                        placeholder="Selecione a data"
                      />

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          Dimensões Volume (C x L x A):
                        </label>
                        <input
                          type="text"
                          placeholder={autoLargestDimensions || 'Ex: 220 x 140 x 35 cm'}
                          value={shippingPackageDimensions || autoLargestDimensions}
                          onChange={(e) => setShippingPackageDimensions(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono"
                        />
                      </div>
                    </div>

                    {/* Código de Rastreio */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">
                        Código de Rastreio:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: BR123456789"
                        value={shippingTrackingCode}
                        onChange={(e) => setShippingTrackingCode(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono"
                      />
                    </div>

                    {/* Programação da Coleta */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                        <span>Programação da Coleta:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CustomDatePicker
                          label="Data da Coleta:"
                          value={pickupDate}
                          onChange={setPickupDate}
                          placeholder="Selecione data da coleta"
                        />

                        <CustomTimePicker
                          label="Horário da Coleta:"
                          value={pickupTime}
                          onChange={setPickupTime}
                          placeholder="Selecione horário da coleta"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Se for Instalação na Loja */}
                {fulfillment === 'instalacao_loja' && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                    {/* Custo da Instalação & Prazo de Produção */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          Custo da Instalação (R$):
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatCurrencyInput(installationCost)}
                          onChange={(e) => setInstallationCost(parseCurrencyInput(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono"
                          placeholder="R$ 0,00"
                        />
                      </div>

                      <CustomDatePicker
                        label="Prazo de Produção:"
                        value={productionLeadTime}
                        onChange={setProductionLeadTime}
                        placeholder="Selecione a data"
                      />
                    </div>

                    {/* Data e Horário da Instalação */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                        <span>Agendamento da Instalação na Loja:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CustomDatePicker
                          label="Data da Instalação:"
                          value={installationDate}
                          onChange={setInstallationDate}
                          placeholder="Selecione data da instalação"
                        />

                        <CustomTimePicker
                          label="Horário da Instalação:"
                          value={installationTime}
                          onChange={setInstallationTime}
                          placeholder="Selecione horário da instalação"
                        />

                        {installationConflict && (
                          <div className="sm:col-span-2 p-3.5 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-900 text-xs flex items-start gap-3 shadow-2xs">
                            <AlertTriangle className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                            <div className="space-y-1 leading-relaxed">
                              <div className="font-bold text-amber-950 flex items-center gap-2">
                                <span>Atenção: Já existe instalação agendada neste horário!</span>
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold">
                                  {installationConflict.code}
                                </span>
                              </div>
                              <div>
                                Já existe uma instalação agendada para <strong>{installationConflict.date.split('-').reverse().join('/')} às {installationConflict.time}</strong> ({installationConflict.client} — {installationConflict.vehicle}).
                              </div>
                              <div className="text-xs text-amber-800">
                                Recomendamos selecionar outro horário disponível para evitar espera na montagem do veículo.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* =========================================================================
              ABA 4: 4. HISTÓRICO, COMENTÁRIOS & TAREFAS
             ========================================================================= */}
          {activeFormTab === 'history' && (
            <>
              {/* Card 1: Observações Internas */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Observações Internas</h3>
                      <p className="text-xs text-slate-500">Múltiplos registros salvos com autor, data e hora de registro.</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {comments.length} registro(s)
                  </span>
                </div>

                {/* Caixa de Entrada de Observação */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Adicione uma observação sobre o cliente, negociação de valores, detalhes do veículo..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition-all resize-none"
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {commentSavedMsg ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-fade-in font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>✓ Observação salva no perfil do lead!</span>
                      </div>
                    ) : <div />}
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!newCommentText.trim()}
                      className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Adicionar Observação</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Tarefas & Lembretes */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#EA580C]">
                      <ListTodo className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Tarefas & Lembretes</h3>
                      <p className="text-xs text-slate-500">Defina tarefas com prazo e responsável para receber alertas e notificações no CRM.</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {tasks.filter((t) => !t.completed).length} pendente(s)
                  </span>
                </div>

                {/* Formulário de Criação de Tarefa */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-700">Nova Tarefa / Lembrete:</div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                    <div className="md:col-span-12">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Ex: Ligar para confirmar medidas, enviar fotos de instalação..."
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition-all"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <CustomDatePicker
                        value={newTaskDate}
                        onChange={(d) => setNewTaskDate(d)}
                        placeholder="Data do lembrete"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <CustomTimePicker
                        value={newTaskTime}
                        onChange={setNewTaskTime}
                        placeholder="Horário do lembrete"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <div className="relative flex items-center">
                        <select
                          value={newTaskAssignee}
                          onChange={(e) => setNewTaskAssignee(e.target.value as any)}
                          className={`w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-white border border-slate-200/90 rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#EA580C]/10 focus:border-[#EA580C] cursor-pointer shadow-2xs ${
                            newTaskAssignee ? 'text-slate-900 font-bold' : 'text-slate-400 font-sans'
                          }`}
                        >
                          <option value="">Responsável</option>
                          <option value="Norlando">Norlando</option>
                          <option value="Igor">Igor</option>
                          <option value="Loja">Loja</option>
                        </select>
                        {newTaskAssignee && (
                          <button
                            type="button"
                            onClick={() => setNewTaskAssignee('')}
                            className="absolute right-7 p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            title="Limpar responsável"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddTask}
                        disabled={!newTaskTitle.trim()}
                        className="w-full py-2 px-3 bg-[#EA580C] hover:bg-[#c2410c] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Criar</span>
                      </button>
                    </div>
                  </div>

                  {taskSavedMsg && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-fade-in font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>✓ Tarefa criada e salva no perfil do lead!</span>
                    </div>
                  )}
                </div>

                {/* Lista de Tarefas */}
                {tasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-xl">
                    Nenhuma tarefa cadastrada. Adicione uma tarefa acima para gerar alertas para a equipe.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => {
                      const today = new Date().toISOString().split('T')[0]
                      const isOverdue = !task.completed && Boolean(task.due_date && task.due_date < today)
                      const isToday = !task.completed && Boolean(task.due_date && task.due_date === today)

                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            task.completed
                              ? 'bg-slate-50/60 border-slate-200 opacity-70'
                              : isOverdue
                              ? 'bg-rose-50/40 border-rose-200'
                              : isToday
                              ? 'bg-amber-50/40 border-amber-200'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleTask(task.id)}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                task.completed
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-300 hover:border-[#EA580C] bg-white'
                              }`}
                            >
                              {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {task.assigned_to ? (
                                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    {task.assigned_to === 'Loja' ? <FaStore className="w-2.5 h-2.5 text-amber-600" /> : <FaUser className="w-2.5 h-2.5 text-slate-400" />}
                                    {task.assigned_to}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Sem responsável</span>
                                )}
                                <span>•</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  task.completed
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : isOverdue
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                                    : isToday
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {task.completed
                                    ? 'Concluída'
                                    : !task.due_date
                                    ? 'Sem prazo'
                                    : isOverdue
                                    ? `⚠️ Atrasada: ${task.due_date}${task.due_time ? ` às ${task.due_time}` : ''}`
                                    : isToday
                                    ? `⏰ Hoje${task.due_time ? ` às ${task.due_time}` : ''}`
                                    : `📅 ${task.due_date}${task.due_time ? ` às ${task.due_time}` : ''}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Excluir tarefa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>


              {/* Card 3: Linha do Tempo & Histórico Completo do Lead */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Linha do Tempo & Histórico</h3>
                      <p className="text-xs text-slate-500">Histórico completo de tudo que aconteceu com o lead, com data e hora.</p>
                    </div>
                  </div>

                  {/* Filtro de Histórico */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        historyFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('comments')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        historyFilter === 'comments'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Comentários
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('history')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        historyFilter === 'history'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Etapas
                    </button>
                  </div>
                </div>

                {/* Timeline Feed */}
                {timelineItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-xl">
                    Nenhum registro encontrado para este filtro.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {timelineItems.map((item) => (
                      <div key={item.id} className="relative">
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-xs shadow-2xs ${
                          item.isComment
                            ? 'bg-sky-500 text-white'
                            : 'bg-orange-500 text-white'
                        }`}>
                          {item.isComment ? (
                            <MessageSquare className="w-2.5 h-2.5" />
                          ) : (
                            <Clock className="w-2.5 h-2.5" />
                          )}
                        </div>
                        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">{item.title}</span>
                            <span className="text-xs font-mono text-slate-500">
                              {new Date(item.date).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap">{item.content}</p>
                          {item.author && (
                            <div className="pt-1 border-t border-slate-200/50 flex items-center gap-1.5 text-xs text-slate-500">
                              <span>Registrado por:</span>
                              <strong className="text-slate-700">{item.author}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* =========================================================================
              ABA 5: 5. ANEXOS & PROPOSTAS
             ========================================================================= */}
          {activeFormTab === 'attachments' && (
            <>
              {/* Central de Ações & Upload de Anexos */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-[#EA580C]" />
                      <span>Central de Anexos & Propostas</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Histórico completo de propostas comerciais em PDF, fotos, notas fiscais e documentos do orçamento.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 self-start sm:self-auto">
                    {attachments.length} {attachments.length === 1 ? 'arquivo' : 'arquivos'}
                  </span>
                </div>

                {/* Input de arquivo universal oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.xml,.txt,.csv"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Grid de Ações Rápidas: Gerar Orçamento PDF + Anexar Arquivos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card/Botão 1: Gerar Orçamento PDF */}
                  <button
                    type="button"
                    onClick={handleGenerateAndAttachProposal}
                    className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-50 hover:border-[#EA580C] text-left transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs active:scale-[0.99]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[#EA580C] transition-colors flex items-center gap-1.5">
                        <span>Gerar Orçamento em PDF</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Gera a proposta comercial oficial e salva automaticamente no histórico de anexos.
                      </p>
                    </div>
                  </button>

                  {/* Card/Botão 2: Anexar Arquivos ou Fotos */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-300 text-left transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs active:scale-[0.99]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Anexar Arquivos ou Fotos</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Imagens, PDFs, notas fiscais, planilhas e comprovantes de pagamento.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Feedback de Sucesso ao Gerar Proposta */}
                {proposalSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ Proposta comercial gerada com sucesso e anexada automaticamente ao pedido!</span>
                  </div>
                )}
              </div>

              {/* Lista e Histórico de Anexos */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-nexo space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Arquivos Anexados ao Pedido / Lead
                    </h3>
                  </div>
                </div>

                {attachments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic space-y-1.5 border border-dashed border-slate-200 rounded-xl">
                    <p className="font-medium text-slate-500">Nenhum anexo registrado até o momento.</p>
                    <p className="text-xs text-slate-400">
                      Gere a proposta comercial em PDF ou anexe arquivos pelos botões acima.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {attachments.map((doc) => {
                      const isXml = doc.type === 'nfe_xml' || doc.name.toLowerCase().endsWith('.xml')
                      const isImage = doc.type === 'imagem' || /\.(png|jpe?g|webp|gif|svg)$/i.test(doc.name)
                      const isSpreadsheet = doc.type === 'planilha' || /\.(xlsx?|csv)$/i.test(doc.name)
                      const isProposal = doc.type === 'orcamento_pdf'

                      return (
                        <div
                          key={doc.id}
                          className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/60 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isProposal
                                ? 'bg-orange-100 text-[#EA580C]'
                                : isImage
                                ? 'bg-purple-100 text-purple-700'
                                : isSpreadsheet
                                ? 'bg-emerald-100 text-emerald-700'
                                : isXml
                                ? 'bg-teal-100 text-teal-700'
                                : 'bg-sky-100 text-sky-700'
                            }`}>
                              {isProposal ? (
                                <FileText className="w-5 h-5" />
                              ) : isImage ? (
                                <ImageIcon className="w-5 h-5" />
                              ) : isSpreadsheet ? (
                                <FileSpreadsheet className="w-5 h-5" />
                              ) : isXml ? (
                                <ReceiptText className="w-5 h-5" />
                              ) : (
                                <File className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 truncate max-w-[280px] sm:max-w-[360px]" title={doc.name}>
                                  {doc.name}
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  isProposal
                                    ? 'bg-orange-50 text-[#EA580C] border border-orange-200'
                                    : isImage
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : isSpreadsheet
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : isXml
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                    : 'bg-sky-50 text-sky-700 border border-sky-200'
                                }`}>
                                  {isProposal
                                    ? 'Proposta Comercial (PDF)'
                                    : isImage
                                    ? 'Imagem'
                                    : isSpreadsheet
                                    ? 'Planilha'
                                    : isXml
                                    ? 'Nota Fiscal (XML)'
                                    : doc.type === 'nfe_pdf'
                                    ? 'Nota Fiscal (PDF/Danfe)'
                                    : 'Documento'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                                <span>{doc.file_size || 'N/A'}</span>
                                <span>•</span>
                                <span>{new Date(doc.uploaded_at).toLocaleString('pt-BR')}</span>
                                {doc.uploaded_by && (
                                  <>
                                    <span>•</span>
                                    <span className="font-sans text-slate-600">
                                      {isProposal ? 'Gerado por:' : 'Anexado por:'} <strong className="text-slate-800">{doc.uploaded_by}</strong>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Visualizar */}
                            <button
                              type="button"
                              onClick={() => handleViewDocument(doc)}
                              title="Visualizar em nova aba"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Visualizar</span>
                            </button>

                            {/* Baixar */}
                            <button
                              type="button"
                              onClick={() => handleDownloadDocument(doc)}
                              title="Baixar arquivo"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Baixar</span>
                            </button>

                            {/* Excluir */}
                            <button
                              type="button"
                              onClick={() => setAttachmentToDelete(doc)}
                              title="Remover anexo"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </fieldset>

        {/* Right Column: Persistent Sticky Official Quotation Sheet & Quick Actions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm sticky top-20">

            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <img 
                  src={ROBUSTY_LOGO_BASE64} 
                  alt="Robusty" 
                  className="h-7 w-auto object-contain" 
                />
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-500">
                  {formatOrderCode(orderNumber)}
                </span>
              </div>
            </div>

            {/* Customer & Vehicle Header */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-xs mb-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-900 truncate">{customerName || 'Cliente não informado'}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500">Veículo:</span>
                <span className="font-semibold text-slate-800 truncate">
                  {selectedVehicle ? getCleanVehicleModel(selectedVehicle.model) : 'Não selecionado'}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500">Modalidade:</span>
                <span className="text-slate-800 font-medium">
                  {fulfillment === 'transportadora_envio' ? 'Envio por Transportadora' : 'Instalação na Loja'}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500">Responsável:</span>
                <span className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                  {assignedTo === 'Loja' ? (
                    <FaStore className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  ) : (
                    <FaUser className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                  <span>{assignedTo}</span>
                </span>
              </div>
              {(instagramUrl.trim() || facebookUrl.trim() || websiteUrl.trim()) && (
                <div className="flex justify-between items-center gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Redes Conectadas:</span>
                  <div className="flex items-center gap-1.5">
                    {instagramUrl.trim() && <FaInstagram className="w-3.5 h-3.5 text-[#E1306C]" title={`Instagram: ${instagramUrl}`} />}
                    {facebookUrl.trim() && <FaFacebook className="w-3.5 h-3.5 text-[#1877F2]" title={`Facebook: ${facebookUrl}`} />}
                    {websiteUrl.trim() && <FaGlobe className="w-3.5 h-3.5 text-sky-600" title={`Website: ${websiteUrl}`} />}
                  </div>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-2 mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Itens Adicionados ({items.length})</span>
                {effectiveWeightKg > 0 && (
                  <span className="font-mono text-slate-500">Peso Total: {effectiveWeightKg} kg</span>
                )}
              </div>

              {items.length === 0 ? (
                <div className="py-5 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Nenhum produto adicionado ao orçamento
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {items.map((i) => (
                    <div
                      key={i.product.id}
                      className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-bold text-slate-900 truncate">{i.product.name}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {i.quantity}x {formatCurrency(i.product.base_price_10x)}
                          {i.product.weight_kg ? ` • ${i.product.weight_kg * i.quantity} kg` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(i.product.id, -1)}
                          className="w-5 h-5 rounded bg-white text-slate-600 hover:bg-slate-200 flex items-center justify-center font-mono border border-slate-200 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold text-slate-900 px-1">{i.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(i.product.id, 1)}
                          className="w-5 h-5 rounded bg-white text-slate-600 hover:bg-slate-200 flex items-center justify-center font-mono border border-slate-200 cursor-pointer"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(i.product.id)}
                          className="ml-1 text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Condição de Pagamento (Forma Padrão Direta com botão Combinar 2 Meios) */}
            <div className="pt-3 border-t border-slate-100 mb-4 space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#EA580C]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Condição de Pagamento
                  </span>
                </div>
                
                {/* Botão de Alternância Sem Switch: "Combinar 2 meios" ou "Voltar p/ Forma única" */}
                {paymentMode === 'single' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('split')
                      if (paymentSplits.length === 0) {
                        const half = Math.round((budget.finalTotal / 2) * 100) / 100
                        const rest = Math.round((budget.finalTotal - half) * 100) / 100
                        setPaymentSplits([
                          {
                            id: `split-${Date.now()}-1`,
                            method: 'pix',
                            amount: half,
                            installments: 1,
                            notes: 'Entrada PIX'
                          },
                          {
                            id: `split-${Date.now()}-2`,
                            method: 'cartao_link_igor',
                            amount: rest,
                            installments: 10,
                            notes: 'Restante Cartão'
                          }
                        ])
                      }
                    }}
                    className="text-xs font-bold text-[#EA580C] hover:text-orange-700 bg-orange-50 hover:bg-orange-100/80 border border-orange-200/80 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Dividir o pagamento em duas ou mais formas (ex: entrada no PIX + restante no Cartão)"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>Combinar 2 meios</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPaymentMode('single')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Retornar para forma única de pagamento"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Forma única</span>
                  </button>
                )}
              </div>

              {paymentMode === 'single' ? (
                /* ================= MODO FORMA ÚNICA (PADRÃO INLINE) ================= */
                <div className="space-y-3">
                  {/* 3 Formas Padrão em Linha Única (Inline) */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePaymentMethodSelect('pix')}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        paymentMethod === 'pix'
                          ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">À vista</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePaymentMethodSelect('boleto')}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        paymentMethod === 'boleto'
                          ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <ReceiptText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Boleto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePaymentMethodSelect('cartao_link_igor')}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        paymentMethod === 'cartao_link_igor' || paymentMethod === 'cartao_presencial'
                          ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Cartão</span>
                    </button>
                  </div>

                  {/* Se for À Vista: Escolha do Subtipo Inline (sem texto redundante 'PIX Instantâneo') */}
                  {paymentMethod === 'pix' && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <span className="text-xs font-bold text-slate-600 block">Forma À Vista:</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: 'pix', label: 'PIX' },
                          { id: 'debito', label: 'Débito' },
                          { id: 'transferencia', label: 'Transf.' },
                          { id: 'dinheiro', label: 'Dinheiro' }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPaymentSubtype(opt.id as CashPaymentSubtype)}
                            className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all border cursor-pointer text-center truncate ${
                              paymentSubtype === opt.id
                                ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Se for Cartão: Seleção de Parcelas */}
                  {(paymentMethod === 'cartao_link_igor' || paymentMethod === 'cartao_presencial') && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 font-bold">Parcelas no Cartão:</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {Math.max(1, cardInstallments || 1)}x de {formatCurrency(Math.round((budget.finalTotal / Math.max(1, cardInstallments || 1)) * 100) / 100)} sem juros
                        </span>
                      </div>
                      <select
                        value={cardInstallments}
                        onChange={(e) => setCardInstallments(parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={num}>
                            {num}x sem juros ({formatCurrency(Math.round((budget.finalTotal / num) * 100) / 100)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Concessão de Desconto Comercial (Exceção) para À vista ou Boleto */}
                  {(paymentMethod === 'pix' || paymentMethod === 'boleto') && maxAllowedDiscount > 0 && (
                    <div>
                      {discountPercent === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTempDiscountPercent(0)
                            setDiscountModalOpen(true)
                          }}
                          className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-[#EA580C] hover:bg-orange-50/50 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#EA580C] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Percent className="w-3.5 h-3.5 text-slate-400" />
                          <span>Conceder Desconto (Exceção)</span>
                        </button>
                      ) : (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5 animate-in fade-in-50">
                          <div className="flex items-center justify-between text-emerald-900 font-bold">
                            <div className="flex items-center gap-1.5">
                              <Percent className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Desconto Concedido: {discountPercent}%</span>
                            </div>
                            <span className="font-mono text-emerald-700">-{formatCurrency(budget.discountValue)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-emerald-200/60">
                            <span className="italic">Exceção comercial autorizada</span>
                            <div className="flex items-center gap-2 font-bold">
                              <button
                                type="button"
                                onClick={() => {
                                  setTempDiscountPercent(discountPercent)
                                  setDiscountModalOpen(true)
                                }}
                                className="text-[#EA580C] hover:underline cursor-pointer"
                              >
                                Alterar
                              </button>
                              <button
                                type="button"
                                onClick={() => setDiscountPercent(0)}
                                className="text-rose-600 hover:underline cursor-pointer"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* ================= MODO PAGAMENTO DIVIDIDO (MÚLTIPLAS FORMAS) ================= */
                <div className="space-y-3">
                  {/* Painel de Alocação de Saldo em Tempo Real */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Total do Pedido:</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(budget.finalTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Total Alocado:</span>
                      <span className="font-mono font-bold text-emerald-700">{formatCurrency(totalSplitsAllocated)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                      <span className="font-semibold text-slate-700">Saldo Restante:</span>
                      {remainingSplitBalance === 0 ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> 100% Distribuído
                        </span>
                      ) : remainingSplitBalance > 0 ? (
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          +{formatCurrency(remainingSplitBalance)}
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Excesso: {formatCurrency(Math.abs(remainingSplitBalance))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lista de Formas de Pagamento Adicionadas */}
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {paymentSplits.map((split, index) => {
                      const isCard = split.method === 'cartao_link_igor' || split.method === 'cartao_presencial'
                      return (
                        <div
                          key={split.id || index}
                          className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">
                              Forma #{index + 1}
                            </span>
                            {paymentSplits.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentSplits((prev) => prev.filter((_, i) => i !== index))
                                }}
                                className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                title="Remover esta forma"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Método */}
                            <div>
                              <select
                                value={split.method}
                                onChange={(e) => {
                                  const nextMethod = e.target.value as PaymentMethod
                                  setPaymentSplits((prev) =>
                                    prev.map((s, i) => (i === index ? { ...s, method: nextMethod } : s))
                                  )
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#EA580C] font-medium cursor-pointer"
                              >
                                <option value="pix">PIX / À vista</option>
                                <option value="cartao_link_igor">Cartão de Crédito</option>
                                <option value="boleto">Boleto Bancário</option>
                                <option value="dinheiro">Dinheiro / Transf.</option>
                              </select>
                            </div>

                            {/* Valor (R$) */}
                            <div>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="R$ 0,00"
                                value={formatCurrencyInput(split.amount || 0)}
                                onChange={(e) => {
                                  const val = parseCurrencyInput(e.target.value)
                                  setPaymentSplits((prev) =>
                                    prev.map((s, i) => (i === index ? { ...s, amount: val } : s))
                                  )
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-[#EA580C]"
                              />
                            </div>
                          </div>

                          {/* Se for Cartão: Parcelas */}
                          {isCard && (
                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200/80">
                              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Parcelamento:</span>
                              <select
                                value={split.installments || 1}
                                onChange={(e) => {
                                  const inst = parseInt(e.target.value) || 1
                                  setPaymentSplits((prev) =>
                                    prev.map((s, i) => (i === index ? { ...s, installments: inst } : s))
                                  )
                                }}
                                className="flex-1 bg-white border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#EA580C]"
                              >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                    <option key={n} value={n}>
                                      {n}x de {formatCurrency(Math.round(((split.amount || 0) / n) * 100) / 100)}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}

                          {/* Observação rápida */}
                          <div>
                            <input
                              type="text"
                              placeholder="Observação (ex: Entrada PIX, Restante na entrega)"
                              value={split.notes || ''}
                              onChange={(e) => {
                                const txt = e.target.value
                                setPaymentSplits((prev) =>
                                  prev.map((s, i) => (i === index ? { ...s, notes: txt } : s))
                                )
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C]"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Ações do Pagamento Dividido */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const newSplitAmount = remainingSplitBalance > 0 ? remainingSplitBalance : 0
                        setPaymentSplits((prev) => [
                          ...prev,
                          {
                            id: `split-${Date.now()}`,
                            method: 'cartao_link_igor',
                            amount: newSplitAmount,
                            installments: 5,
                            notes: ''
                          }
                        ])
                      }}
                      className="flex-1 py-2 px-2.5 bg-orange-50 hover:bg-orange-100 text-[#EA580C] border border-orange-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Forma</span>
                    </button>

                    {remainingSplitBalance > 0 && paymentSplits.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentSplits((prev) => {
                            const lastIdx = prev.length - 1
                            return prev.map((s, idx) =>
                              idx === lastIdx ? { ...s, amount: Math.round(((s.amount || 0) + remainingSplitBalance) * 100) / 100 } : s
                            )
                          })
                        }}
                        className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        title="Completar o saldo que falta nesta última forma"
                      >
                        Auto-completar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Resumo Financeiro */}
            <div className="bg-[#F8F9FA] p-4 rounded-2xl border border-slate-100 space-y-2 font-mono text-xs mb-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produtos:</span>
                <span className="text-[#121212] font-bold">{formatCurrency(budget.subtotal)}</span>
              </div>

              {budget.discountValue > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Desconto ({budget.discountPercent}%):</span>
                  <span>-{formatCurrency(budget.discountValue)}</span>
                </div>
              )}

              {fulfillment === 'transportadora_envio' && (
                <div className="flex justify-between text-slate-600">
                  <span>Frete Transportadora:</span>
                  <span className="text-[#121212] font-bold">+{formatCurrency(budget.freightValue)}</span>
                </div>
              )}

              {fulfillment === 'instalacao_loja' && (
                <div className="flex justify-between text-slate-600">
                  <span>Instalação Loja:</span>
                  <span className="text-[#121212] font-bold">+{formatCurrency(budget.installationValue)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-bold text-sm text-[#121212]">VALOR TOTAL:</span>
                <span className="font-bold text-2xl text-[#EA580C] font-sans">
                  {formatCurrency(budget.finalTotal)}
                </span>
              </div>

              {budget.savingsVs10x > 0 && (
                <div className="text-xs text-emerald-700 text-right font-sans font-semibold pt-0.5">
                  Economia cliente: {formatCurrency(budget.savingsVs10x)}
                </div>
              )}
            </div>

            {/* Botões Principais: Se somente leitura, exibe Reativar e Voltar; caso contrário, Salvar e Gerar Pedido */}
            <div className="space-y-2.5">
              {isReadOnly ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={isReopeningOpportunity}
                    onClick={() => void handleConfirmReopenOpportunity()}
                    className="w-full py-3 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    <span>{isReopeningOpportunity ? 'Reativando...' : 'Reativar Oportunidade'}</span>
                  </button>

                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 shrink-0" />
                      <span>Voltar</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {/* Botão Salvar (Cria/atualiza o card no Funil de Vendas) */}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="py-3 px-3 rounded-xl text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <Save className="w-4 h-4 shrink-0" />}
                    <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                  </button>

                  {/* Botão Gerar Pedido (Integra diretamente com o Funil de Pedidos) */}
                  <button
                    type="button"
                    onClick={handleGenerateOrderAction}
                    disabled={isSaving}
                    className="py-3 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <Truck className="w-4 h-4 shrink-0" />}
                    <span>Gerar Pedido</span>
                  </button>
                </div>
              )}

              {savedSuccess && (
                <div className="text-center text-xs text-emerald-700 py-1 font-bold animate-fade-in bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                  ✓ Card de oportunidade salvo no Funil de Vendas ({formatOrderCode(orderNumber)})!
                </div>
              )}

              {orderGeneratedSuccess && (
                <div className="text-center text-xs text-blue-700 py-1 font-bold animate-fade-in bg-blue-50 rounded-lg p-2 border border-blue-200">
                  ✓ Pedido criado e integrado ao Funil de Pedidos ({formatOrderCode(orderNumber)})!
                </div>
              )}

              {/* Ações Secundárias com Modal Padronizado */}
              {isOpportunitySaved && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setLostModalOpen(true)}
                      className="text-slate-500 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                    >
                      <ArchiveX className="w-3.5 h-3.5" />
                      <span>Encerrar Negociação</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(true)}
                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1 font-medium ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Apagar Orçamento</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* MODAL 2: ALERTA PADRONIZADO DE CONFLITO DE INSTALAÇÃO */}
      <CustomAlertModal
        isOpen={conflictModalOpen}
        onClose={() => {
          setConflictModalOpen(false)
          setPendingAction(null)
        }}
        type="warning"
        title="Conflito de Horário de Instalação"
        message={
          installationConflict ? (
            <div className="space-y-2">
              <p>
                Já existe uma instalação agendada na oficina para <strong>{installationConflict.date.split('-').reverse().join('/')} às {installationConflict.time}</strong>.
              </p>
              <p className="text-slate-500">
                Cliente: <strong>{installationConflict.client}</strong> ({installationConflict.vehicle}) — Pedido <strong>{installationConflict.code}</strong>.
              </p>
              <p className="text-amber-800 font-medium">
                Recomendamos escolher outro horário disponível para garantir um atendimento ágil e sem filas para o cliente.
              </p>
            </div>
          ) : (
            'Existe um compromisso agendado para este horário.'
          )
        }
        primaryButtonText="Alterar Horário"
        onPrimaryAction={() => {
          setConflictModalOpen(false)
          setPendingAction(null)
          setActiveFormTab('fulfillment')
        }}
        secondaryButtonText="Salvar Mesmo Assim (Encaixe)"
        onSecondaryAction={executePendingAction}
        tertiaryButtonText="Cancelar"
      />

      {/* MODAL 3: CONFIRMAÇÃO PADRONIZADA DE EXCLUSÃO DE ORÇAMENTO */}
      <CustomAlertModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        type="danger"
        title="Apagar Orçamento"
        message="Tem certeza que deseja apagar permanentemente este orçamento? Esta ação removerá os dados do Pipeline e do Funil de Pedidos."
        details={`Orçamento: ${formatOrderCode(orderNumber)} — Cliente: ${customerName || 'Cliente'}`}
        primaryButtonText="Sim, Apagar Orçamento"
        onPrimaryAction={handleDelete}
        secondaryButtonText="Cancelar"
        isDangerAction={true}
      />

      {/* MODAL 4: ENCERRAMENTO COM REGISTRO DE MOTIVO */}
      <CloseOpportunityModal
        isOpen={lostModalOpen}
        clientName={customerName || 'Cliente'}
        orderCode={formatOrderCode(orderNumber)}
        onClose={() => setLostModalOpen(false)}
        onConfirm={handleConfirmCloseOpportunity}
        isSubmitting={isClosingOpportunity}
      />

      {/* MODAL 5: CONFIRMAÇÃO PADRONIZADA DE REMOÇÃO DE ANEXO */}
      <CustomAlertModal
        isOpen={!!attachmentToDelete}
        onClose={() => setAttachmentToDelete(null)}
        type="danger"
        title="Remover Documento"
        message={`Deseja realmente remover o documento "${attachmentToDelete?.name}" deste pedido?`}
        primaryButtonText="Sim, Remover"
        onPrimaryAction={handleConfirmDeleteAttachment}
        secondaryButtonText="Cancelar"
        isDangerAction={true}
      />

      {/* MODAL 6: CONCESSÃO EXCEPCIONAL DE DESCONTO COMERCIAL */}
      {discountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#EA580C]">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Aplicar Desconto Especial</h3>
                  <p className="text-xs text-slate-500">Concessão de desconto comercial por exceção</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDiscountModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Atenção: Concessão Excepcional</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Descontos só devem ser concedidos em situações excepcionais autorizadas. O limite máximo para esta forma de pagamento ({paymentMethod === 'pix' ? 'À vista' : paymentMethod === 'boleto' ? 'Boleto' : 'Cartão'}) é de <strong>{maxAllowedDiscount}%</strong>.
              </p>
            </div>

            {/* Configuração do Desconto */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Percentual de Desconto (%):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={maxAllowedDiscount}
                    value={tempDiscountPercent || ''}
                    onChange={(e) => {
                      const val = Math.min(Math.max(parseInt(e.target.value) || 0, 0), maxAllowedDiscount)
                      setTempDiscountPercent(val)
                    }}
                    placeholder={`1 a ${maxAllowedDiscount}`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#EA580C]"
                    autoFocus
                  />
                  <span className="text-sm font-mono font-bold text-slate-500">%</span>
                </div>
              </div>

              {/* Pré-visualização do Impacto */}
              {tempDiscountPercent > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Produtos:</span>
                    <span>{formatCurrency(budget.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Desconto ({tempDiscountPercent}%):</span>
                    <span>-{formatCurrency((budget.subtotal * tempDiscountPercent) / 100)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Novo Total Produtos:</span>
                    <span className="text-[#EA580C]">
                      {formatCurrency(budget.subtotal - (budget.subtotal * tempDiscountPercent) / 100)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmação e Ações */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDiscountModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={tempDiscountPercent <= 0 || tempDiscountPercent > maxAllowedDiscount}
                onClick={() => {
                  setDiscountPercent(tempDiscountPercent)
                  setDiscountModalOpen(false)
                }}
                className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar e Aplicar Desconto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR MUDANÇA DE ETAPA DO LEAD */}
      <CustomAlertModal
        isOpen={!!stageToConfirm}
        onClose={() => setStageToConfirm(null)}
        type="warning"
        title="Confirmar Mudança de Etapa"
        message={
          stageToConfirm ? (
            <div className="space-y-3">
              <p className="text-slate-600 text-sm">
                Deseja alterar a etapa deste lead ({customerName || 'Cliente'}) de:
              </p>
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="font-bold text-slate-700 text-xs px-2.5 py-1 rounded-xl bg-slate-200/80">
                  {SALES_PIPELINE_STAGES.find((s) => s.id === stage)?.title || stage}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <span
                  className="font-bold text-white text-xs px-2.5 py-1 rounded-xl shadow-2xs"
                  style={{
                    backgroundColor:
                      SALES_PIPELINE_STAGES.find((s) => s.id === stageToConfirm)?.color || '#EA580C',
                  }}
                >
                  {SALES_PIPELINE_STAGES.find((s) => s.id === stageToConfirm)?.title || stageToConfirm}
                </span>
              </div>
            </div>
          ) : (
            ''
          )
        }
        primaryButtonText="Confirmar Mudança"
        onPrimaryAction={() => {
          if (stageToConfirm) {
            void applyStageChange(stageToConfirm)
          }
          setStageToConfirm(null)
        }}
        secondaryButtonText="Cancelar"
        onSecondaryAction={() => setStageToConfirm(null)}
      />
    </div>
  )
}
