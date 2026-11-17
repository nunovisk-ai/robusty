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
import type { Opportunity, OpportunityStage, Order, Appointment, Product, Vehicle } from './types'
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

// Default fallback mock data if database is fresh
const defaultOpportunities: Opportunity[] = [
  {
    id: 'opp-1',
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
    payment_method: 'pix',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'opp-2',
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
    payment_method: 'boleto',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'opp-3',
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
    payment_method: 'pix',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'opp-4',
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
    payment_method: 'cartao_link_igor',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'opp-5',
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
    payment_method: 'pix',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const defaultOrders: Order[] = [
  {
    id: 'ord-100',
    order_number: 1040,
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
    created_at: new Date().toISOString(),
  },
  {
    id: 'ord-101',
    order_number: 1041,
    opportunity_id: 'opp-legacy',
    contact_id: 'c-legacy',
    contact: {
      id: 'c-legacy',
      full_name: 'Cláudio Entrega Rápida (Fiorino)',
      phone_e164: '+5511999881122',
      origin: 'whatsapp_inbound',
      created_at: new Date().toISOString(),
    },
    fulfillment_type: 'transportadora_envio',
    status: 'em_preparacao',
    payment_status: 'aprovado_pix',
    invoice_required: true,
    invoice_status: 'emitida_disponivel',
    shipping_carrier_name: 'Jadlog Express',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ord-102',
    order_number: 1042,
    opportunity_id: 'opp-legacy-2',
    contact_id: 'c-legacy-2',
    contact: {
      id: 'c-legacy-2',
      full_name: 'Oficina do Beto (Express)',
      phone_e164: '+5511999443322',
      origin: 'loja_presencial',
      created_at: new Date().toISOString(),
    },
    fulfillment_type: 'instalacao_loja',
    status: 'pedido_gerado',
    payment_status: 'pagamento_na_instalacao',
    invoice_required: false,
    invoice_status: 'nao_solicitada',
    created_at: new Date().toISOString(),
  },
]

const defaultAppointments: Appointment[] = [
  {
    id: 'apt-1',
    order_id: 'ord-102',
    contact_id: 'c-legacy-2',
    contact: {
      id: 'c-legacy-2',
      full_name: 'Oficina do Beto',
      phone_e164: '+5511999443322',
      origin: 'loja_presencial',
      created_at: new Date().toISOString(),
    },
    vehicle_description: 'Fiat Doblo Cargo — Bagageiro DX 100',
    products_summary: 'Bagageiro DX 100 com fixação padrão',
    scheduled_start: `${new Date().toISOString().split('T')[0]}T09:30:00`,
    scheduled_end: `${new Date().toISOString().split('T')[0]}T11:00:00`,
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

  // Inbound Opportunities (WhatsApp, Instagram, Balcão)
  const [opportunities, setOpportunities] = useState<Opportunity[]>(defaultOpportunities)
  // Operational Orders (Igor & Loja)
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

  const handleMoveStage = async (oppId: string, newStage: OpportunityStage) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stage: newStage, updated_at: new Date().toISOString() } : o))
    )
    await updateOpportunityStage(oppId, newStage)
  }

  const handleConvertToOrder = async (opp: Opportunity) => {
    const nextOrderNumber = orders.length > 0 ? Math.max(...orders.map((o) => o.order_number)) + 1 : 1001
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_number: nextOrderNumber,
      opportunity_id: opp.id,
      contact_id: opp.contact_id,
      contact: opp.contact,
      fulfillment_type: opp.fulfillment_type || 'transportadora_envio',
      status: 'pedido_recebido',
      payment_status: 'aprovado_confirmado',
      invoice_required: opp.fulfillment_type === 'transportadora_envio',
      invoice_status: opp.fulfillment_type === 'transportadora_envio' ? 'solicitada_ao_igor' : 'nao_solicitada',
      shipping_carrier_name: opp.fulfillment_type === 'transportadora_envio' ? 'Transportadora Pendente' : undefined,
      created_at: new Date().toISOString(),
    }

    setOrders((prev) => [newOrder, ...prev])
    setActiveTab('orders')

    // Persist to Supabase if valid UUID
    if (opp.id.includes('-') && opp.id.length > 20) {
      const created = await createOrderInSupabase(opp)
      if (created) {
        setOrders((prev) => [created, ...prev.filter((o) => o.id !== newOrder.id)])
      }
    }
  }

  const handleSaveBudgetToKanban = async (data: any) => {
    // 1. Optimistic UI update
    const tempOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      contact_id: `c-${Date.now()}`,
      contact: {
        id: `c-${Date.now()}`,
        full_name: data.customerName || 'Cliente WhatsApp',
        phone_e164: data.customerPhone || '+5511900000000',
        origin: 'whatsapp_inbound',
        created_at: new Date().toISOString(),
      },
      vehicle_id: data.vehicle?.id,
      vehicle: data.vehicle,
      vehicle_model_year: data.vehicle?.model,
      stage: 'orcamento_enviado',
      fulfillment_type: data.fulfillment,
      subtotal_products: data.budget.subtotal,
      freight_value: data.budget.freightValue,
      installation_value: data.budget.installationValue,
      discount_value: data.budget.discountValue,
      discount_percent: data.budget.discountPercent,
      final_total: data.budget.finalTotal,
      payment_method: data.paymentMethod,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setOpportunities((prev) => [tempOpp, ...prev])
    setActiveTab('kanban')

    // 2. Persist to Supabase
    const saved = await saveOpportunityToSupabase({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      vehicleModel: data.vehicle?.model,
      vehicleId: data.vehicle?.id,
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

    if (saved) {
      setOpportunities((prev) => [saved, ...prev.filter((o) => o.id !== tempOpp.id)])
    }
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
        setActiveTab={setActiveTab}
        leadCount={opportunities.length}
        orderCount={orders.length}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Area */}
      <div className="md:pl-64 flex-1 flex flex-col min-w-0">
        <TopBar
          activeTab={activeTab}
          onToggleMobile={() => setIsMobileSidebarOpen(true)}
          onNewLeadClick={() => setActiveTab('budget')}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className={`flex-1 p-4 sm:p-6 sm:py-8 w-full mx-auto ${activeTab === 'kanban' ? 'max-w-[1700px]' : 'max-w-7xl'}`}>
          {activeTab === 'kanban' && (
            <KanbanView
              opportunities={opportunities}
              orders={orders}
              onMoveStage={handleMoveStage}
              onUpdateOrderStatus={async (ordId, nextSt) => {
                setOrders((prev) =>
                  prev.map((o) => (o.id === ordId ? { ...o, status: nextSt } : o))
                )
                await updateOrderStatusInSupabase(ordId, nextSt)
              }}
              onConvertToOrder={handleConvertToOrder}
              onOpenNewBudget={() => setActiveTab('budget')}
            />
          )}

          {activeTab === 'budget' && (
            <BudgetBuilderView
              initialVehicleId={selectedVehicleForBudget}
              onSaveToKanban={handleSaveBudgetToKanban}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogView
              onSelectForBudget={handleSelectProductForBudget}
              onNavigateToBudget={() => setActiveTab('budget')}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={orders}
              onUpdateOrderStatus={async (ordId, nextSt) => {
                setOrders((prev) =>
                  prev.map((o) => (o.id === ordId ? { ...o, status: nextSt } : o))
                )
                await updateOrderStatusInSupabase(ordId, nextSt)
              }}
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

        <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-400">
          CRM Robusty © 2026 — Fabricação e Comercialização de Bagageiros Automotivos
        </footer>
      </div>
    </div>
  )
}

export default App
