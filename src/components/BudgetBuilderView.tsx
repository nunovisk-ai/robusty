import React, { useState, useEffect, useMemo, useRef } from 'react'
import type { 
  Vehicle, 
  Product, 
  PaymentMethod, 
  FulfillmentType, 
  Opportunity, 
  LeadOrigin, 
  Order, 
  Appointment, 
  AttachedDocument,
  OpportunityComment,
  OpportunityHistoryEvent,
  OpportunityTask
} from '../types'
import { fetchVehicles, fetchProducts, calculateBudget, getMaxDiscountForPaymentMethod } from '../services/catalogService'
import { lookupCep } from '../services/cepService'
import { CustomDatePicker } from './CustomDatePicker'
import { CustomAlertModal } from './CustomAlertModal'
import { CommercialProposalModal } from './CommercialProposalModal'
import type { CurrentUser } from './LoginView'
import { formatBRPhone, formatBRCep, formatCurrency, getCleanVehicleModel } from '../utils/formatters'
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
  CheckCircle2,
  XCircle,
  Weight,
  CreditCard,
  QrCode,
  ReceiptText,
  AlertTriangle,
  FileText,
  Paperclip,
  Upload,
  Eye,
  User,
  Share2,
  ExternalLink,
  MessageSquare,
  History,
  ListTodo,
  Download,
  Image as ImageIcon,
  FileSpreadsheet,
  File
} from 'lucide-react'
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
  FaTruckPickup 
} from 'react-icons/fa6'

type BudgetFormTab = 'contact' | 'products' | 'fulfillment' | 'history' | 'attachments'

