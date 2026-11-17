import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Menu, Plus, Bell, Check, Clock, Calendar, AlertTriangle, ExternalLink, X } from 'lucide-react'
import { FaStore, FaUser } from 'react-icons/fa6'
import type { ActiveTab } from './Sidebar'
import type { CurrentUser } from './LoginView'
import type { Opportunity, OpportunityTask } from '../types'

interface TopBarProps {
  activeTab: ActiveTab
  onToggleMobile: () => void
  onNewLeadClick: () => void
  currentUser?: CurrentUser | null
  onLogout?: () => void
  opportunities?: Opportunity[]
  onSelectOpportunity?: (opp: Opportunity) => void
  onToggleTask?: (oppId: string, taskId: string) => void
}

export const TopBar: React.FC<TopBarProps> = ({ 
  activeTab, 
  onToggleMobile, 
  onNewLeadClick,
  currentUser,
  onLogout,
  opportunities = [],
  onSelectOpportunity,
  onToggleTask
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'kanban': return 'Pipeline'
      case 'budget': return 'Gerador de Orçamento'
      case 'catalog': return 'Catálogo Oficial Fev/2026'
      case 'orders': return 'Funil Operacional de Pedidos'
      case 'calendar': return 'Agenda'
      case 'settings': return 'Configurações & Parâmetros'
    }
  }

  const title = getTabTitle(activeTab)

  // Extrair todas as tarefas pendentes de todas as oportunidades
  const allPendingTasks = useMemo(() => {
    const list: Array<{ task: OpportunityTask; opportunity: Opportunity }> = []
    const today = new Date().toISOString().split('T')[0]

    opportunities.forEach((opp) => {
      if (opp.tasks && opp.tasks.length > 0) {
        opp.tasks.forEach((t) => {
          if (!t.completed) {
            list.push({ task: t, opportunity: opp })
          }
        })
      }
    })

    // Ordenar: primeiro tarefas atrasadas, depois hoje, depois futuras
    return list.sort((a, b) => {
      const dateA = a.task.due_date + 'T' + (a.task.due_time || '00:00')
      const dateB = b.task.due_date + 'T' + (b.task.due_time || '00:00')
      return dateA.localeCompare(dateB)
    })
  }, [opportunities])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Tarefas urgentes (atrasadas ou hoje)
  const urgentCount = useMemo(() => {
    return allPendingTasks.filter((item) => item.task.due_date <= todayStr).length
  }, [allPendingTasks, todayStr])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNotificationsOpen])

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobile}
          className="md:hidden p-2.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer outline-none focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#121212] tracking-tight leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Notification Bell & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Central de Lembretes / Notificações */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            title="Lembretes & Tarefas do CRM"
            className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isNotificationsOpen
                ? 'bg-orange-50 border-[#EA580C] text-[#EA580C]'
                : urgentCount > 0
                ? 'bg-white border-amber-300 text-amber-600 hover:bg-amber-50/50'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] bg-[#EA580C] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {urgentCount}
              </span>
            )}
          </button>

          {/* Dropdown Modal de Notificações */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#EA580C]" />
                  <span className="text-xs font-bold text-slate-800">Lembretes & Tarefas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#EA580C]">
                    {allPendingTasks.length} pendente(s)
                  </span>
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {allPendingTasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-600">Nenhum lembrete pendente!</p>
                    <p className="text-[11px]">Você está em dia com todas as tarefas e retornos.</p>
                  </div>
                ) : (
                  allPendingTasks.map(({ task, opportunity }) => {
                    const isOverdue = task.due_date < todayStr
                    const isToday = task.due_date === todayStr

                    return (
                      <div
                        key={task.id}
                        className={`p-3 transition-colors hover:bg-slate-50 flex items-start gap-2.5 ${
                          isOverdue ? 'bg-rose-50/20' : isToday ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* 1-Click Complete Checkbox */}
                        <button
                          type="button"
                          onClick={() => onToggleTask?.(opportunity.id, task.id)}
                          title="Marcar como concluída"
                          className="mt-0.5 w-4 h-4 rounded border border-slate-300 hover:border-[#EA580C] bg-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                        >
                          {task.completed && <Check className="w-3 h-3 text-emerald-600" />}
                        </button>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {task.title}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                                isOverdue
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : isToday
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isOverdue ? '⚠️ Atrasada' : isToday ? '⏰ Hoje' : `📅 ${task.due_date}`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500">
                            <span className="truncate">
                              {opportunity.contact?.full_name || 'Cliente'} •{' '}
                              <strong className="text-slate-700">#ROB-{opportunity.order_number || task.order_number}</strong>
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {task.due_time}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              {task.assigned_to === 'Loja' ? (
                                <FaStore className="w-2.5 h-2.5 text-amber-600" />
                              ) : (
                                <FaUser className="w-2.5 h-2.5 text-slate-400" />
                              )}
                              <span>{task.assigned_to}</span>
                            </span>

                            {onSelectOpportunity && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsNotificationsOpen(false)
                                  onSelectOpportunity(opportunity)
                                }}
                                className="text-[10px] font-bold text-[#EA580C] hover:text-[#c2410c] flex items-center gap-1 cursor-pointer"
                              >
                                <span>Ver Orçamento</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botão Novo Lead / Orçamento */}
        <button
          onClick={onNewLeadClick}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Lead</span>
        </button>
      </div>
    </header>
  )
}
