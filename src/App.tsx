import { useState, useEffect, useMemo, useCallback } from 'react'
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Sidebar, type ActiveTab } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { CatalogView } from './components/CatalogView'
import { BudgetBuilderView } from './components/BudgetBuilderView'
import { KanbanView } from './components/KanbanView'
import { CalendarView } from './components/CalendarView'
import { SettingsView } from './components/SettingsView'
import { LostOpportunitiesView } from './components/LostOpportunitiesView'
import { LoginView, type CurrentUser } from './components/LoginView'
import {
  KanbanSkeleton,
  CalendarSkeleton,
  BudgetSkeleton,
} from './components/SkeletonScreens'
import type {
  Opportunity,
  OpportunityStage,
  Order,
  OrderStatus,
  Appointment,
  OpportunityHistoryEvent,
} from './types'
import {
  fetchOpportunities,
  saveOpportunityToSupabase,
  updateOpportunityStage,
  closeOpportunityInSupabase,
  reopenOpportunityInSupabase,
  updateOpportunityTasks,
  deleteOpportunityFromSupabase,
  fetchOrders,
  upsertOrderInSupabase,
  updateOrderStatusInSupabase,
  fetchAppointments,
  createAppointmentInSupabase,
} from './services/crmService'

const STAGE_LABELS: Record<string, string> = {
  novo_lead: 'Novo lead',
  lead_recebido: 'Lead Recebido',
  contato_iniciado: 'Contato Iniciado',
  aguardando_cotacao: 'Aguardando Cotação',
  em_qualificacao: 'Em Qualificação',
  orcamento_enviado: 'Orçamento Enviado',
  em_negociacao: 'Em Negociação',
  aguardando_pagamento: 'Aguardando Pagamento',
  venda_ganha: 'Venda Ganha',
  venda_perdida: 'Venda Perdida',
}

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
  const [returnTab, setReturnTab] = useState<ActiveTab>('kanban')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [selectedVehicleForBudget, setSelectedVehicleForBudget] = useState<string | undefined>()

  // State for the opportunity being viewed/edited in Gerador de Orçamento
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)

  // 100% Supabase-backed CRM state (zero mock data)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoadingCrm, setIsLoadingCrm] = useState(true)
  const [crmLoadError, setCrmLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev))
    }, 4500)
  }, [])

  const lostOpportunitiesCount = useMemo(() => {
    return opportunities.filter((o) => o.stage === 'venda_perdida').length
  }, [opportunities])

  const loadCrmData = useCallback(async () => {
    setIsLoadingCrm(true)
    setCrmLoadError(null)
    try {
      const [opps, ords, apts] = await Promise.all([
        fetchOpportunities(),
        fetchOrders(),
        fetchAppointments(),
      ])
      setOpportunities(opps)
      setOrders(ords)
      setAppointments(apts)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os dados do Supabase.'
      console.error('Falha ao sincronizar dados com Supabase:', err)
      setCrmLoadError(message)
    } finally {
      setIsLoadingCrm(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function initialLoad() {
      try {
        const [opps, ords, apts] = await Promise.all([
          fetchOpportunities(),
          fetchOrders(),
          fetchAppointments(),
        ])
        if (cancelled) return
        setOpportunities(opps)
        setOrders(ords)
        setAppointments(apts)
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar os dados do Supabase.'
        console.error('Falha ao sincronizar dados com Supabase:', err)
        setCrmLoadError(message)
      } finally {
        if (!cancelled) setIsLoadingCrm(false)
      }
    }
    void initialLoad()
    return () => {
      cancelled = true
    }
  }, [])

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

  // Next sequential order/opportunity number across all records in Supabase
  const nextOpportunityNumber = useMemo(() => {
    const oppNums = opportunities
      .map((o) => o.order_number)
      .filter((n): n is number => typeof n === 'number' && !isNaN(n))
    const ordNums = orders
      .map((o) => o.order_number)
      .filter((n): n is number => typeof n === 'number' && !isNaN(n))
    const allNums = [...oppNums, ...ordNums]
    if (allNums.length === 0) return 1
    return Math.max(...allNums) + 1
  }, [opportunities, orders])

  const [budgetInstanceKey, setBudgetInstanceKey] = useState<number>(() => Date.now())

  // Open fresh Gerador de Orçamento (Nova Oportunidade)
  const handleOpenNewOpportunity = () => {
    setReturnTab('kanban')
    setSelectedVehicleForBudget(undefined)
    setEditingOpportunity(null)
    setBudgetInstanceKey(Date.now())
    setActiveTab('budget')
  }

  // Open existing Opportunity/Order in Gerador de Orçamento
  const handleSelectOpportunityToEdit = (opp: Opportunity) => {
    setReturnTab(activeTab === 'budget' ? returnTab : activeTab)
    setEditingOpportunity(opp)
    setBudgetInstanceKey(Date.now())
    setActiveTab('budget')
  }

  // Move stage inside Funil de Vendas with bidirectional sync in Supabase
  const handleMoveStage = async (oppId: string, newStage: OpportunityStage) => {
    const targetOpp = opportunities.find((o) => o.id === oppId)
    if (!targetOpp) return

    const oldLabel = STAGE_LABELS[targetOpp.stage] || targetOpp.stage
    const newLabel = STAGE_LABELS[newStage] || newStage
    const historyEvent: OpportunityHistoryEvent = {
      id: `hist-stage-${Date.now()}`,
      opportunity_id: oppId,
      type: 'stage_change',
      description: `Movimentação de etapa: de "${oldLabel}" para "${newLabel}"`,
      user: currentUser?.name || targetOpp.assigned_to || 'Equipe',
      created_at: new Date().toISOString(),
    }
    const updatedHistory = [historyEvent, ...(targetOpp.history || [])]
    const prevOpportunities = opportunities
    const prevOrders = orders
    const prevEditingOpp = editingOpportunity
    const updatedAtIso = new Date().toISOString()

    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === oppId
          ? {
              ...o,
              stage: newStage,
              history: updatedHistory,
              updated_at: updatedAtIso,
            }
          : o
      )
    )

    setEditingOpportunity((prev) =>
      prev && prev.id === oppId
        ? {
            ...prev,
            stage: newStage,
            history: updatedHistory,
            updated_at: updatedAtIso,
          }
        : prev
    )

    if (newStage === 'venda_perdida') {
      setOrders((prev) =>
        prev.map((ord) =>
          ord.opportunity_id === oppId ? { ...ord, status: 'pedido_cancelado' } : ord
        )
      )
    }

    try {
      await updateOpportunityStage(oppId, newStage, updatedHistory)
      if (newStage === 'venda_perdida') {
        const freshAppointments = await fetchAppointments()
        setAppointments(freshAppointments)
      }
    } catch (err) {
      setOpportunities(prevOpportunities)
      setOrders(prevOrders)
      setEditingOpportunity(prevEditingOpp)
      showToast(
        'error',
        err instanceof Error ? err.message : 'Erro ao mover oportunidade no Supabase.'
      )
    }
  }

  // 1-Click task toggle for TopBar & Kanban (persisted in Supabase)
  const handleToggleTask = async (oppId: string, taskId: string) => {
    const targetOpp = opportunities.find((o) => o.id === oppId)
    if (!targetOpp || !targetOpp.tasks) return

    const updatedTasks = targetOpp.tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed
        return {
          ...t,
          completed: nextCompleted,
          completed_at: nextCompleted ? new Date().toISOString() : undefined,
        }
      }
      return t
    })

    const prevOpportunities = opportunities
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === oppId
          ? { ...opp, tasks: updatedTasks, updated_at: new Date().toISOString() }
          : opp
      )
    )

    try {
      await updateOpportunityTasks(oppId, updatedTasks)
    } catch (err) {
      setOpportunities(prevOpportunities)
      showToast(
        'error',
        err instanceof Error ? err.message : 'Erro ao atualizar tarefa no Supabase.'
      )
    }
  }

  // Move status inside Funil de Pedidos with bidirectional sync in Supabase
  const handleUpdateOrderStatus = async (ordId: string, nextSt: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === ordId)
    if (!targetOrder) return

    const prevOrders = orders
    const prevOpportunities = opportunities

    setOrders((prev) => prev.map((o) => (o.id === ordId ? { ...o, status: nextSt } : o)))

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

    try {
      await updateOrderStatusInSupabase(ordId, nextSt, undefined, targetOrder.opportunity_id)
      if (nextSt === 'pedido_cancelado' || nextSt === 'pedido_concluido') {
        const freshAppointments = await fetchAppointments()
        setAppointments(freshAppointments)
      }
    } catch (err) {
      setOrders(prevOrders)
      setOpportunities(prevOpportunities)
      showToast(
        'error',
        err instanceof Error ? err.message : 'Erro ao atualizar status do pedido no Supabase.'
      )
    }
  }

  // Convert Opportunity to Order directly in Supabase
  const handleConvertToOrder = async (opp: Opportunity) => {
    try {
      await updateOpportunityStage(opp.id, 'venda_ganha')
      const createdOrder = await upsertOrderInSupabase({ ...opp, stage: 'venda_ganha' })
      const [freshOpps, freshOrds, freshApts] = await Promise.all([
        fetchOpportunities(),
        fetchOrders(),
        fetchAppointments(),
      ])
      setOpportunities(freshOpps)
      setOrders(freshOrds)
      setAppointments(freshApts)
      setActiveTab('kanban')
      showToast('success', `Pedido ${createdOrder.order_code || `#${createdOrder.order_number}`} gerado no Supabase.`)
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Erro ao gerar pedido no Supabase.'
      )
    }
  }

  // 1. Salvar: cria ou atualiza oportunidade no Supabase e sincroniza pedidos/agendamentos
  const handleSaveOpportunity = async (
    data: any,
    options?: { stayOnPage?: boolean }
  ): Promise<Opportunity | null> => {
    if (data.autoGenerateOrder) {
      await handleGenerateOrderFromBudget(data)
      return null
    }

    const existingOpp = data.id ? opportunities.find((o) => o.id === data.id) : undefined

    try {
      const savedOpp = await saveOpportunityToSupabase({
        id: data.id || null,
        contactId: data.contactId || existingOpp?.contact_id || null,
        orderNumber: data.orderNumber,
        assignedTo: data.assignedTo,
        customerName: data.customerName,
        customerPhone: data.customerPhone || '',
        commercialPhone: data.commercialPhone,
        customerEmail: data.customerEmail,
        personType: data.personType,
        documentType: data.documentType,
        document: data.document,
        stateRegistration: data.stateRegistration,
        municipalRegistration: data.municipalRegistration,
        tradeName: data.tradeName,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        websiteUrl: data.websiteUrl,
        leadOrigin: data.leadOrigin,
        vehicleId: data.vehicleId,
        vehicleModel: data.vehicleModel,
        stage: data.stage || existingOpp?.stage || 'novo_lead',
        fulfillmentType: data.fulfillment,
        subtotal: data.budget?.subtotal ?? 0,
        freightValue: data.budget?.freightValue ?? 0,
        installationValue: data.budget?.installationValue ?? 0,
        discountValue: data.budget?.discountValue ?? 0,
        discountPercent: data.budget?.discountPercent ?? 0,
        finalTotal: data.budget?.finalTotal ?? 0,
        paymentMethod: data.paymentMethod,
        paymentSubtype: data.paymentSubtype,
        cardInstallments: data.cardInstallments,
        paymentSplits: data.paymentSplits,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
        installationDate: data.installationDate,
        installationTime: data.installationTime,
        shippingCarrierName: data.shippingCarrierName,
        shippingTrackingCode: data.shippingTrackingCode,
        shippingQuoteNumber: data.shippingQuoteNumber,
        shippingCarrierContact: data.shippingCarrierContact,
        deliveryLeadTime: data.deliveryLeadTime,
        productionLeadTime: data.productionLeadTime,
        shippingPackageDimensions: data.shippingPackageDimensions,
        productColor: data.productColor,
        totalWeightKg: data.totalWeightKg,
        address: data.address,
        items: data.items,
        attachments: data.attachments ?? existingOpp?.attachments ?? [],
        comments: data.comments ?? existingOpp?.comments ?? [],
        history: data.history ?? existingOpp?.history ?? [],
        tasks: data.tasks ?? existingOpp?.tasks ?? [],
        notes: existingOpp?.notes,
      })

      setOpportunities((prev) => {
        const exists = prev.some((o) => o.id === savedOpp.id)
        return exists
          ? prev.map((o) => (o.id === savedOpp.id ? savedOpp : o))
          : [savedOpp, ...prev]
      })

      const [freshOrders, freshAppointments] = await Promise.all([
        fetchOrders(),
        fetchAppointments(),
      ])
      setOrders(freshOrders)
      setAppointments(freshAppointments)

      if (options?.stayOnPage) {
        setEditingOpportunity(savedOpp)
      } else {
        setEditingOpportunity(null)
        setActiveTab(returnTab)
        showToast('success', 'Oportunidade salva com sucesso no Supabase.')
      }

      return savedOpp
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Erro ao salvar oportunidade no Supabase.'
      )
      return null
    }
  }

  // Auto-save: atualiza o perfil do lead/oportunidade imediatamente no Supabase sem sair da tela
  const handleAutoSaveOpportunity = async (data: any): Promise<Opportunity | null> => {
    return handleSaveOpportunity(data, { stayOnPage: true })
  }

  // 2. Gerar Pedido: salva oportunidade como venda ganha e cria/atualiza pedido no Supabase
  const handleGenerateOrderFromBudget = async (data: any) => {
    const existingOpp = data.id ? opportunities.find((o) => o.id === data.id) : undefined

    try {
      const savedOpp = await saveOpportunityToSupabase({
        id: data.id || null,
        contactId: data.contactId || existingOpp?.contact_id || null,
        orderNumber: data.orderNumber,
        assignedTo: data.assignedTo,
        customerName: data.customerName,
        customerPhone: data.customerPhone || '',
        commercialPhone: data.commercialPhone,
        customerEmail: data.customerEmail,
        personType: data.personType,
        documentType: data.documentType,
        document: data.document,
        stateRegistration: data.stateRegistration,
        municipalRegistration: data.municipalRegistration,
        tradeName: data.tradeName,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        websiteUrl: data.websiteUrl,
        leadOrigin: data.leadOrigin,
        vehicleId: data.vehicleId,
        vehicleModel: data.vehicleModel,
        stage: 'venda_ganha',
        fulfillmentType: data.fulfillment,
        subtotal: data.budget?.subtotal ?? 0,
        freightValue: data.budget?.freightValue ?? 0,
        installationValue: data.budget?.installationValue ?? 0,
        discountValue: data.budget?.discountValue ?? 0,
        discountPercent: data.budget?.discountPercent ?? 0,
        finalTotal: data.budget?.finalTotal ?? 0,
        paymentMethod: data.paymentMethod,
        paymentSubtype: data.paymentSubtype,
        cardInstallments: data.cardInstallments,
        paymentSplits: data.paymentSplits,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
        installationDate: data.installationDate,
        installationTime: data.installationTime,
        shippingCarrierName: data.shippingCarrierName,
        shippingTrackingCode: data.shippingTrackingCode,
        shippingQuoteNumber: data.shippingQuoteNumber,
        shippingCarrierContact: data.shippingCarrierContact,
        deliveryLeadTime: data.deliveryLeadTime,
        productionLeadTime: data.productionLeadTime,
        shippingPackageDimensions: data.shippingPackageDimensions,
        productColor: data.productColor,
        totalWeightKg: data.totalWeightKg,
        address: data.address,
        items: data.items,
        attachments: data.attachments ?? existingOpp?.attachments ?? [],
        comments: data.comments ?? existingOpp?.comments ?? [],
        history: data.history ?? existingOpp?.history ?? [],
        tasks: data.tasks ?? existingOpp?.tasks ?? [],
        notes: existingOpp?.notes,
      })

      await upsertOrderInSupabase(savedOpp)

      const [freshOpps, freshOrders, freshAppointments] = await Promise.all([
        fetchOpportunities(),
        fetchOrders(),
        fetchAppointments(),
      ])

      setOpportunities(freshOpps)
      setOrders(freshOrders)
      setAppointments(freshAppointments)
      setEditingOpportunity(null)
      setActiveTab('orders')
      showToast('success', 'Pedido gerado e sincronizado com o Supabase.')
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Erro ao gerar pedido no Supabase.'
      )
    }
  }

  // 3. Apagar Orçamento (remove do Supabase)
  const handleDeleteOpportunity = async (oppId: string) => {
    try {
      await deleteOpportunityFromSupabase(oppId)
      setOpportunities((prev) => prev.filter((o) => o.id !== oppId))
      setOrders((prev) => prev.filter((ord) => ord.opportunity_id !== oppId))
      setAppointments((prev) => prev.filter((apt) => apt.opportunity_id !== oppId))
      setEditingOpportunity(null)
      setActiveTab(returnTab)
      showToast('success', 'Orçamento excluído do Supabase.')
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Erro ao excluir orçamento no Supabase.'
      )
    }
  }

  // 4. Encerrar Oportunidade com Motivo (Oportunidade Perdida no Supabase)
  const handleCloseOpportunity = async (oppId: string, reason: string, details?: string) => {
    try {
      const authorName = currentUser?.name || 'Equipe'
      const updated = await closeOpportunityInSupabase(oppId, reason, details, authorName)
      setOpportunities((prev) => prev.map((o) => (o.id === oppId ? updated : o)))
      if (editingOpportunity?.id === oppId) {
        setEditingOpportunity(null)
      }
      setActiveTab('lost_opportunities')
      showToast('success', 'Negociação encerrada com sucesso.')
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Erro ao encerrar oportunidade no Supabase.'
      )
    }
  }

  // 5. Reativar Oportunidade (retorna para 1. Novo Lead preservando todos os dados)
  const handleReopenOpportunity = async (oppId: string) => {
    try {
      const authorName = currentUser?.name || 'Equipe'
      const updated = await reopenOpportunityInSupabase(oppId, authorName)
      setOpportunities((prev) => prev.map((o) => (o.id === oppId ? updated : o)))
      if (editingOpportunity?.id === oppId) {
        setEditingOpportunity(null)
      }
      setActiveTab('kanban')
      showToast('success', 'Oportunidade reativada! Retornou para Novo Lead no Funil de Vendas.')
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Erro ao reativar oportunidade no Supabase.'
      )
    }
  }

  const handleAddAppointment = async (aptData: Omit<Appointment, 'id'>) => {
    try {
      const created = await createAppointmentInSupabase(aptData)
      setAppointments((prev) => [...prev, created])
      showToast('success', 'Agendamento salvo no Supabase.')
      return true
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Erro ao salvar agendamento no Supabase.'
      )
      return false
    }
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
        lostCount={lostOpportunitiesCount}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Area */}
      <div className={`md:pl-64 flex-1 flex flex-col min-w-0 ${(activeTab === 'kanban' || activeTab === 'orders') ? 'h-screen overflow-hidden' : ''}`}>
        <TopBar
          activeTab={activeTab}
          onToggleMobile={() => setIsMobileSidebarOpen(true)}
          onNewLeadClick={handleOpenNewOpportunity}
          currentUser={currentUser}
          onLogout={handleLogout}
          opportunities={opportunities}
          onSelectOpportunity={handleSelectOpportunityToEdit}
          onToggleTask={handleToggleTask}
        />

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 max-w-md animate-fade-in">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg border text-xs font-bold ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Supabase Error Banner */}
        {crmLoadError && activeTab !== 'catalog' && activeTab !== 'settings' && (
          <div className="mx-4 sm:mx-6 mt-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-900">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{crmLoadError}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadCrmData()}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar novamente</span>
            </button>
          </div>
        )}

        <main className={`flex-1 w-full ${(activeTab === 'kanban' || activeTab === 'orders') ? 'p-3 sm:px-6 sm:py-3 flex flex-col min-h-0 overflow-hidden max-w-full' : 'p-4 sm:p-6 sm:py-8 max-w-7xl mx-auto'}`}>
          {isLoadingCrm && activeTab !== 'catalog' && activeTab !== 'settings' ? (
            <>
              {(activeTab === 'kanban' || activeTab === 'orders') && <KanbanSkeleton />}
              {activeTab === 'calendar' && <CalendarSkeleton />}
              {activeTab === 'budget' && <BudgetSkeleton />}
            </>
          ) : (
            <>
              {activeTab === 'kanban' && (
                <KanbanView
                  mode="vendas"
                  opportunities={opportunities}
                  orders={orders}
                  onMoveStage={handleMoveStage}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onConvertToOrder={handleConvertToOrder}
                  onCloseOpportunity={handleCloseOpportunity}
                  onOpenNewBudget={handleOpenNewOpportunity}
                  onSelectOpportunity={handleSelectOpportunityToEdit}
                />
              )}

              {activeTab === 'budget' && (
                <BudgetBuilderView
                  key={budgetInstanceKey}
                  initialVehicleId={selectedVehicleForBudget}
                  initialOpportunity={editingOpportunity}
                  existingOrderNumber={nextOpportunityNumber}
                  existingOrders={orders}
                  existingOpportunities={opportunities}
                  existingAppointments={appointments}
                  currentUser={currentUser}
                  onSaveToKanban={handleSaveOpportunity}
                  onAutoSaveOpportunity={handleAutoSaveOpportunity}
                  onChangeStage={handleMoveStage}
                  onGenerateOrder={handleGenerateOrderFromBudget}
                  onDeleteOpportunity={handleDeleteOpportunity}
                  onMarkLost={handleCloseOpportunity}
                  onReopenOpportunity={handleReopenOpportunity}
                  onClose={() => setActiveTab(returnTab)}
                />
              )}

              {activeTab === 'catalog' && <CatalogView />}

              {activeTab === 'orders' && (
                <KanbanView
                  mode="pedidos"
                  opportunities={opportunities}
                  orders={orders}
                  onMoveStage={handleMoveStage}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onConvertToOrder={handleConvertToOrder}
                  onSelectOpportunity={handleSelectOpportunityToEdit}
                />
              )}

              {activeTab === 'lost_opportunities' && (
                <LostOpportunitiesView
                  opportunities={opportunities}
                  onOpenOpportunity={handleSelectOpportunityToEdit}
                  onReopenOpportunity={handleReopenOpportunity}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView
                  orders={orders}
                  opportunities={opportunities}
                  appointments={appointments}
                  onAddAppointment={handleAddAppointment}
                />
              )}

              {activeTab === 'settings' && <SettingsView />}
            </>
          )}
        </main>

        {activeTab !== 'kanban' && activeTab !== 'orders' && (
          <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-400">
            CRM Robusty © 2026 — Fabricação e Comercialização de Bagageiros Automotivos
          </footer>
        )}
      </div>
    </div>
  )
}

export default App