interface BudgetBuilderViewProps {
  initialVehicleId?: string
  initialOpportunity?: Opportunity | null
  existingOrderNumber?: number
  existingOrders?: Order[]
  existingOpportunities?: Opportunity[]
  existingAppointments?: Appointment[]
  currentUser?: CurrentUser | null
  onSaveToKanban?: (opportunityData: any) => void
  onGenerateOrder?: (opportunityData: any) => void
  onDeleteOpportunity?: (oppId: string) => void
  onMarkLost?: (oppId: string) => void
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
  onGenerateOrder,
  onDeleteOpportunity,
  onMarkLost,
  onClose
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    initialOpportunity?.vehicle_id || initialVehicleId || ''
  )
  
  // Número do Pedido / Identificador Único
  const [orderNumber] = useState<number>(() => {
    if (initialOpportunity?.order_number) return initialOpportunity.order_number
    if (existingOrderNumber) return existingOrderNumber
    return Math.floor(1040 + Math.random() * 80)
  })

  // Responsável: Igor, Norlando ou Loja
  const [assignedTo, setAssignedTo] = useState<'Igor' | 'Norlando' | 'Loja'>(() => {
    return initialOpportunity?.assigned_to || 'Norlando'
  })

  // 1. Dados do Contato & Redes Sociais
  const [customerName, setCustomerName] = useState(() => initialOpportunity?.contact?.full_name || '')
  const [customerPhone, setCustomerPhone] = useState(() => {
    const raw = initialOpportunity?.contact?.phone_e164 || ''
    return formatBRPhone(raw.replace('+55', ''))
  })
  const [customerEmail, setCustomerEmail] = useState(() => initialOpportunity?.customer_email || initialOpportunity?.contact?.email || '')
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

  // 2. Produtos Selecionados
  const [items, setItems] = useState<{ product: Product; quantity: number }[]>(() => {
    if (initialOpportunity?.items && initialOpportunity.items.length > 0) {
      return initialOpportunity.items
        .filter((item) => item.product)
        .map((item) => ({ product: item.product!, quantity: item.quantity }))
    }
    return []
  })

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

  // Transportadora
  const [shippingCarrierName, setShippingCarrierName] = useState(() => initialOpportunity?.shipping_carrier_name || '')
  const [shippingTrackingCode, setShippingTrackingCode] = useState(() => initialOpportunity?.shipping_tracking_code || '')
  const [freightValue, setFreightValue] = useState<number>(() => initialOpportunity?.freight_value || 0)
  const [pickupDate, setPickupDate] = useState<string>(() => initialOpportunity?.pickup_date || '')
  const [pickupTime, setPickupTime] = useState<string>(() => initialOpportunity?.pickup_time || '10:00')

  // Filtro Rápido de Categorias de Produtos
  const [productCategoryFilter, setProductCategoryFilter] = useState<'all' | 'bagageiro' | 'escada' | 'suporte' | 'outros'>('all')

  // Instalação na Loja
  const [installationDate, setInstallationDate] = useState<string>(() => initialOpportunity?.installation_date || '')
  const [installationTime, setInstallationTime] = useState<string>(() => initialOpportunity?.installation_time || '14:00')
  const [installationCost, setInstallationCost] = useState<number>(() => {
    if (initialOpportunity?.installation_value !== undefined) return initialOpportunity.installation_value
    return 200
  })

  // 4. Condições de Pagamento e Desconto
  // "o sistema deve pedir primeiro a forma de pagamento antes de exibir as opções de desconto"
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(() => {
    return initialOpportunity?.payment_method || ''
  })
  const [cardInstallments, setCardInstallments] = useState<number>(() => {
    return initialOpportunity?.card_installments || 10
  })
  const [discountPercent, setDiscountPercent] = useState<number>(() => {
    if (initialOpportunity?.discount_percent !== undefined) return initialOpportunity.discount_percent
    return 0
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
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)
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
        opportunity_id: initialOpportunity?.id,
        type: 'created',
        description: `Orçamento #ROB-${orderNumber} criado no CRM`,
        user: assignedTo,
        created_at: initialOpportunity?.created_at || new Date().toISOString()
      }
    ]
  })

  const [tasks, setTasks] = useState<OpportunityTask[]>(() => {
    return initialOpportunity?.tasks || []
  })
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [newTaskTime, setNewTaskTime] = useState('14:00')
  const [newTaskAssignee, setNewTaskAssignee] = useState<'Norlando' | 'Igor' | 'Loja'>(assignedTo)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'comments' | 'history'>('all')

  // Modais Padronizados
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'save' | 'order' | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [lostModalOpen, setLostModalOpen] = useState(false)

  // Load Vehicles & Products
  useEffect(() => {
    async function load() {
      const [vList, pList] = await Promise.all([fetchVehicles(), fetchProducts()])
      setVehicles(vList)
      setAllProducts(pList)
      if (!selectedVehicleId && vList.length > 0) {
        setSelectedVehicleId(vList[0].id)
      }
    }
    load()
  }, [])

  // Order vehicles alphabetically by model
  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => a.model.localeCompare(b.model, 'pt-BR'))
  }, [vehicles])

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)

  // Compatible products for vehicle
  const compatibleProducts = useMemo(() => {
    return allProducts.filter(
      (p) => !p.compatible_vehicle_id || p.compatible_vehicle_id === selectedVehicleId
    )
  }, [allProducts, selectedVehicleId])

  // Filtragem rápida por categoria solicitada pelo usuário (Bagageiros, Escadas, Suportes, Outros)
  const filteredCompatibleProducts = useMemo(() => {
    return compatibleProducts.filter((p) => {
      if (productCategoryFilter === 'all') return true
      if (productCategoryFilter === 'bagageiro') return p.category === 'bagageiro'
      if (productCategoryFilter === 'escada') return p.category === 'escada'
      if (productCategoryFilter === 'suporte') return p.category === 'suporte' || p.category === 'acessorio_fixacao'
      if (productCategoryFilter === 'outros') {
        return p.category !== 'bagageiro' && p.category !== 'escada' && p.category !== 'suporte' && p.category !== 'acessorio_fixacao'
      }
      return true
    })
  }, [compatibleProducts, productCategoryFilter])

  // Recalculate installation cost default when vehicle changes if not custom edited
  useEffect(() => {
    if (selectedVehicle && fulfillment === 'instalacao_loja' && !initialOpportunity) {
      setInstallationCost(selectedVehicle.standard_installation_cost || 200)
    }
  }, [selectedVehicleId, fulfillment])

  // Automatically enforce discount limits when payment method changes
  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method)
    const maxDiscount = getMaxDiscountForPaymentMethod(method)
    // Preset defaults
    if (method === 'pix') {
      setDiscountPercent(10)
    } else if (method === 'boleto') {
      setDiscountPercent(5)
    } else {
      setDiscountPercent(0)
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
    } else {
      if (res.street) setStreet(res.street)
      if (res.neighborhood) setNeighborhood(res.neighborhood)
      if (res.city) setCity(res.city)
      if (res.state) setState(res.state)
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
        } else {
          if (res.street) setStreet(res.street)
          if (res.neighborhood) setNeighborhood(res.neighborhood)
          if (res.city) setCity(res.city)
          if (res.state) setState(res.state)
        }
      })
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
    const lines = [
      `*PROPOSTA COMERCIAL ROBUSTY — BAGAGEIROS AUTOMOTIVOS*`,
      `*Identificador Único:* #ROB-${orderNumber}`,
      `*Responsável:* ${assignedTo}`,
      `Olá ${customerName ? customerName : 'Cliente'}! Segue sua proposta oficial:`,
      ``,
      `*Veículo:* ${selectedVehicle ? getCleanVehicleModel(selectedVehicle.model) : 'Utilitário'}`,
      `*Modalidade:* ${fulfillment === 'instalacao_loja' ? 'Instalação na Loja Robusty' : 'Envio por Transportadora'}`,
      ...(fulfillment === 'transportadora_envio' && city ? [`*Destino:* ${city}/${state} (CEP: ${cep})`] : []),
      ...(fulfillment === 'transportadora_envio' && shippingCarrierName ? [`*Transportadora:* ${shippingCarrierName}`] : []),
      ...(fulfillment === 'transportadora_envio' && shippingTrackingCode ? [`*Código de Rastreio:* ${shippingTrackingCode}`] : []),
      ...(fulfillment === 'transportadora_envio' && pickupDate ? [`*Previsão de Coleta:* ${pickupDate} às ${pickupTime}`] : []),
      ...(fulfillment === 'instalacao_loja' && installationDate ? [`*Agendamento Instalação:* ${installationDate} às ${installationTime}`] : []),
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
      ...(fulfillment === 'transportadora_envio' && budget.freightValue > 0 ? [`• Frete Transportadora: ${formatCurrency(budget.freightValue)} (Peso Total: ${budget.totalWeightKg} kg)`] : []),
      ...(fulfillment === 'instalacao_loja' && budget.installationValue > 0 ? [`• Custo de Instalação: ${formatCurrency(budget.installationValue)}`] : []),
      ``,
      `*VALOR TOTAL:* *${formatCurrency(budget.finalTotal)}*`,
      `*Condição:* ${
        paymentMethod === 'pix'
          ? 'À vista no PIX (com desconto)'
          : paymentMethod === 'boleto'
          ? 'À vista no Boleto Bancário'
          : `Cartão de Crédito em até ${cardInstallments}x de ${formatCurrency(budget.finalTotal / cardInstallments)}`
      }`,
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

  // Build payload
  const buildOpportunityData = () => {
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
      id: initialOpportunity?.id || `opp-${Date.now()}`,
      orderNumber,
      orderCode: `#ROB-${orderNumber}`,
      assignedTo,
      customerName: customerName || 'Novo Cliente',
      customerPhone,
      customerEmail,
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
      pickupDate,
      pickupTime,
      installationDate,
      installationTime,
      installationCost,
      totalWeightKg: budget.totalWeightKg,
      budget,
      paymentMethod: (paymentMethod as PaymentMethod) || 'pix',
      discountPercent: budget.discountPercent,
      cardInstallments,
      attachments,
      comments,
      history,
      tasks,
    }
  }

  // Detecção de Conflito de Instalação (Requisito 4)
  const installationConflict = useMemo(() => {
    if (fulfillment !== 'instalacao_loja' || !installationDate || !installationTime) return null

    // 1. Procurar em existingOrders
    const orderConflict = existingOrders.find((ord) => {
      if (initialOpportunity && (ord.id === initialOpportunity.id || ord.opportunity_id === initialOpportunity.id || ord.order_number === orderNumber)) {
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
        code: orderConflict.order_code || `#ROB-${orderConflict.order_number}`,
        client: orderConflict.contact?.full_name || 'Cliente com pedido ativo',
        vehicle: orderConflict.opportunity?.vehicle_model_year || 'Veículo utilitário',
        date: installationDate,
        time: installationTime
      }
    }

    // 2. Procurar em existingOpportunities
    const oppConflict = existingOpportunities.find((opp) => {
      if (initialOpportunity && (opp.id === initialOpportunity.id || opp.order_number === orderNumber)) {
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
        code: oppConflict.order_code || (oppConflict.order_number ? `#ROB-${oppConflict.order_number}` : '#ORÇ-ROB'),
        client: oppConflict.contact?.full_name || 'Lead em negociação',
        vehicle: oppConflict.vehicle_model_year || 'Veículo utilitário',
        date: installationDate,
        time: installationTime
      }
    }

    // 3. Procurar em existingAppointments
    const aptConflict = existingAppointments.find((apt) => {
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
    orderNumber
  ])

  const handleAttachProposal = (doc: AttachedDocument) => {
    const authorName = currentUser?.name || assignedTo || 'Usuário'
    const docWithUser: AttachedDocument = {
      ...doc,
      uploaded_by: authorName,
      uploaded_at: new Date().toISOString()
    }
    setAttachments((prev) => [docWithUser, ...prev.filter((d) => d.id !== doc.id)])

    // Registra na linha do tempo do lead
    const historyEvent: OpportunityHistoryEvent = {
      id: `hist-prop-${Date.now()}`,
      opportunity_id: initialOpportunity?.id,
      type: 'note',
      description: `Gerou a proposta comercial em PDF (#ROB-${orderNumber})`,
      user: authorName,
      created_at: new Date().toISOString()
    }
    setHistory((prev) => [historyEvent, ...prev])
  }

  const handleGenerateAndAttachProposal = () => {
    const authorName = currentUser?.name || assignedTo || 'Usuário'
    const cleanCustomer = (customerName || 'Cliente').trim().replace(/\s+/g, '_')
    const newProposalDoc: AttachedDocument = {
      id: `doc-prop-${Date.now()}`,
      name: `Proposta_Comercial_#ROB-${orderNumber}_${cleanCustomer}.pdf`,
      type: 'orcamento_pdf',
      file_size: '185 KB',
      uploaded_at: new Date().toISOString(),
      uploaded_by: authorName
    }

    setAttachments((prev) => [newProposalDoc, ...prev.filter((d) => d.type !== 'orcamento_pdf')])

    const historyEvent: OpportunityHistoryEvent = {
      id: `hist-prop-${Date.now()}`,
      opportunity_id: initialOpportunity?.id,
      type: 'note',
      description: `Gerou a proposta comercial em PDF (#ROB-${orderNumber})`,
      user: authorName,
      created_at: new Date().toISOString()
    }
    setHistory((prev) => [historyEvent, ...prev])

    setIsProposalModalOpen(true)
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
        opportunity_id: initialOpportunity?.id,
        type: 'note',
        description: `Anexou o arquivo "${file.name}"`,
        user: authorName,
        created_at: new Date().toISOString()
      })
    })

    setAttachments((prev) => [...newDocs, ...prev])
    setHistory((prev) => [...newHistoryEvents, ...prev])
    e.target.value = ''
  }

  const handleViewDocument = (doc: AttachedDocument) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank')
      return
    }
    if (doc.type === 'orcamento_pdf') {
      setIsProposalModalOpen(true)
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
    <div class="item"><span class="label">Pedido Vinculado:</span> #ROB-${orderNumber}</div>
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
    if (doc.file_url) {
      const a = document.createElement('a')
      a.href = doc.file_url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    }
    if (doc.type === 'orcamento_pdf') {
      setIsProposalModalOpen(true)
      return
    }
  }

  const handleAddComment = () => {
    if (!newCommentText.trim()) return
    const authorName = currentUser?.name || assignedTo || 'Usuário'
    const comment: OpportunityComment = {
      id: `comm-${Date.now()}`,
      opportunity_id: initialOpportunity?.id,
      author: authorName,
      text: newCommentText.trim(),
      created_at: new Date().toISOString()
    }
    setComments((prev) => [comment, ...prev])
    setNewCommentText('')
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    const task: OpportunityTask = {
      id: `task-${Date.now()}`,
      opportunity_id: initialOpportunity?.id,
      order_number: orderNumber,
      client_name: customerName || 'Cliente',
      title: newTaskTitle.trim(),
      due_date: newTaskDate,
      due_time: newTaskTime,
      assigned_to: newTaskAssignee,
      completed: false,
      created_at: new Date().toISOString()
    }
    setTasks((prev) => [task, ...prev])
    setNewTaskTitle('')
  }

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed
          return {
            ...t,
            completed: nextCompleted,
            completed_at: nextCompleted ? new Date().toISOString() : undefined
          }
        }
        return t
      })
    )
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
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
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentToDelete.id))
      setAttachmentToDelete(null)
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

  const executeSave = () => {
    const data = buildOpportunityData()
    if (onSaveToKanban) {
      onSaveToKanban(data)
    }
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const executeGenerateOrder = () => {
    const data = buildOpportunityData()
    if (onGenerateOrder) {
      onGenerateOrder(data)
    } else if (onSaveToKanban) {
      onSaveToKanban({ ...data, autoGenerateOrder: true })
    }
    setOrderGeneratedSuccess(true)
    setTimeout(() => setOrderGeneratedSuccess(false), 3000)
  }

  // 1. Salvar: cria/atualiza o card no Funil de Vendas com checagem de conflito
  const handleSave = () => {
    if (installationConflict) {
      setPendingAction('save')
      setConflictModalOpen(true)
      return
    }
    executeSave()
  }

  // 2. Gerar Pedido: integra o card diretamente com o Funil de Pedidos com checagem de conflito
  const handleGenerateOrderAction = () => {
    if (installationConflict) {
      setPendingAction('order')
      setConflictModalOpen(true)
      return
    }
    executeGenerateOrder()
  }

  // 3. Apagar Orçamento
  const handleDelete = () => {
    if (initialOpportunity && onDeleteOpportunity) {
      onDeleteOpportunity(initialOpportunity.id)
    }
    setDeleteModalOpen(false)
  }

  // 4. Marcar Oportunidade Perdida / Venda Não Concluída
  const handleMarkLost = () => {
    if (initialOpportunity && onMarkLost) {
      onMarkLost(initialOpportunity.id)
    }
    setLostModalOpen(false)
  }

  const maxAllowedDiscount = getMaxDiscountForPaymentMethod(paymentMethod)

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
                Gerador de Orçamento
              </h2>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF3EA] text-[#EA580C] border border-[#EA580C]/20 shadow-2xs">
                #ROB-{orderNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Responsável Pill Selector: Igor, Norlando ou Loja */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 pl-2 pr-1">Responsável:</span>
          {(['Norlando', 'Igor', 'Loja'] as const).map((resp) => {
            const isSelected = assignedTo === resp
            return (
              <button
                type="button"
                key={resp}
                onClick={() => setAssignedTo(resp)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#EA580C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {resp === 'Loja' ? <FaStore className="w-3 h-3" /> : <FaUser className="w-2.5 h-2.5" />}
                <span>{resp}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Segmented 5-Tab Navigation: 1. Contato & Redes | 2. Veículo & Produtos | 3. Modalidade & Entrega/Coleta | 4. Documentos & NFs | 5. Histórico & Tarefas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-nexo">
        <button
          type="button"
          onClick={() => setActiveFormTab('contact')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFormTab === 'contact'
              ? 'bg-[#EA580C] text-white shadow-sm shadow-orange-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span className="truncate">1. Contato & Redes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFormTab('products')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFormTab === 'products'
              ? 'bg-[#EA580C] text-white shadow-sm shadow-orange-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Car className="w-4 h-4 shrink-0" />
          <span className="truncate">2. Veículo & Produtos</span>
          {items.length > 0 && (
            <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeFormTab === 'products' ? 'bg-white/20 text-white' : 'bg-orange-50 text-[#EA580C]'
            }`}>
              {items.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFormTab('fulfillment')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFormTab === 'fulfillment'
              ? 'bg-[#EA580C] text-white shadow-sm shadow-orange-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4 shrink-0" />
          <span className="truncate">3. Modalidade & Entrega</span>
          {installationConflict && (
            <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Conflito de horário detectado" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFormTab('history')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFormTab === 'history'
              ? 'bg-[#EA580C] text-white shadow-sm shadow-orange-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span className="truncate">4. Histórico & Tarefas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFormTab('attachments')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFormTab === 'attachments'
              ? 'bg-[#EA580C] text-white shadow-sm shadow-orange-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Paperclip className="w-4 h-4 shrink-0" />
          <span className="truncate">5. Anexos</span>
          {attachments.length > 0 && (
            <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeFormTab === 'attachments' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {attachments.length}
            </span>
          )}
        </button>
      </div>

      {/* Main 2-Column Layout: Left = Active Tab Content | Right = Persistent Sticky Summary & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Tab Content */}
        <div className="lg:col-span-7 space-y-5">
          {/* =========================================================================
              ABA 1: 1. CONTATO & REDES
             ========================================================================= */}
          {activeFormTab === 'contact' && (
            <>
              {/* Bloco 1.1: Dados do Contato */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#EA580C]" />
                    <span>1. Dados do Contato</span>
                  </span>
                  <span className="text-[11px] font-mono font-medium text-slate-400">#ROB-{orderNumber}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nome do Cliente */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Nome do Cliente:</label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos Eduardo"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
                    />
                  </div>

                  {/* WhatsApp (com máscara brasileira DDD + número) */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">WhatsApp:</label>
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
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">E-mail:</label>
                    <input
                      type="email"
                      placeholder="cliente@empresa.com.br"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
                    />
                  </div>

                  {/* Origem do Lead: WhatsApp, Instagram, Facebook, Manual, Site */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Origem do Lead:</label>
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
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
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
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
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
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
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
              {/* 2.1 Veículo do Cliente (Sem parenteses, sem badge laranja, sem rodapé de regras, sem marca, com ícone e rolagem horizontal em ordem alfabética) */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#EA580C]" />
                    <span>Veículo do Cliente</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sortedVehicles.length} modelos (A-Z)
                  </span>
                </div>

                {/* Barra de rolagem horizontal em ordem alfabética */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {sortedVehicles.map((v) => {
                    const isSelected = selectedVehicleId === v.id
                    const cleanModel = getCleanVehicleModel(v.model)

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVehicleId(v.id)
                          setItems([]) // clear incompatible items
                        }}
                        className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
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
                  })}
                </div>
              </div>

              {/* 2.2 Bagageiros e Acessórios Compatíveis (com pesos, medidas, sem condições de pagamento) */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Bagageiros e Acessórios Compatíveis
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {filteredCompatibleProducts.length} de {compatibleProducts.length} itens
                  </span>
                </div>

                {/* Pílulas de Filtragem Rápida por Categoria */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
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

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredCompatibleProducts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
                      Nenhum produto encontrado nesta categoria para este veículo.
                    </div>
                  ) : (
                    filteredCompatibleProducts.map((p) => {
                      const inBudget = items.find((i) => i.product.id === p.id)
                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">{p.name}</span>
                            </div>

                            {/* Dimensões, Peso e Valor do Produto */}
                            <div className="flex items-center gap-3 text-xs mt-1 font-mono text-slate-500">
                              {p.dimensions && (
                                <span className="text-[11px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                  📏 {p.dimensions}
                                </span>
                              )}
                              {p.weight_kg !== undefined && p.weight_kg > 0 && (
                                <span className="text-[11px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                  ⚖️ {p.weight_kg} kg
                                </span>
                              )}
                              <span className="text-slate-900 font-bold ml-auto font-sans">
                                {formatCurrency(p.base_price_10x)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddItem(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                              inBudget
                                ? 'bg-[#EA580C] text-white shadow-xs'
                                : 'bg-white hover:bg-orange-50 text-slate-700 hover:text-[#EA580C] border border-slate-200'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{inBudget ? `Adicionado (${inBudget.quantity})` : 'Adicionar'}</span>
                          </button>
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
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
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
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Rua / Logradouro:</label>
                        <input
                          type="text"
                          placeholder="Ex: Av. Amazonas"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C]"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Número:</label>
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
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Bairro:</label>
                        <input
                          type="text"
                          placeholder="Ex: Centro"
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C]"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Cidade:</label>
                        <input
                          type="text"
                          placeholder="Ex: Belo Horizonte"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C]"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">UF:</label>
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

                    {/* Peso Total da Carga */}
                    <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Weight className="w-4 h-4 text-[#EA580C]" />
                        <span className="font-bold">Peso Total da Carga:</span>
                      </div>
                      <span className="font-mono font-bold text-[#EA580C] text-sm">
                        {budget.totalWeightKg} kg
                      </span>
                    </div>

                    {/* Valor do Frete */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Valor do Frete (R$):
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={freightValue || ''}
                        onChange={(e) => setFreightValue(parseFloat(e.target.value) || 0)}
                        className="w-full sm:w-48 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono"
                      />
                    </div>

                    {/* Nome da Transportadora e Código de Rastreio */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
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
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Código de Rastreio:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: BR123456789 ou NF-0045"
                          value={shippingTrackingCode}
                          onChange={(e) => setShippingTrackingCode(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono"
                        />
                      </div>
                    </div>

                    {/* Programação da Coleta */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1.5">
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

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Horário da Coleta:
                          </label>
                          <select
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono cursor-pointer"
                          >
                            {TIME_SLOTS.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Se for Instalação na Loja */}
                {fulfillment === 'instalacao_loja' && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                    {/* Custo da Instalação (modificável) */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Custo da Instalação (R$):
                      </label>
                      <input
                        type="number"
                        value={installationCost || ''}
                        onChange={(e) => setInstallationCost(parseFloat(e.target.value) || 0)}
                        className="w-full sm:w-48 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono"
                        placeholder="200.00"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Padrão do catálogo: {formatCurrency(selectedVehicle?.standard_installation_cost || 200)} (Totalmente modificável)
                      </span>
                    </div>

                    {/* Data e Horário da Instalação */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1.5">
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

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Horário da Instalação:
                          </label>
                          <select
                            value={installationTime}
                            onChange={(e) => setInstallationTime(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono cursor-pointer"
                          >
                            {TIME_SLOTS.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                        </div>

                        {installationConflict && (
                          <div className="sm:col-span-2 p-3.5 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-900 text-xs flex items-start gap-3 shadow-2xs">
                            <AlertTriangle className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                            <div className="space-y-1 leading-relaxed">
                              <div className="font-bold text-amber-950 flex items-center gap-2">
                                <span>Atenção: Já existe instalação agendada neste horário!</span>
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold">
                                  {installationConflict.code}
                                </span>
                              </div>
                              <div>
                                Já existe uma instalação agendada para <strong>{installationConflict.date.split('-').reverse().join('/')} às {installationConflict.time}</strong> ({installationConflict.client} — {installationConflict.vehicle}).
                              </div>
                              <div className="text-[11px] text-amber-800">
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
              {/* Card 1: Tarefas & Lembretes */}
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
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
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
                      <select
                        value={newTaskTime}
                        onChange={(e) => setNewTaskTime(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C]"
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <select
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C]"
                      >
                        <option value="Norlando">Norlando</option>
                        <option value="Igor">Igor</option>
                        <option value="Loja">Loja</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddTask}
                        disabled={!newTaskTitle.trim()}
                        className="w-full py-2.5 px-3 bg-[#EA580C] hover:bg-[#c2410c] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Criar</span>
                      </button>
                    </div>
                  </div>
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
                      const isOverdue = !task.completed && task.due_date < today
                      const isToday = !task.completed && task.due_date === today

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
                                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                  {task.assigned_to === 'Loja' ? <FaStore className="w-2.5 h-2.5 text-amber-600" /> : <FaUser className="w-2.5 h-2.5 text-slate-400" />}
                                  {task.assigned_to}
                                </span>
                                <span>•</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                                    : isOverdue
                                    ? `⚠️ Atrasada: ${task.due_date} às ${task.due_time}`
                                    : isToday
                                    ? `⏰ Hoje às ${task.due_time}`
                                    : `📅 ${task.due_date} às ${task.due_time}`}
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

              {/* Card 2: Comentários & Observações */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Comentários & Observações Internas</h3>
                      <p className="text-xs text-slate-500">Múltiplos comentários salvos com autor, data e hora de registro.</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {comments.length} registro(s)
                  </span>
                </div>

                {/* Caixa de Entrada de Comentário */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Adicione uma observação sobre o cliente, negociação de valores, detalhes do veículo..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition-all resize-none"
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <FaUser className="w-2.5 h-2.5 text-slate-400" />
                      <span>Registrando automaticamente como: <strong className="text-slate-800">{currentUser?.name || assignedTo}</strong></span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!newCommentText.trim()}
                      className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Adicionar Comentário</span>
                    </button>
                  </div>
                </div>
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
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-2xs ${
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
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(item.date).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap">{item.content}</p>
                          {item.author && (
                            <div className="pt-1 border-t border-slate-200/50 flex items-center gap-1.5 text-[10px] text-slate-500">
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
                    <p className="text-[11px] text-slate-500 mt-0.5">
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
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
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
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Imagens, PDFs, notas fiscais, planilhas e comprovantes de pagamento.
                      </p>
                    </div>
                  </button>
                </div>
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
                    <p className="text-[11px] text-slate-400">
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
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
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
        </div>

        {/* Right Column: Persistent Sticky Official Quotation Sheet & Quick Actions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm sticky top-20">

            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <img 
                  src={`${import.meta.env.BASE_URL}robusty-logo.png`} 
                  alt="Robusty" 
                  className="h-7 w-auto object-contain" 
                />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  RESUMO & AÇÕES RÁPIDAS
                </span>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  #ROB-{orderNumber}
                </div>
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
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Itens Adicionados ({items.length})</span>
                {budget.totalWeightKg > 0 && (
                  <span className="font-mono text-slate-500">Peso Total: {budget.totalWeightKg} kg</span>
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
                        <div className="text-[10px] text-slate-500 font-mono">
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

            {/* Condição de Pagamento (Obrigatório selecionar primeiro a forma de pagamento antes dos descontos) */}
            <div className="pt-3 border-t border-slate-100 mb-4 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Forma de Pagamento:
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePaymentMethodSelect('pix')}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'pix'
                      ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>PIX (Até 10%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePaymentMethodSelect('boleto')}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'boleto'
                      ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ReceiptText className="w-3.5 h-3.5" />
                  <span>Boleto (Até 5%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePaymentMethodSelect('cartao_link_igor')}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'cartao_link_igor' || paymentMethod === 'cartao_presencial'
                      ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cartão (Até 10x)</span>
                </button>
              </div>

              {/* Se a forma de pagamento ainda não foi selecionada */}
              {!paymentMethod ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Selecione a forma de pagamento acima para definir as opções de parcelas e descontos.</span>
                </div>
              ) : (
                /* Opções de Desconto e Parcelas de acordo com a forma selecionada */
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                  {/* Se for Cartão: Seleção de Parcelas */}
                  {(paymentMethod === 'cartao_link_igor' || paymentMethod === 'cartao_presencial') && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 font-bold">Parcelas:</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {cardInstallments}x de {formatCurrency(budget.finalTotal / cardInstallments)}
                        </span>
                      </div>
                      <select
                        value={cardInstallments}
                        onChange={(e) => setCardInstallments(parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={num}>
                            {num}x sem juros ({formatCurrency(budget.finalTotal / num)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Controle de Desconto condicionado aos limites exatos estabelecidos */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 font-bold">
                        Desconto Aplicado (Máximo {maxAllowedDiscount}%):
                      </span>
                      <span className="font-mono text-[#EA580C] font-bold">{discountPercent}%</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max={maxAllowedDiscount}
                        step="1"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                        className="flex-1 accent-[#EA580C] cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max={maxAllowedDiscount}
                        value={discountPercent}
                        onChange={(e) => {
                          const val = Math.min(Math.max(parseInt(e.target.value) || 0, 0), maxAllowedDiscount)
                          setDiscountPercent(val)
                        }}
                        className="w-14 bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs text-center font-mono font-bold"
                      />
                      <span className="text-xs font-mono text-slate-500">%</span>
                    </div>

                    <div className="flex gap-1.5 mt-2">
                      {paymentMethod === 'pix' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setDiscountPercent(10)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:border-[#EA580C] cursor-pointer"
                          >
                            10% Padrão
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountPercent(5)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:border-[#EA580C] cursor-pointer"
                          >
                            5%
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountPercent(0)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:border-[#EA580C] cursor-pointer"
                          >
                            0%
                          </button>
                        </>
                      )}
                      {paymentMethod === 'boleto' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setDiscountPercent(5)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:border-[#EA580C] cursor-pointer"
                          >
                            5% Padrão
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountPercent(0)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:border-[#EA580C] cursor-pointer"
                          >
                            0%
                          </button>
                        </>
                      )}
                    </div>
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
                <div className="text-[11px] text-emerald-700 text-right font-sans font-semibold pt-0.5">
                  Economia cliente: {formatCurrency(budget.savingsVs10x)}
                </div>
              )}
            </div>

            {/* Botões Principais: Salvar + Gerar Pedido */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                {/* Botão Salvar (Cria/atualiza o card no Funil de Vendas) */}
                <button
                  type="button"
                  onClick={handleSave}
                  className="py-3 px-3 rounded-xl text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Salvar</span>
                </button>

                {/* Botão Gerar Pedido (Integra diretamente com o Funil de Pedidos) */}
                <button
                  type="button"
                  onClick={handleGenerateOrderAction}
                  className="py-3 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Truck className="w-4 h-4 shrink-0" />
                  <span>Gerar Pedido</span>
                </button>
              </div>

              {savedSuccess && (
                <div className="text-center text-xs text-emerald-700 py-1 font-bold animate-fade-in bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                  ✓ Card de oportunidade salvo no Funil de Vendas (#ROB-{orderNumber})!
                </div>
              )}

              {orderGeneratedSuccess && (
                <div className="text-center text-xs text-blue-700 py-1 font-bold animate-fade-in bg-blue-50 rounded-lg p-2 border border-blue-200">
                  ✓ Pedido criado e integrado ao Funil de Pedidos (#ROB-{orderNumber})!
                </div>
              )}

              {/* Ações Secundárias com Modal Padronizado */}
              {initialOpportunity && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setLostModalOpen(true)}
                    className="text-slate-500 hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Encerrar Negociação</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(true)}
                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1 font-medium"
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

      {/* MODAL 1: PROPOSTA COMERCIAL EM PDF */}
      <CommercialProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        onAttachProposal={handleAttachProposal}
        data={{
          orderNumber,
          customerName,
          customerPhone,
          customerEmail,
          vehicleModel: selectedVehicle ? getCleanVehicleModel(selectedVehicle.model) : 'Utilitário',
          items,
          budget,
          fulfillment,
          address: {
            street,
            number,
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
          totalWeightKg: budget.totalWeightKg,
          assignedTo: currentUser?.name || assignedTo,
        }}
      />

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
        details={`Orçamento: #ROB-${orderNumber} — Cliente: ${customerName || 'Cliente'}`}
        primaryButtonText="Sim, Apagar Orçamento"
        onPrimaryAction={handleDelete}
        secondaryButtonText="Cancelar"
        isDangerAction={true}
      />

      {/* MODAL 4: CONFIRMAÇÃO PADRONIZADA DE VENDA PERDIDA */}
      <CustomAlertModal
        isOpen={lostModalOpen}
        onClose={() => setLostModalOpen(false)}
        type="warning"
        title="Encerrar Negociação (Venda Perdida)"
        message="Deseja mover esta oportunidade para a etapa de Venda Perdida no Funil Comercial? O lead permanecerá no histórico para futuras abordagens."
        primaryButtonText="Confirmar Venda Perdida"
        onPrimaryAction={handleMarkLost}
        secondaryButtonText="Voltar"
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
    </div>
  )
}
