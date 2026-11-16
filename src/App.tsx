import React, { useState } from 'react'
import { Navbar, ActiveTab } from './components/Navbar'
import { CatalogView } from './components/CatalogView'
import { BudgetBuilderView } from './components/BudgetBuilderView'
import { KanbanView } from './components/KanbanView'
import { OrdersView } from './components/OrdersView'
import { CalendarView } from './components/CalendarView'
import { SetupView } from './components/SetupView'
import { DatabaseSetupModal } from './components/DatabaseSetupModal'
import { Opportunity, OpportunityStage, Order, Appointment, Product, Vehicle } from './types'

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog')
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false)
  const [selectedVehicleForBudget, setSelectedVehicleForBudget] = useState<string | undefined>()

  // Initial Sample Opportunities (Simulating Inbound Leads from WhatsApp & Instagram)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([
    {
      id: 'opp-1',
      contact_id: 'c-1',
      contact: {
        id: 'c-1',
        full_name: 'Marcos Vinicius (Kombi Clipper)',
        phone_e164: '+5511988887766',
        origin: 'whatsapp_inbound',
        created_at: new Date().toISOString(),
      },
      vehicle_model_year: 'VW Kombi 2011',
      stage: 'novo_lead',
      fulfillment_type: 'transportadora_envio',
      subtotal_products: 2600.0,
      freight_value: 180.0,
      installation_value: 0,
      discount_value: 0,
      discount_percent: 0,
      final_total: 2780.0,
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
        full_name: 'Transportes Silva (Jumpy MX120)',
        phone_e164: '+5511966665544',
        origin: 'whatsapp_inbound',
        created_at: new Date().toISOString(),
      },
      vehicle_model_year: 'Peugeot Expert / Jumpy',
      stage: 'venda_ganha',
      fulfillment_type: 'transportadora_envio',
      subtotal_products: 2680.0,
      freight_value: 240.0,
      installation_value: 0,
      discount_value: 268.0,
      discount_percent: 10,
      final_total: 2652.0,
      payment_method: 'pix',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ])

  // Operational Orders (Igor & Loja)
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ord-101',
      order_number: 1041,
      opportunity_id: 'opp-legacy',
      contact_id: 'c-legacy',
      contact: {
        id: 'c-legacy',
        full_name: 'Cláudio Entrega Rápida',
        phone_e164: '+5511999881122',
        origin: 'whatsapp_inbound',
        created_at: new Date().toISOString(),
      },
      fulfillment_type: 'transportadora_envio',
      status: 'em_preparacao_loja',
      payment_status: 'aprovado_pix',
      invoice_required: true,
      invoice_status: 'solicitada_ao_igor',
      shipping_carrier_name: 'Braspress Cargas',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ord-102',
      order_number: 1042,
      opportunity_id: 'opp-legacy-2',
      contact_id: 'c-legacy-2',
      contact: {
        id: 'c-legacy-2',
        full_name: 'Oficina do Beto (Doblo Cargo)',
        phone_e164: '+5511999443322',
        origin: 'loja_presencial',
        created_at: new Date().toISOString(),
      },
      fulfillment_type: 'instalacao_loja',
      status: 'aguardando_instalacao_agendada',
      payment_status: 'pagamento_na_instalacao',
      invoice_required: false,
      invoice_status: 'nao_solicitada',
      created_at: new Date().toISOString(),
    },
  ])

  // Store Installation Appointments (Single Bay / 1 slot per time)
  const [appointments, setAppointments] = useState<Appointment[]>([
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
  ])

  // Move opportunity stage in Kanban
  const handleMoveStage = (oppId: string, newStage: OpportunityStage) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stage: newStage, updated_at: new Date().toISOString() } : o))
    )
  }

  // Convert Won Opportunity to Operational Order
  const handleConvertToOrder = (opp: Opportunity) => {
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
  }

  // Save new proposal from Budget Builder to Kanban
  const handleSaveBudgetToKanban = (data: any) => {
    const newOpp: Opportunity = {
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

    setOpportunities((prev) => [newOpp, ...prev])
  }

  // Add Appointment
  const handleAddAppointment = (aptData: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      ...aptData,
      id: `apt-${Date.now()}`,
    }
    setAppointments((prev) => [...prev, newApt])
    return true
  }

  const handleSelectProductForBudget = (prod: Product, vehicle?: Vehicle) => {
    if (vehicle) {
      setSelectedVehicleForBudget(vehicle.id)
    }
    setActiveTab('budget')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'catalog' && (
          <CatalogView
            onSelectForBudget={handleSelectProductForBudget}
            onNavigateToBudget={() => setActiveTab('budget')}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetBuilderView
            initialVehicleId={selectedVehicleForBudget}
            onSaveToKanban={handleSaveBudgetToKanban}
          />
        )}

        {activeTab === 'kanban' && (
          <KanbanView
            opportunities={opportunities}
            onMoveStage={handleMoveStage}
            onConvertToOrder={handleConvertToOrder}
            onOpenNewBudget={() => setActiveTab('budget')}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            onUpdateOrderStatus={(ordId, nextSt) => {
              setOrders((prev) =>
                prev.map((o) => (o.id === ordId ? { ...o, status: nextSt } : o))
              )
            }}
            onToggleInvoiceRequest={(ordId) => {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === ordId ? { ...o, invoice_status: 'solicitada_ao_igor' } : o
                )
              )
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            appointments={appointments}
            onAddAppointment={handleAddAppointment}
          />
        )}

        {activeTab === 'setup' && (
          <SetupView onOpenSqlModal={() => setIsSqlModalOpen(true)} />
        )}
      </main>

      {/* SQL Script / Setup Modal */}
      <DatabaseSetupModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        <p>
          Robusty CRM © 2026 — Gestão Comercial, Bagageiros e Operação Integrada.
        </p>
      </footer>
    </div>
  )
}

export default App
