import React, { useState } from 'react'
import type { Appointment } from '../types'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Wrench, 
  User, 
  Plus, 
  AlertTriangle,
  X,
  CheckCircle2
} from 'lucide-react'

interface CalendarViewProps {
  appointments: Appointment[]
  onAddAppointment: (apt: Omit<Appointment, 'id'>) => boolean | Promise<boolean>
}

const TIME_SLOTS = [
  '08:00',
  '09:30',
  '11:00',
  '14:00',
  '15:30',
  '17:00'
]

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  appointments,
  onAddAppointment 
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [vehicleDesc, setVehicleDesc] = useState('')
  const [slotTime, setSlotTime] = useState('09:30')
  const [conflictError, setConflictError] = useState('')

  const appointmentsForDate = appointments.filter((a) => {
    return a.scheduled_start.startsWith(selectedDate)
  })

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    setConflictError('')

    const scheduledStart = `${selectedDate}T${slotTime}:00`
    const isConflict = appointments.some((a) => a.scheduled_start === scheduledStart && a.status !== 'cancelado')

    if (isConflict) {
      setConflictError(`CONFLITO DE HORÁRIO: Já existe uma instalação agendada para ${selectedDate} às ${slotTime}. A loja opera com 1 baia exclusiva por vez.`)
      return
    }

    const success = onAddAppointment({
      contact_id: 'manual-contact',
      contact: {
        id: 'manual-contact',
        full_name: clientName,
        phone_e164: clientPhone,
        origin: 'whatsapp_inbound',
        created_at: new Date().toISOString()
      },
      vehicle_description: vehicleDesc,
      products_summary: 'Bagageiro Robusty com instalação',
      scheduled_start: scheduledStart,
      scheduled_end: `${selectedDate}T${slotTime}:00`,
      status: 'agendado'
    })

    if (success) {
      setShowAddModal(false)
      setClientName('')
      setClientPhone('')
      setVehicleDesc('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-[#121212] tracking-tight">
              Agenda de Instalações na Oficina
            </h2>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              1 Baia Dedicada
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Controle de capacidade de montagens no galpão. Bloqueio automático de agendamentos conflitantes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-full text-xs transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 self-start md:self-auto cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Date Selector Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-nexo">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Data de Trabalho:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-slate-50 border border-slate-200/80 rounded-full px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono font-bold"
        />
        <span className="text-xs text-slate-500 font-medium">
          ({appointmentsForDate.length} {appointmentsForDate.length === 1 ? 'instalação agendada' : 'instalações agendadas'} para este dia)
        </span>
      </div>

      {/* Time Slots Daily Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TIME_SLOTS.map((slot) => {
          const booked = appointmentsForDate.find((a) => a.scheduled_start.includes(slot) && a.status !== 'cancelado')

          return (
            <div
              key={slot}
              className={`p-6 rounded-2xl border transition-all ${
                booked
                  ? 'bg-[#FFF8F3] border-[#FED7AA] shadow-xs'
                  : 'bg-white border-slate-100 hover:border-slate-200 shadow-nexo'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm font-bold text-[#121212] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#EA580C]" />
                  <span>{slot}</span>
                </span>
                {booked ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF3EA] text-[#EA580C] border border-[#FED7AA]">
                    Ocupado (1/1 Baia)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Disponível
                  </span>
                )}
              </div>

              {booked ? (
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-[#121212] truncate flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{booked.contact?.full_name}</span>
                  </div>
                  <div className="text-slate-600 flex items-center gap-1.5 text-[11px] font-medium">
                    <Wrench className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>{booked.vehicle_description}</span>
                  </div>
                  {booked.contact?.phone_e164 && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      Tel: {booked.contact.phone_e164}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <button
                    onClick={() => {
                      setSlotTime(slot)
                      setShowAddModal(true)
                    }}
                    className="text-xs text-slate-500 hover:text-[#EA580C] font-bold transition-colors cursor-pointer"
                  >
                    + Encaixar Instalação
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#121212] flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#EA580C]" />
                <span>Agendar Instalação na Loja</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {conflictError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Cliente:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Mecânica"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp / Telefone:</label>
                <input
                  type="text"
                  required
                  placeholder="(11) 99999-9999"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Veículo & Produto:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fiat Fiorino — Bagageiro FX 100"
                  value={vehicleDesc}
                  onChange={(e) => setVehicleDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Data:</label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-full px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Horário (Baia):</label>
                  <select
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-full px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono font-bold"
                  >
                    {TIME_SLOTS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
