import React, { useState, useMemo } from 'react'
import type { Order, Opportunity, Appointment, LeadOrigin } from '../types'
import { formatOrderCode } from '../utils/formatters'
import {
  Calendar as CalendarIcon,
  Clock,
  Wrench,
  Truck,
  User,
  Lock,
  X,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  Weight,
  Phone,
  Store,
  CalendarDays,
  List,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  CalendarX2,
  Hourglass
} from 'lucide-react'
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaTruck,
  FaVanShuttle,
  FaCarSide,
  FaTruckPickup
} from 'react-icons/fa6'

export interface CalendarEvent {
  id: string
  type: 'coleta' | 'instalacao'
  date: string // YYYY-MM-DD
  time: string // HH:mm
  orderNumber?: number
  orderCode?: string
  clientName: string
  clientPhone?: string
  clientEmail?: string
  origin?: LeadOrigin
  vehicleModel: string
  itemsSummary: string
  totalWeightKg?: number
  shippingCarrierName?: string
  shippingTrackingCode?: string
  shippingAddress?: {
    street?: string
    number?: string
    neighborhood?: string
    city?: string
    state?: string
    cep?: string
  }
  status: string
  sourceType: 'order' | 'opportunity' | 'appointment'
  notes?: string
  opportunityRef?: Opportunity
  appointmentRef?: Appointment
}

interface CalendarViewProps {
  orders?: Order[]
  opportunities?: Opportunity[]
  appointments?: Appointment[]
  onAddAppointment?: (apt: Omit<Appointment, 'id'>) => boolean | Promise<boolean>
  onOpenAppointmentLead?: (opp: Opportunity, apt: Appointment) => void
}

// Helpers para limpeza de modelos de veículos (sem VW, Fiat, Renault, etc.)
const cleanVehicleName = (modelStr?: string) => {
  if (!modelStr) return { modelName: 'Veículo Utilitário', iconType: 'default' }
  const s = modelStr.toLowerCase()
  if (s.includes('kombi')) return { modelName: 'Kombi', iconType: 'kombi' }
  if (s.includes('ducato')) return { modelName: 'Ducato', iconType: 'large_van' }
  if (s.includes('master')) return { modelName: 'Master', iconType: 'large_van' }
  if (s.includes('boxer')) return { modelName: 'Boxer', iconType: 'large_van' }
  if (s.includes('jumper')) return { modelName: 'Jumper', iconType: 'large_van' }
  if (s.includes('daily')) return { modelName: 'Iveco Daily', iconType: 'large_van' }
  if (s.includes('transit')) return { modelName: 'Transit', iconType: 'large_van' }
  if (s.includes('sprinter')) return { modelName: 'Sprinter', iconType: 'large_van' }
  if (s.includes('scudo')) return { modelName: 'Scudo', iconType: 'medium_van' }
  if (s.includes('expert')) return { modelName: 'Expert', iconType: 'medium_van' }
  if (s.includes('jumpy')) return { modelName: 'Jumpy', iconType: 'medium_van' }
  if (s.includes('fiorino')) return { modelName: 'Fiorino', iconType: 'small_van' }
  if (s.includes('kangoo')) return { modelName: 'Kangoo', iconType: 'small_van' }
  if (s.includes('doblo') || s.includes('doblò')) return { modelName: 'Doblò', iconType: 'small_van' }
  if (s.includes('partner')) return { modelName: 'Partner', iconType: 'small_van' }
  if (s.includes('hr') || s.includes('bongo')) return { modelName: s.includes('bongo') ? 'Bongo' : 'Hyundai HR', iconType: 'truck' }

  const clean = modelStr
    .replace(/^(vw|volkswagen|fiat|renault|peugeot|citroen|citroën|mercedes|mercedes-benz|ford|iveco|hyundai|kia)\s+/i, '')
    .trim()
  return { modelName: clean || 'Utilitário', iconType: 'default' }
}

const renderVehicleIcon = (iconType: string) => {
  switch (iconType) {
    case 'kombi':
    case 'medium_van':
      return <FaVanShuttle className="w-3.5 h-3.5 shrink-0" />
    case 'large_van':
      return <FaTruck className="w-3.5 h-3.5 shrink-0" />
    case 'small_van':
      return <FaCarSide className="w-3.5 h-3.5 shrink-0" />
    case 'truck':
      return <FaTruckPickup className="w-3.5 h-3.5 shrink-0" />
    default:
      return <FaCarSide className="w-3.5 h-3.5 shrink-0" />
  }
}

