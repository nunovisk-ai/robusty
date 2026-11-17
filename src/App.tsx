import React, { useState, useEffect } from 'react'
import { Sidebar, type ActiveTab } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { CatalogView } from './components/CatalogView'
import { BudgetBuilderView } from './components/BudgetBuilderView'
import { KanbanView } from './components/KanbanView'
import { OrdersView } from './components/OrdersView'
import { CalendarView } from './components/CalendarView'
import { SettingsView } from './components/SettingsView'
import { LoginView, type CurrentUser } from './components/LoginView'
import type { Opportunity, OpportunityStage, Order, OrderStatus, Appointment, Product, Vehicle } from './types'
import {
  fetchOpportunities,
  saveOpportunityToSupabase,
  updateOpportunityStage,
  fetchOrders,
  createOrderInSupabase,
  updateOrderStatusInSupabase,
  fetchAppointments,
  createAppointmentInSupabase,
} from './services/crmService'

// Default fallback mock data with unique order numbers and assigned responsible
const defaultOpportunities: Opportunity[] = [
  {
    id: 'opp-1',
    order_number: 1040,
    order_code: '#ROB-1040',
    assigned_to: 'Norlando',
    contact_id: 'c-1',
    contact: {
      id: 'c-1',
      full_name: 'Mercado Central de Minas',
      phone_e164: '+5531987654321',
      origin: 'whatsapp_inbound',
      created_at: new Date().toISOString(),
    },
    vehicle_model_year: 'Fiat Ducato Max Cargo 2023',
    stage: 'aguardando_cotacao',
    fulfillment_type: 'transportadora_envio',
    subtotal_products: 4299.0,
    freight_value: 280.0,
    installation_value: 0,
    discount_value: 0,
    discount_percent: 0,
    final_total: 4579.0,
    total_weight_kg: 45,
    pickup_date: '2026-02-24',
    pickup_time: '10:00',
    payment_method: 'pix',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'opp-2',
    order_number: 1041,
    order_code: '#ROB-1041',
    assigned_to: 'Igor',
    contact_id: 'c-2',
    contact: {
      id: 'c-2',
      full_name: 'Roberto Frotas (Fiorino)',
      phone_e164: '+5511977776655',
      origin: 'instagram_direct',
      created_at: new Date().toISOString(),
    },
    vehicle_model_year: 'Fiat Fiorino 2022',
    stage: 'orcamento_enviado',
    fulfillment_type: 'instalacao_loja',
    subtotal_products: 2200.0,
    freight_value: 0,
    installation_value: 200.0,
    discount_value: 110.0,
    discount_percent: 5,
    final_total: 2290.0,
    total_weight_kg: 22,
    installation_date: '2026-02-25',
    installation_time: '14:00',
    payment_method: 'boleto',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'opp-3',
    order_number: 1042,
    order_code: '#ROB-1042',
    assigned_to: 'Norlando',
    contact_id: 'c-3',
    contact: {
      id: 'c-3',
      full_name: 'Transportes Silva (Master)',
      phone_e164: '+5511966665544',
      origin: 'whatsapp_inbound',
      created_at: new Date().toISOString(),
    },
    vehicle_model_year: 'Renault Master L3H2',
    stage: 'venda_ganha',
    fulfillment_type: 'transportadora_envio',
    subtotal_products: 3680.0,
    freight_value: 240.0,
    installation_value: 0,
    discount_value: 268.0,
    discount_percent: 10,
    final_total: 3652.0,
    total_weight_kg: 48,
    pickup_date: '2026-02-26',
    pickup_time: '11:30',
    payment_method: 'pix',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'opp-4',
    order_number: 1043,
    order_code: '#ROB-1043',
    assigned_to: 'Loja',
    contact_id: 'c-4',
    contact: {
      id: 'c-4',
      full_name: 'Rogério Logística (Nova Kangoo)',
      phone_e164: '+5511955554433',
      origin: 'meta_lead_ads',
      created_at: new Date().toISOString(),
    },
    vehicle_model_year: 'Renault Nova Kangoo 2024+',
    stage: 'em_qualificacao',
    fulfillment_type: 'transportadora_envio',
    subtotal_products: 2280.0,
    freight_value: 150.0,
    installation_value: 0,
    discount_value: 0,
    discount_percent: 0,
    final_total: 2430.0,
    total_weight_kg: 26,
    payment_method: 'cartao_link_igor',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'opp-5',
    order_number: 1044,
    order_code: '#ROB-1044',
    assigned_to: 'Norlando',
    contact_id: 'c-5',
    contact: {
      id: 'c-5',
      full_name: 'Oficina do Beto (Express)',
      phone_e164: '+5511944443322',
      origin: 'loja_presencial',
      created_at: new Date().toISOString(),
    },
    vehicle_model_year: 'Renault Express',
    stage: 'em_negociacao',
    fulfillment_type: 'instalacao_loja',
    subtotal_products: 2100.0,
    freight_value: 0,
    installation_value: 200.0,
    discount_value: 210.0,
    discount_percent: 10,
    final_total: 2090.0,
    total_weight_kg: 24,
    installation_date: '2026-02-27',
    installation_time: '09:00',
    payment_method: 'pix',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const defaultOrders: Order[] = [
  {
    id: 'ord-100',
    order_number: 1040,
    order_code: '#ROB-1040',
    assigned_to: 'Norlando',
    opportunity_id: 'opp-1',
    contact_id: 'c-1',
    contact: {
      id: 'c-1',
      full_name: 'Mercado Central de Minas',
      phone_e164: '+5531987654321',
      origin: 'whatsapp_inbound',
      created_at: new Date().toISOString(),
    },
    fulfillment_type: 'transportadora_envio',
    status: 'aguardando_coleta_instalacao',
    payment_status: 'aprovado_pix',
    invoice_required: true,
    invoice_status: 'solicitada_ao_igor',
    shipping_carrier_name: 'Braspress Cargas (Cotação Igor)',
    total_weight_kg: 45,
    pickup_date: '2026-02-24',
    pickup_time: '10:00',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ord-101',
    order_number: 1041,
    order_code: '#ROB-1041',
    assigned_to: 'Igor',
    opportunity_id: 'opp-2',
    contact_id: 'c-2',
    contact: {
      id: 'c-2',
      full_name: 'Roberto Frotas (Fiorino)',
      phone_e164: '+5511977776655',
      origin: 'instagram_direct',
      created_at: new Date().toISOString(),
    },
    fulfillment_type: 'instalacao_loja',
    status: 'em_preparacao',
    payment_status: 'aprovado_boleto',
    invoice_required: false,
    invoice_status: 'nao_solicitada',
    total_weight_kg: 22,
    installation_date: '2026-02-25',
    installation_time: '14:00',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ord-102',
    order_number: 1042,
    order_code: '#ROB-1042',
    assigned_to: 'Norlando',
    opportunity_id: 'opp-3',
    contact_id: 'c-3',
    contact: {
      id: 'c-3',
      full_name: 'Transportes Silva (Master)',
      phone_e164: '+5511966665544',
      origin: 'whatsapp_inbound',
      created_at: new Date().toISOString(),
    },
    fulfillment_type: 'transportadora_envio',
    status: 'pedido_gerado',
    payment_status: 'aprovado_pix',
    invoice_required: true,
    invoice_status: 'solicitada_ao_igor',
    shipping_carrier_name: 'Jadlog Express',
    total_weight_kg: 48,
    pickup_date: '2026-02-26',
    pickup_time: '11:30',
    created_at: new Date().toISOString(),
  },
]

const defaultAppointments: Appointment[] = [
  {
    id: 'apt-1',
    order_id: 'ord-101',
    contact_id: 'c-2',
    contact: {
      id: 'c-2',
      full_name: 'Roberto Frotas',
      phone_e164: '+5511977776655',
      origin: 'instagram_direct',
      created_at: new Date().toISOString(),
    },
    vehicle_description: 'Fiat Fiorino — Bagageiro FX 100',
    products_summary: 'Bagageiro FX 100 com fixação padrão',
    scheduled_start: `${new Date().toISOString().split('T')[0]}T14:00:00`,
    scheduled_end: `${new Date().toISOString().split('T')[0]}T15:30:00`,
    status: 'agendado',
  },
]

export function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = localStorage.getItem('robusty_auth_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [activeTab, setActiveTab] = useState<ActiveTab>('kanban')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [selectedVehicleForBudget, setSelectedVehicleForBudget] = useState<string | undefined>()
  
  // State for the opportunity being viewed/edited in Gerador de Orçamento
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)

  const handleLoginSuccess = (user: CurrentUser) => {
    setCurrentUser(user)
    try {
      localStorage.setItem('robusty_auth_user', JSON.stringify(user))
    } catch (e) {
      console.error(e)
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    try {
      localStorage.removeItem('robusty_auth_user')
    } catch (e) {
      console.error(e)
    }
  }

  // Inbound Opportunities (Funil de Vendas)
  const [opportunities, setOpportunities] = useState<Opportunity[]>(defaultOpportunities)
  // Operational Orders (Funil de Pedidos)
  const [orders, setOrders] = useState<Order[]>(defaultOrders)
  // Store Installation Appointments (Single Bay / 1 slot per time)
  const [appointments, setAppointments] = useState<Appointment[]>(defaultAppointments)

  // Load from Supabase on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [opps, ords, apts] = await Promise.all([
          fetchOpportunities(),
          fetchOrders(),
          fetchAppointments(),
        ])

        if (opps && opps.length > 0) {
          setOpportunities(opps)
        }
        if (ords && ords.length > 0) {
          setOrders(ords)
        }
        if (apts && apts.length > 0) {
          setAppointments(apts)
        }
      } catch (err) {
        console.error('Falha ao sincronizar dados com Supabase:', err)
      }
    }

    loadData()
  }, [])

  // Open fresh Gerador de Orçamento (Nova Oportunidade)
  const handleOpenNewOpportunity = () => {
    setEditingOpportunity(null)
    setActiveTab('budget')
  }

  // Open existing Opportunity/Order in Gerador de Orçamento
  const handleSelectOpportunityToEdit = (opp: Opportunity) => {
    setEditingOpportunity(opp)
    setActiveTab('budget')
  }

  // Move stage inside Funil de Vendas with bidirectional sync
  const handleMoveStage = async (oppId: string, newStage: OpportunityStage) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stage: newStage, updated_at: new Date().toISOString() } : o))
    )

    // Mirror to orders if moving to venda_perdida
    if (newStage === 'venda_perdida') {
      setOrders((prev) =>
        prev.map((ord) => (ord.opportunity_id === oppId ? { ...ord, status: 'pedido_cancelado' } : ord))
      )
    }

    await updateOpportunityStage(oppId, newStage)
  }

  // Move status inside Funil de Pedidos with bidirectional sync
  const handleUpdateOrderStatus = async (ordId: string, nextSt: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === ordId ? { ...o, status: nextSt } : o))
    )

    // Mirror to opportunities
    const targetOrder = orders.find((o) => o.id === ordId)
    if (targetOrder) {
      if (nextSt === 'pedido_cancelado') {
        setOpportunities((prev) =>
          prev.map((opp) =>
            opp.id === targetOrder.opportunity_id || opp.order_number === targetOrder.order_number
              ? { ...opp, stage: 'venda_perdida', updated_at: new Date().toISOString() }
              : opp
          )
        )
      } else if (nextSt === 'pedido_concluido') {
        setOpportunities((prev) =>
          prev.map((opp) =>
            opp.id === targetOrder.opportunity_id || opp.order_number === targetOrder.order_number
              ? { ...opp, stage: 'venda_ganha', updated_at: new Date().toISOString() }
              : opp
          )
        )
      }
    }

    await updateOrderStatusInSupabase(ordId, nextSt)
  }

  // Convert Opportunity to Order directly
  const handleConvertToOrder = async (opp: Opportunity) => {
    const nextOrderNumber = opp.order_number || (orders.length > 0 ? Math.max(...orders.map((o) => o.order_number)) + 1 : 1001)
    
    // Mark opportunity as won
    setOpportunities((prev) =>
      prev.map((o) => (o.id === opp.id ? { ...o, stage: 'venda_ganha', updated_at: new Date().toISOString() } : o))
    )

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_number: nextOrderNumber,
      order_code: `#ROB-${nextOrderNumber}`,
      assigned_to: opp.assigned_to || 'Igor',
      opportunity_id: opp.id,
      opportunity: { ...opp, stage: 'venda_ganha' },
      contact_id: opp.contact_id,
      contact: opp.contact,
      customer_email: opp.customer_email,
      fulfillment_type: opp.fulfillment_type || 'transportadora_envio',
      status: 'pedido_gerado',
      payment_status: 'aprovado_confirmado',
      invoice_required: opp.fulfillment_type === 'transportadora_envio',
      invoice_status: opp.fulfillment_type === 'transportadora_envio' ? 'solicitada_ao_igor' : 'nao_solicitada',
      shipping_carrier_name: opp.fulfillment_type === 'transportadora_envio' ? 'Transportadora Pendente' : undefined,
      pickup_date: opp.pickup_date,
      pickup_time: opp.pickup_time,
      installation_date: opp.installation_date,
      installation_time: opp.installation_time,
      total_weight_kg: opp.total_weight_kg,
      created_at: new Date().toISOString(),
    }

    setOrders((prev) => [newOrder, ...prev.filter((o) => o.opportunity_id !== opp.id && o.order_number !== nextOrderNumber)])
    setActiveTab('kanban')

    // Persist to Supabase if valid UUID
    if (opp.id.includes('-') && opp.id.length > 20) {
      const created = await createOrderInSupabase(opp)
      if (created) {
        setOrders((prev) => [created, ...prev.filter((o) => o.id !== newOrder.id)])
      }
    }
  }

  // 1. Salvar: cria ou atualiza card no Funil de Vendas e reflete no Funil de Pedidos
  const handleSaveOpportunity = async (data: any) => {
    const isEditing = opportunities.some((o) => o.id === data.id)
    const existingOpp = opportunities.find((o) => o.id === data.id)

    const updatedOpp: Opportunity = {
      id: data.id,
      order_number: data.orderNumber,
      order_code: data.orderCode,
      assigned_to: data.assignedTo,
      contact_id: existingOpp?.contact_id || `c-${Date.now()}`,
      contact: {
        id: existingOpp?.contact_id || `c-${Date.now()}`,
        full_name: data.customerName || 'Novo Cliente',
        phone_e164: data.customerPhone || '+5511900000000',
        email: data.customerEmail,
        origin: data.leadOrigin,
        created_at: existingOpp?.contact?.created_at || new Date().toISOString(),
      },
      vehicle_id: data.vehicleId,
      vehicle: data.vehicle,
      vehicle_model_year: data.vehicleModel,
      stage: existingOpp?.stage || 'orcamento_enviado',
      fulfillment_type: data.fulfillment,
      subtotal_products: data.budget.subtotal,
      freight_value: data.budget.freightValue,
      installation_value: data.budget.installationValue,
      discount_value: data.budget.discountValue,
      discount_percent: data.budget.discountPercent,
      final_total: data.budget.finalTotal,
      payment_method: data.paymentMethod,
      card_installments: data.cardInstallments,
      pickup_date: data.pickupDate,
      pickup_time: data.pickupTime,
      installation_date: data.installationDate,
      installation_time: data.installationTime,
      total_weight_kg: data.totalWeightKg,
      customer_email: data.customerEmail,
      address: data.address,
      items: data.items.map((i: any) => ({
        id: `item-${i.product.id}`,
        opportunity_id: data.id,
        product_id: i.product.id,
        product: i.product,
        quantity: i.quantity,
        unit_price: i.product.base_price_10x,
        discount_applied: 0,
        total_price: i.product.base_price_10x * i.quantity,
      })),
      created_at: existingOpp?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (isEditing) {
      setOpportunities((prev) => prev.map((o) => (o.id === data.id ? updatedOpp : o)))
    } else {
      setOpportunities((prev) => [updatedOpp, ...prev])
    }

    // ESPELHAMENTO PERFEITO: Atualiza imediatamente o pedido correspondente no Funil de Pedidos
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.opportunity_id === data.id || ord.order_number === data.orderNumber) {
          return {
            ...ord,
            order_number: data.orderNumber,
            assigned_to: data.assignedTo,
            opportunity: updatedOpp,
            contact: updatedOpp.contact,
            customer_email: data.customerEmail,
            fulfillment_type: data.fulfillment,
            pickup_date: data.pickupDate,
            pickup_time: data.pickupTime,
            installation_date: data.installationDate,
            installation_time: data.installationTime,
            total_weight_kg: data.totalWeightKg,
          }
        }
        return ord
      })
    )

    // Se autoGenerateOrder for true, integra imediatamente ao funil de pedidos
    if (data.autoGenerateOrder) {
      handleGenerateOrderFromBudget(data)
      return
    }

    // Persistir no Supabase
    await saveOpportunityToSupabase({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      vehicleModel: data.vehicleModel,
      vehicleId: data.vehicleId,
      fulfillmentType: data.fulfillment,
      subtotal: data.budget.subtotal,
      freightValue: data.budget.freightValue,
      installationValue: data.budget.installationValue,
      discountValue: data.budget.discountValue,
      discountPercent: data.budget.discountPercent,
      finalTotal: data.budget.finalTotal,
      paymentMethod: data.paymentMethod,
      cep: data.address?.cep,
      street: data.address?.street,
      number: data.address?.number,
      neighborhood: data.address?.neighborhood,
      city: data.address?.city,
      state: data.address?.state,
    })

    setEditingOpportunity(null)
    setActiveTab('kanban')
  }

  // 2. Gerar Pedido: integra o card diretamente com o Funil de Pedidos
  const handleGenerateOrderFromBudget = async (data: any) => {
    const isEditing = opportunities.some((o) => o.id === data.id)
    const existingOpp = opportunities.find((o) => o.id === data.id)

    const updatedOpp: Opportunity = {
      id: data.id,
      order_number: data.orderNumber,
      order_code: data.orderCode,
      assigned_to: data.assignedTo,
      contact_id: existingOpp?.contact_id || `c-${Date.now()}`,
      contact: {
        id: existingOpp?.contact_id || `c-${Date.now()}`,
        full_name: data.customerName || 'Novo Cliente',
        phone_e164: data.customerPhone || '+5511900000000',
        email: data.customerEmail,
        origin: data.leadOrigin,
        created_at: existingOpp?.contact?.created_at || new Date().toISOString(),
      },
      vehicle_id: data.vehicleId,
      vehicle: data.vehicle,
      vehicle_model_year: data.vehicleModel,
      stage: 'venda_ganha', // Oportunidade convertida em venda ganha
      fulfillment_type: data.fulfillment,
      subtotal_products: data.budget.subtotal,
      freight_value: data.budget.freightValue,
      installation_value: data.budget.installationValue,
      discount_value: data.budget.discountValue,
      discount_percent: data.budget.discountPercent,
      final_total: data.budget.finalTotal,
      payment_method: data.paymentMethod,
      card_installments: data.cardInstallments,
      pickup_date: data.pickupDate,
      pickup_time: data.pickupTime,
      installation_date: data.installationDate,
      installation_time: data.installationTime,
      total_weight_kg: data.totalWeightKg,
      customer_email: data.customerEmail,
      address: data.address,
      created_at: existingOpp?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (isEditing) {
      setOpportunities((prev) => prev.map((o) => (o.id === data.id ? updatedOpp : o)))
    } else {
      setOpportunities((prev) => [updatedOpp, ...prev])
    }

    // Criar ou atualizar pedido no Funil de Pedidos com status 'pedido_gerado'
    const existingOrderIndex = orders.findIndex(
      (ord) => ord.opportunity_id === data.id || ord.order_number === data.orderNumber
    )

    if (existingOrderIndex >= 0) {
      setOrders((prev) =>
        prev.map((ord, idx) => {
          if (idx === existingOrderIndex) {
            return {
              ...ord,
              order_number: data.orderNumber,
              order_code: data.orderCode,
              assigned_to: data.assignedTo,
              status: 'pedido_gerado',
              opportunity: updatedOpp,
              contact: updatedOpp.contact,
              customer_email: data.customerEmail,
              fulfillment_type: data.fulfillment,
              pickup_date: data.pickupDate,
              pickup_time: data.pickupTime,
              installation_date: data.installationDate,
              installation_time: data.installationTime,
              total_weight_kg: data.totalWeightKg,
            }
          }
          return ord
        })
      )
    } else {
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        order_number: data.orderNumber,
        order_code: data.orderCode,
        assigned_to: data.assignedTo || 'Igor',
        opportunity_id: data.id,
        opportunity: updatedOpp,
        contact_id: updatedOpp.contact_id,
        contact: updatedOpp.contact,
        customer_email: data.customerEmail,
        fulfillment_type: data.fulfillment,
        status: 'pedido_gerado',
        payment_status: 'aprovado_confirmado',
        invoice_required: data.fulfillment === 'transportadora_envio',
        invoice_status: data.fulfillment === 'transportadora_envio' ? 'solicitada_ao_igor' : 'nao_solicitada',
        shipping_carrier_name: data.fulfillment === 'transportadora_envio' ? 'Transportadora Pendente' : undefined,
        pickup_date: data.pickupDate,
        pickup_time: data.pickupTime,
        installation_date: data.installationDate,
        installation_time: data.installationTime,
        total_weight_kg: data.totalWeightKg,
        created_at: new Date().toISOString(),
      }
      setOrders((prev) => [newOrder, ...prev])
    }

    setEditingOpportunity(null)
    setActiveTab('kanban')
  }

  // 3. Apagar Orçamento
  const handleDeleteOpportunity = (oppId: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== oppId))
    setOrders((prev) => prev.filter((ord) => ord.opportunity_id !== oppId))
    setEditingOpportunity(null)
    setActiveTab('kanban')
  }

  // 4. Marcar Oportunidade Não Concluída (Venda Perdida)
  const handleMarkOpportunityLost = (oppId: string) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stage: 'venda_perdida', updated_at: new Date().toISOString() } : o))
    )
    setOrders((prev) =>
      prev.map((ord) => (ord.opportunity_id === oppId ? { ...ord, status: 'pedido_cancelado' } : ord))
    )
    setEditingOpportunity(null)
    setActiveTab('kanban')
  }

  const handleAddAppointment = async (aptData: Omit<Appointment, 'id'>) => {
    const tempApt: Appointment = {
      ...aptData,
      id: `apt-${Date.now()}`,
    }
    setAppointments((prev) => [...prev, tempApt])

    if (aptData.contact_id && aptData.contact_id.length > 20) {
      const created = await createAppointmentInSupabase(aptData)
      if (created) {
        setAppointments((prev) => [...prev.filter((a) => a.id !== tempApt.id), created])
      }
    }
    return true
  }

  const handleSelectProductForBudget = (_prod: Product, vehicle?: Vehicle) => {
    if (vehicle) {
      setSelectedVehicleForBudget(vehicle.id)
    }
    setEditingOpportunity(null)
    setActiveTab('budget')
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans selection:bg-[#EA580C] selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'budget') setEditingOpportunity(null)
          setActiveTab(tab)
        }}
        leadCount={opportunities.length}
        orderCount={orders.length}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Area */}
      <div className={`md:pl-64 flex-1 flex flex-col min-w-0 ${activeTab === 'kanban' ? 'h-screen overflow-hidden' : ''}`}>
        <TopBar
          activeTab={activeTab}
          onToggleMobile={() => setIsMobileSidebarOpen(true)}
          onNewLeadClick={handleOpenNewOpportunity}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className={`flex-1 w-full ${activeTab === 'kanban' ? 'p-3 sm:px-6 sm:py-3 flex flex-col min-h-0 overflow-hidden max-w-full' : 'p-4 sm:p-6 sm:py-8 max-w-7xl mx-auto'}`}>
          {activeTab === 'kanban' && (
            <KanbanView
              opportunities={opportunities}
              orders={orders}
              onMoveStage={handleMoveStage}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onConvertToOrder={handleConvertToOrder}
              onOpenNewBudget={handleOpenNewOpportunity}
              onSelectOpportunity={handleSelectOpportunityToEdit}
            />
          )}

          {activeTab === 'budget' && (
            <BudgetBuilderView
              initialVehicleId={selectedVehicleForBudget}
              initialOpportunity={editingOpportunity}
              existingOrderNumber={orders.length > 0 ? Math.max(...orders.map((o) => o.order_number)) + 1 : 1045}
              onSaveToKanban={handleSaveOpportunity}
              onGenerateOrder={handleGenerateOrderFromBudget}
              onDeleteOpportunity={handleDeleteOpportunity}
              onMarkLost={handleMarkOpportunityLost}
              onClose={() => setActiveTab('kanban')}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogView
              onSelectForBudget={handleSelectProductForBudget}
              onNavigateToBudget={handleOpenNewOpportunity}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onToggleInvoiceRequest={async (ordId) => {
                const targetOrder = orders.find((o) => o.id === ordId)
                if (targetOrder) {
                  setOrders((prev) =>
                    prev.map((o) =>
                      o.id === ordId ? { ...o, invoice_status: 'solicitada_ao_igor' } : o
                    )
                  )
                  await updateOrderStatusInSupabase(ordId, targetOrder.status, 'solicitada_ao_igor')
                }
              }}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              appointments={appointments}
              onAddAppointment={handleAddAppointment}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>

        {activeTab !== 'kanban' && (
          <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-400">
            CRM Robusty © 2026 — Fabricação e Comercialização de Bagageiros Automotivos
          </footer>
        )}
      </div>
    </div>
  )
}

export default App