const renderOriginIcon = (origin?: LeadOrigin) => {
  switch (origin) {
    case 'whatsapp_inbound':
      return <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
    case 'instagram_direct':
      return <FaInstagram className="w-3.5 h-3.5 text-[#E1306C] shrink-0" />
    case 'meta_lead_ads':
      return <FaFacebook className="w-3.5 h-3.5 text-[#1877F2] shrink-0" />
    case 'loja_presencial':
    default:
      return <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
  }
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  orders = [],
  opportunities = [],
  appointments = [],
  onOpenAppointmentLead
}) => {
  // Navigation State
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('list')
  const [filterType, setFilterType] = useState<'all' | 'coleta' | 'instalacao'>('all')
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'awaiting' | 'completed' | 'missed' | 'all'>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')

  // Selected date for day view and reference for month/week navigation
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [selectedEventModal, setSelectedEventModal] = useState<CalendarEvent | null>(null)

  const handleSelectEvent = (ev: CalendarEvent) => {
    if (onOpenAppointmentLead && ev.opportunityRef && ev.appointmentRef) {
      onOpenAppointmentLead(ev.opportunityRef, ev.appointmentRef)
      return
    }
    setSelectedEventModal(ev)
  }

  // Unify and integrate ONLY confirmed appointments, enriched with latest Order/Opportunity data
  const allEvents = useMemo(() => {
    const list: CalendarEvent[] = []

    appointments.forEach((apt) => {
      if (apt.status === 'cancelado') return

      const ord = orders.find(
        (o) => (apt.order_id && o.id === apt.order_id) || (apt.opportunity_id && o.opportunity_id === apt.opportunity_id)
      )
      const opp =
        opportunities.find((o) => apt.opportunity_id && o.id === apt.opportunity_id) ||
        ord?.opportunity

      if (opp?.stage === 'venda_perdida') return
      if (ord?.status === 'pedido_cancelado') return

      const eventType: 'coleta' | 'instalacao' = apt.event_type === 'coleta' ? 'coleta' : 'instalacao'
      const datePart =
        (eventType === 'coleta' ? ord?.pickup_date || opp?.pickup_date : ord?.installation_date || opp?.installation_date) ||
        apt.scheduled_start.split('T')[0]
      const timePart =
        (eventType === 'coleta' ? ord?.pickup_time || opp?.pickup_time : ord?.installation_time || opp?.installation_time) ||
        apt.scheduled_start.split('T')[1]?.slice(0, 5) ||
        '09:30'

      const vehicleRaw = opp?.vehicle_model_year || opp?.vehicle?.model || apt.vehicle_description || 'Utilitário'
      const { modelName } = cleanVehicleName(vehicleRaw)
      const productsSummary =
        opp?.items?.length
          ? opp.items.map((it) => `${it.quantity}x ${it.product?.name || 'Produto'}`).join(', ')
          : apt.products_summary || 'Itens não especificados'

      list.push({
        id: `apt-${apt.id}`,
        type: eventType,
        date: datePart,
        time: timePart,
        orderNumber: ord?.order_number || opp?.order_number,
        orderCode: ord?.order_code || opp?.order_code || formatOrderCode(ord?.order_number || opp?.order_number),
        clientName: ord?.contact?.full_name || opp?.contact?.full_name || apt.contact?.full_name || 'Cliente',
        clientPhone: ord?.contact?.phone_e164 || opp?.contact?.phone_e164 || apt.contact?.phone_e164,
        clientEmail: ord?.customer_email || opp?.customer_email || opp?.contact?.email || apt.contact?.email,
        origin: ord?.contact?.origin || opp?.contact?.origin || apt.contact?.origin || 'loja_presencial',
        vehicleModel: modelName,
        itemsSummary: productsSummary,
        totalWeightKg: ord?.total_weight_kg || opp?.total_weight_kg,
        shippingCarrierName: ord?.shipping_carrier_name || opp?.shipping_carrier_name,
        shippingTrackingCode: ord?.shipping_tracking_code || opp?.shipping_tracking_code,
        shippingAddress: opp?.address,
        status: apt.status,
        sourceType: ord ? 'order' : opp ? 'opportunity' : 'appointment',
        notes: ord?.internal_notes || opp?.notes || apt.notes,
        opportunityRef: opp,
        appointmentRef: apt,
      })
    })

    // Ordenar cronologicamente por data e hora
    return list.sort((a, b) => {
      const cmpDate = a.date.localeCompare(b.date)
      if (cmpDate !== 0) return cmpDate
      return a.time.localeCompare(b.time)
    })
  }, [orders, opportunities, appointments])

  const getEventOperationalStatus = (ev: CalendarEvent): 'upcoming' | 'awaiting' | 'completed' | 'missed' => {
    if (ev.status === 'concluido') return 'completed'
    if (ev.status === 'reagendado') return 'missed'
    const dt = new Date(`${ev.date}T${ev.time || '09:00'}:00`)
    if (!isNaN(dt.getTime()) && new Date() >= dt) return 'awaiting'
    return 'upcoming'
  }

  // Estatísticas operacionais
  const countUpcoming = useMemo(
    () => allEvents.filter((e) => getEventOperationalStatus(e) === 'upcoming').length,
    [allEvents]
  )
  const countAwaiting = useMemo(
    () => allEvents.filter((e) => getEventOperationalStatus(e) === 'awaiting').length,
    [allEvents]
  )
  const countCompleted = useMemo(
    () => allEvents.filter((e) => getEventOperationalStatus(e) === 'completed').length,
    [allEvents]
  )
  const countMissed = useMemo(
    () => allEvents.filter((e) => getEventOperationalStatus(e) === 'missed').length,
    [allEvents]
  )

  // Filtragem por tipo, status operacional e busca
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (filterType !== 'all' && ev.type !== filterType) return false
      if (viewMode === 'list' && statusFilter !== 'all' && getEventOperationalStatus(ev) !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchClient = ev.clientName.toLowerCase().includes(q)
        const matchVehicle = ev.vehicleModel.toLowerCase().includes(q)
        const matchCode = ev.orderCode?.toLowerCase().includes(q)
        const matchCity = ev.shippingAddress?.city?.toLowerCase().includes(q)
        const matchCarrier = ev.shippingCarrierName?.toLowerCase().includes(q)
        if (!matchClient && !matchVehicle && !matchCode && !matchCity && !matchCarrier) {
          return false
        }
      }
      return true
    })
  }, [allEvents, filterType, statusFilter, viewMode, searchQuery])

  // Estatísticas rápidas
  const countInstalacoes = allEvents.filter((e) => e.type === 'instalacao').length
  const countColetas = allEvents.filter((e) => e.type === 'coleta').length

  // Date Navigation Helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const handlePrev = () => {
    const next = new Date(currentDate)
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1)
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7)
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() - 1)
    }
    setCurrentDate(next)
  }

  const handleNext = () => {
    const next = new Date(currentDate)
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1)
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7)
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() + 1)
    }
    setCurrentDate(next)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Month Grid Calculation
  const monthGrid = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const cells: Array<{
      dayNumber: number
      dateStr: string
      isCurrentMonth: boolean
      isToday: boolean
      events: CalendarEvent[]
    }> = []

    const todayStr = new Date().toISOString().split('T')[0]

    // Preencher dias anteriores do mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i
      const prevDate = new Date(year, month - 1, dayNum)
      const dateStr = prevDate.toISOString().split('T')[0]
      const dayEvents = filteredEvents.filter((e) => e.date === dateStr)
      cells.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: dayEvents
      })
    }

    // Preencher dias do mês atual
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const curDate = new Date(year, month, dayNum)
      const dateStr = curDate.toISOString().split('T')[0]
      const dayEvents = filteredEvents.filter((e) => e.date === dateStr)
      cells.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: dayEvents
      })
    }

    // Completar o grid até fechar 35 ou 42 células
    const remaining = (7 - (cells.length % 7)) % 7
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextDate = new Date(year, month + 1, dayNum)
      const dateStr = nextDate.toISOString().split('T')[0]
      const dayEvents = filteredEvents.filter((e) => e.date === dateStr)
      cells.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: dayEvents
      })
    }

    return cells
  }, [year, month, filteredEvents])

  // Week Grid Calculation
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate)
    const firstDayOfWeek = new Date(curr.setDate(curr.getDate() - curr.getDay()))
    const days: Array<{
      dayName: string
      dateStr: string
      dayNum: number
      isToday: boolean
      events: CalendarEvent[]
    }> = []

    const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const todayStr = new Date().toISOString().split('T')[0]

    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDayOfWeek)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({
        dayName: names[i],
        dateStr,
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
        events: filteredEvents.filter((e) => e.date === dateStr)
      })
    }

    return days
  }, [currentDate, filteredEvents])

  // Day View Hours Slots (08:00 às 18:00)
  const DAY_HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
  const selectedDateStr = currentDate.toISOString().split('T')[0]
  const dayEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.date === selectedDateStr)
  }, [filteredEvents, selectedDateStr])

  // Month name formatting
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  // Relative countdown helper
  const getRelativeDayBadge = (dateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [y, m, d] = dateStr.split('-').map(Number)
    const target = new Date(y, m - 1, d)
    target.setHours(0, 0, 0, 0)

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Hoje</span>
    }
    if (diffDays === 1) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Amanhã</span>
    }
    if (diffDays > 1 && diffDays <= 7) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Em {diffDays} dias</span>
    }
    if (diffDays < 0) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400">Passado</span>
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600">{dateStr.split('-').reverse().slice(0, 2).join('/')}</span>
  }

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#121212] tracking-tight">
            Agenda Operacional
          </h2>
        </div>

        {/* View Toggle: Lista / Calendário */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode !== 'list'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Calendário</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('upcoming')
            setViewMode('list')
          }}
          className={`text-left bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            viewMode === 'list' && statusFilter === 'upcoming'
              ? 'border-blue-400 ring-2 ring-blue-100 shadow-sm'
              : 'border-slate-200/80 hover:border-blue-300 shadow-nexo'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500">Próximos Compromissos</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{countUpcoming}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Agendados futuros</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('awaiting')
            setViewMode('list')
          }}
          className={`text-left bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            viewMode === 'list' && statusFilter === 'awaiting'
              ? 'border-amber-400 ring-2 ring-amber-100 shadow-sm'
              : 'border-slate-200/80 hover:border-amber-300 shadow-nexo'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500">Aguardando Baixa</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{countAwaiting}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Pendentes de confirmação</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Hourglass className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('completed')
            setViewMode('list')
          }}
          className={`text-left bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            viewMode === 'list' && statusFilter === 'completed'
              ? 'border-emerald-400 ring-2 ring-emerald-100 shadow-sm'
              : 'border-slate-200/80 hover:border-emerald-300 shadow-nexo'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500">Realizados</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{countCompleted}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Concluídos com sucesso</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('missed')
            setViewMode('list')
          }}
          className={`text-left bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            viewMode === 'list' && statusFilter === 'missed'
              ? 'border-rose-400 ring-2 ring-rose-100 shadow-sm'
              : 'border-slate-200/80 hover:border-rose-300 shadow-nexo'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500">Não Aconteceu</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">{countMissed}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Reagendamento necessário</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <CalendarX2 className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-nexo space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filter Pills */}
          {viewMode === 'list' ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('upcoming')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'upcoming'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Próximos ({countUpcoming})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('awaiting')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'awaiting'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Aguardando Baixa ({countAwaiting})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Realizados ({countCompleted})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('missed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'missed'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                Não Aconteceu ({countMissed})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#EA580C] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({allEvents.length})
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Mês</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Semana</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'day' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Dia</span>
              </button>
            </div>
          )}

          {/* Right: Search + Modality Select */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente, código, veículo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'coleta' | 'instalacao')}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#EA580C] cursor-pointer"
              >
                <option value="all">Todas as Modalidades ({allEvents.length})</option>
                <option value="instalacao">Instalação na Loja ({countInstalacoes})</option>
                <option value="coleta">Coleta Transportadora ({countColetas})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation Bar (for Month, Week, Day) */}
      {viewMode !== 'list' && (
        <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-nexo flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              title="Anterior"
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              title="Próximo"
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Period Title */}
          <div className="text-base font-bold text-[#121212] tracking-tight">
            {viewMode === 'month' && capitalizedMonthName}
            {viewMode === 'week' && `Semana: ${weekDays[0].dateStr.split('-').reverse().slice(0, 2).join('/')} a ${weekDays[6].dateStr.split('-').reverse().slice(0, 2).join('/')} de ${year}`}
            {viewMode === 'day' && currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>

          {/* Jump to specific date */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split('-').map(Number)
                  setCurrentDate(new Date(y, m - 1, d))
                }
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-[#EA580C]"
            />
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* VIEW 1: MONTH VIEW (MÊS)                                   */}
      {/* ========================================================== */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-nexo overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center text-xs font-bold text-slate-600 py-3">
            <div>Domingo</div>
            <div>Segunda</div>
            <div>Terça</div>
            <div>Quarta</div>
            <div>Quinta</div>
            <div>Sexta</div>
            <div>Sábado</div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {monthGrid.map((cell, idx) => (
              <div
                key={idx}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                  cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/40 text-slate-300'
                } ${cell.isToday ? 'bg-orange-50/20' : ''}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    onClick={() => {
                      const [y, m, d] = cell.dateStr.split('-').map(Number)
                      setCurrentDate(new Date(y, m - 1, d))
                      setViewMode('day')
                    }}
                    title="Ver detalhes deste dia"
                    className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md cursor-pointer transition-colors ${
                      cell.isToday
                        ? 'bg-[#EA580C] text-white shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-slate-800 hover:bg-slate-100'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {cell.events.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">
                      {cell.events.length}
                    </span>
                  )}
                </div>

                {/* Event Pills */}
                <div className="space-y-1 overflow-y-auto max-h-[85px] pr-0.5">
                  {cell.events.map((ev) => {
                    const isColeta = ev.type === 'coleta'
                    return (
                      <div
                        key={ev.id}
                        onClick={() => handleSelectEvent(ev)}
                        title={`${isColeta ? 'Coleta' : 'Instalação'} - ${ev.clientName} (${ev.vehicleModel}) às ${ev.time}`}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer truncate flex items-center gap-1.5 ${
                          isColeta
                            ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/80 shadow-2xs'
                            : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/80 shadow-2xs'
                        }`}
                      >
                        <span className="font-mono font-bold text-[10px] shrink-0">
                          {ev.time}
                        </span>
                        <span className="shrink-0">
                          {isColeta ? (
                            <Truck className="w-2.5 h-2.5 text-sky-600" />
                          ) : (
                            <Wrench className="w-2.5 h-2.5 text-purple-600" />
                          )}
                        </span>
                        <span className="truncate font-semibold">
                          {ev.vehicleModel} • {ev.clientName}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* VIEW 2: WEEK VIEW (SEMANA)                                 */}
      {/* ========================================================== */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-nexo overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {weekDays.map((col, idx) => (
              <div key={idx} className={`p-3 min-h-[360px] flex flex-col ${col.isToday ? 'bg-orange-50/15' : ''}`}>
                {/* Column Day Header */}
                <div className="pb-3 border-b border-slate-100 text-center mb-3">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                    {col.dayName}
                  </div>
                  <div
                    onClick={() => {
                      const [y, m, d] = col.dateStr.split('-').map(Number)
                      setCurrentDate(new Date(y, m - 1, d))
                      setViewMode('day')
                    }}
                    className={`inline-block mt-1 font-mono text-sm font-bold px-2 py-0.5 rounded-lg cursor-pointer ${
                      col.isToday
                        ? 'bg-[#EA580C] text-white'
                        : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {col.dayNum}
                  </div>
                </div>

                {/* Day events in week */}
                <div className="space-y-2 flex-1">
                  {col.events.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic">
                      Nenhum agendamento
                    </div>
                  ) : (
                    col.events.map((ev) => {
                      const isColeta = ev.type === 'coleta'
                      const { iconType } = cleanVehicleName(ev.vehicleModel)
                      return (
                        <div
                          key={ev.id}
                          onClick={() => handleSelectEvent(ev)}
                          className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer hover:shadow-xs ${
                            isColeta
                              ? 'bg-sky-50/80 border-sky-200 text-sky-900 border-l-4 border-l-sky-500'
                              : 'bg-purple-50/80 border-purple-200 text-purple-900 border-l-4 border-l-purple-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono font-bold text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {ev.time}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isColeta ? 'bg-sky-200/60 text-sky-800' : 'bg-purple-200/60 text-purple-800'
                            }`}>
                              {isColeta ? 'Coleta' : 'Instalação'}
                            </span>
                          </div>

                          <div className="font-bold text-slate-900 truncate mb-1">
                            {ev.clientName}
                          </div>

                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 truncate">
                            <span className="text-slate-700">{renderVehicleIcon(iconType)}</span>
                            <span className="truncate">{ev.vehicleModel}</span>
                          </div>

                          {ev.totalWeightKg && (
                            <div className="text-[10px] text-slate-500 mt-1 font-mono">
                              Carga: {ev.totalWeightKg} kg
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* VIEW 3: DAY VIEW (DIA)                                     */}
      {/* ========================================================== */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-nexo p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Programação do Dia
              </div>
              <div className="text-lg font-bold text-[#121212]">
                {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {dayEvents.length} compromissos no dia
              </span>
            </div>
          </div>

          {/* Time Slots Timeline */}
          <div className="space-y-3 pt-2">
            {DAY_HOURS.map((hour) => {
              const eventsInHour = dayEvents.filter((e) => e.time.startsWith(hour.slice(0, 2)))

              return (
                <div key={hour} className="flex items-start gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  {/* Hour label */}
                  <div className="w-16 font-mono text-xs font-bold text-slate-500 flex items-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{hour}</span>
                  </div>

                  {/* Slot content */}
                  <div className="flex-1">
                    {eventsInHour.length === 0 ? (
                      <span className="text-xs text-slate-300 font-medium italic">
                        Horário livre (Sem coletas ou instalações)
                      </span>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {eventsInHour.map((ev) => {
                          const isColeta = ev.type === 'coleta'
                          const { iconType } = cleanVehicleName(ev.vehicleModel)
                          return (
                            <div
                              key={ev.id}
                              onClick={() => handleSelectEvent(ev)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-xs ${
                                isColeta
                                  ? 'bg-sky-50/80 border-sky-200 text-sky-900 border-l-4 border-l-sky-500'
                                  : 'bg-purple-50/80 border-purple-200 text-purple-900 border-l-4 border-l-purple-500'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-xs font-bold flex items-center gap-1.5">
                                  {isColeta ? <Truck className="w-3.5 h-3.5 text-sky-600" /> : <Wrench className="w-3.5 h-3.5 text-purple-600" />}
                                  <span>{isColeta ? 'Coleta Transportadora' : 'Instalação na Loja'}</span>
                                </span>
                                {ev.orderCode && (
                                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
                                    {ev.orderCode}
                                  </span>
                                )}
                              </div>

                              <div className="text-sm font-bold text-slate-900 mb-1">
                                {ev.clientName}
                              </div>

                              <div className="text-xs text-slate-700 flex items-center gap-1.5 mb-1.5">
                                <span>{renderVehicleIcon(iconType)}</span>
                                <span className="font-medium">{ev.vehicleModel}</span>
                              </div>

                              <div className="text-[11px] text-slate-600 truncate">
                                {ev.itemsSummary}
                              </div>

                              {isColeta && ev.shippingCarrierName && (
                                <div className="mt-2 text-[10px] text-sky-800 bg-sky-100/70 px-2 py-1 rounded font-medium flex items-center gap-1">
                                  <Truck className="w-3 h-3 text-sky-600" />
                                  <span>Transp: {ev.shippingCarrierName}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* VIEW 4: LIST VIEW (LISTA DE PRÓXIMOS AGENDAMENTOS)         */}
      {/* ========================================================== */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-nexo">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Nenhum compromisso encontrado</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tente ajustar o filtro de status, modalidade ou busca para visualizar outros agendamentos.
              </p>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isColeta = ev.type === 'coleta'
              const { iconType } = cleanVehicleName(ev.vehicleModel)
              const opStatus = getEventOperationalStatus(ev)

              const [yStr, mStr, dStr] = ev.date.split('-')
              const dateObj = new Date(Number(yStr), Number(mStr) - 1, Number(dStr))
              const monthShort = dateObj
                .toLocaleDateString('pt-BR', { month: 'short' })
                .replace('.', '')
                .toUpperCase()
              const weekdayFull = dateObj.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })

              const dateBoxTheme =
                opStatus === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : opStatus === 'missed'
                    ? 'bg-rose-600 text-white'
                    : opStatus === 'awaiting'
                      ? 'bg-amber-500 text-white'
                      : isColeta
                        ? 'bg-sky-600 text-white'
                        : 'bg-purple-600 text-white'

              const statusBadge =
                opStatus === 'completed' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isColeta ? 'Coleta Efetuada' : 'Instalação Efetuada'}</span>
                  </span>
                ) : opStatus === 'missed' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    <CalendarX2 className="w-3 h-3" />
                    <span>Não Aconteceu</span>
                  </span>
                ) : opStatus === 'awaiting' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    <Hourglass className="w-3 h-3" />
                    <span>Aguardando Baixa</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    <Clock className="w-3 h-3" />
                    <span>Agendado</span>
                  </span>
                )

              const cleanPhoneDigits = (ev.clientPhone || '').replace(/\D/g, '')
              const whatsappUrl = cleanPhoneDigits
                ? `https://wa.me/${cleanPhoneDigits.startsWith('55') ? cleanPhoneDigits : `55${cleanPhoneDigits}`}`
                : null

              return (
                <div
                  key={ev.id}
                  onClick={() => handleSelectEvent(ev)}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-[#EA580C]/60 transition-all cursor-pointer hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Colored Date Square + Main Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={`w-16 h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-xs ${dateBoxTheme}`}
                    >
                      <span className="text-[10px] font-bold tracking-wider opacity-90">{monthShort}</span>
                      <span className="text-2xl font-extrabold leading-none my-0.5">{dStr}</span>
                      <span className="text-[11px] font-mono font-bold opacity-95">{ev.time}</span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {statusBadge}
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isColeta
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                        >
                          {isColeta ? 'Coleta Transportadora' : 'Instalação na Loja'}
                        </span>
                        {getRelativeDayBadge(ev.date)}
                        <span className="text-[11px] text-slate-400 font-medium capitalize hidden sm:inline">
                          {weekdayFull}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">{ev.clientName}</span>
                        {ev.orderCode && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {ev.orderCode}
                          </span>
                        )}
                        {ev.clientPhone && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{ev.clientPhone}</span>
                          </span>
                        )}
                        {renderOriginIcon(ev.origin)}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                          {renderVehicleIcon(iconType)}
                          <span>{ev.vehicleModel}</span>
                        </span>
                        {ev.itemsSummary && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 truncate max-w-md">{ev.itemsSummary}</span>
                          </>
                        )}
                        {ev.totalWeightKg && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                              <Weight className="w-3 h-3 text-slate-400" />
                              {ev.totalWeightKg} kg
                            </span>
                          </>
                        )}
                        {isColeta && ev.shippingCarrierName && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 text-[11px] text-sky-700 font-medium">
                              <Truck className="w-3 h-3" />
                              {ev.shippingCarrierName}
                            </span>
                          </>
                        )}
                        {isColeta && ev.shippingAddress?.city && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {ev.shippingAddress.city} - {ev.shippingAddress.state}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Chamar no WhatsApp"
                        className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                      >
                        <FaWhatsapp className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectEvent(ev)
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#EA580C] text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Detalhes</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* STRICTLY READ-ONLY MODAL (FICHA OPERACIONAL DA OFICINA)    */}
      {/* Zero Financial Data • Completely Locked for Editing        */}
      {/* ========================================================== */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  selectedEventModal.type === 'coleta' ? 'bg-sky-50 text-sky-700' : 'bg-purple-50 text-purple-700'
                }`}>
                  {selectedEventModal.type === 'coleta' ? <Truck className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Ficha Operacional</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedEventModal.type === 'coleta'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedEventModal.type === 'coleta' ? 'Coleta' : 'Instalação'}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    {selectedEventModal.orderCode || formatOrderCode(selectedEventModal.orderNumber)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedEventModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-Only Notice Banner */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-bold">Modo Somente Leitura (Oficina & Expedição):</strong> As informações abaixo são bloqueadas para edição nesta tela. Para atualizar dados cadastrais ou comerciais, utilize o Pipeline ou Funil de Pedidos.
              </div>
            </div>

            {/* Data Cards (Strictly No Prices!) */}
            <div className="space-y-3.5 text-xs">
              {/* Programação: Data e Hora */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Horário Agendado
                </div>
                <div className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#EA580C]" />
                  <span>{selectedEventModal.date.split('-').reverse().join('/')} às {selectedEventModal.time}</span>
                </div>
              </div>

              {/* Cliente */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Contato do Cliente
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {selectedEventModal.clientName}
                </div>
                {selectedEventModal.clientPhone && (
                  <div className="flex items-center justify-between text-xs text-slate-600 font-mono pt-1 border-t border-slate-200/60">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedEventModal.clientPhone}</span>
                    </span>
                    <a
                      href={`https://wa.me/${selectedEventModal.clientPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#25D366] hover:underline font-bold flex items-center gap-1 text-[11px]"
                    >
                      <FaWhatsapp className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}
                {selectedEventModal.clientEmail && (
                  <div className="text-xs text-slate-500 pt-0.5">
                    <span className="truncate">E-mail: {selectedEventModal.clientEmail}</span>
                  </div>
                )}
              </div>

              {/* Veículo & Carga */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Veículo & Carga
                </div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-[#EA580C]">
                    {renderVehicleIcon(cleanVehicleName(selectedEventModal.vehicleModel).iconType)}
                  </span>
                  <span>{selectedEventModal.vehicleModel}</span>
                </div>
                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed space-y-1">
                  <strong className="text-slate-900 font-semibold block">Peças / Bagageiros:</strong>
                  <div>{selectedEventModal.itemsSummary}</div>
                </div>
                {selectedEventModal.totalWeightKg && (
                  <div className="text-xs font-mono font-bold text-slate-700 pt-1 flex items-center gap-1.5">
                    <Weight className="w-3.5 h-3.5 text-slate-400" />
                    <span>Peso Total da Carga: {selectedEventModal.totalWeightKg} kg</span>
                  </div>
                )}
              </div>

              {/* Logística de Envio ou Instalação */}
              {selectedEventModal.type === 'coleta' ? (
                <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-sky-700 tracking-wider flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-sky-600" />
                    <span>Dados para Expedição / Transportadora</span>
                  </div>

                  <div className="text-xs text-sky-950 font-semibold">
                    <span>Transportadora: {selectedEventModal.shippingCarrierName || 'Aguardando definição'}</span>
                  </div>

                  {selectedEventModal.shippingTrackingCode && (
                    <div className="text-xs font-mono bg-white/80 p-2 rounded-xl border border-sky-200 text-sky-900">
                      <span>Rastreio: <strong>{selectedEventModal.shippingTrackingCode}</strong></span>
                    </div>
                  )}

                  {selectedEventModal.shippingAddress?.street && (
                    <div className="bg-white/80 p-2.5 rounded-xl border border-sky-200 text-xs text-sky-900 space-y-1">
                      <div className="font-bold text-sky-950">
                        <span>Endereço de Entrega:</span>
                      </div>
                      <div className="leading-snug">
                        {selectedEventModal.shippingAddress.street}, {selectedEventModal.shippingAddress.number}
                        {selectedEventModal.shippingAddress.neighborhood && ` - ${selectedEventModal.shippingAddress.neighborhood}`}
                        {selectedEventModal.shippingAddress.city && ` - ${selectedEventModal.shippingAddress.city}/${selectedEventModal.shippingAddress.state}`}
                      </div>
                      {selectedEventModal.shippingAddress.cep && (
                        <div className="pt-1 border-t border-sky-100 font-mono text-[11px]">
                          <span>CEP: {selectedEventModal.shippingAddress.cep}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-purple-700 tracking-wider flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-purple-600" />
                    <span>Oficina & Montagem na Loja</span>
                  </div>
                  <div className="text-xs text-purple-950 font-medium">
                    Local: Oficina Matriz Robusty
                  </div>
                  <div className="text-[11px] text-purple-800">
                    A equipe deve separar com antecedência o bagageiro, as garras de fixação e a guia de rolete correspondente ao veículo.
                  </div>
                </div>
              )}

              {selectedEventModal.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <strong className="text-slate-800">Observações: </strong>
                  {selectedEventModal.notes}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
