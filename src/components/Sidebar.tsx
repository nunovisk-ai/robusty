import React from 'react'
import { 
  LayoutDashboard,
  Calculator, 
  Package, 
  Truck, 
  Calendar, 
  Settings,
  X,
  SlidersHorizontal,
  Bot,
  LogOut
} from 'lucide-react'
import type { CurrentUser } from './LoginView'

export type ActiveTab = 'kanban' | 'budget' | 'catalog' | 'orders' | 'calendar' | 'settings'

interface SidebarProps {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  leadCount: number
  orderCount: number
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  currentUser?: CurrentUser
  onLogout?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  leadCount,
  orderCount,
  isMobileOpen,
  setIsMobileOpen,
  currentUser,
  onLogout
}) => {
  const navItems = [
    {
      id: 'kanban' as ActiveTab,
      label: 'Pipeline / Funil',
      icon: <SlidersHorizontal className="w-5 h-5" />,
      badge: leadCount > 0 ? `${leadCount}` : undefined,
    },
    {
      id: 'budget' as ActiveTab,
      label: 'Novo Orçamento',
      icon: <Calculator className="w-5 h-5" />,
    },
    {
      id: 'catalog' as ActiveTab,
      label: 'Catálogo de Produtos',
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'orders' as ActiveTab,
      label: 'Pedidos & Coleta',
      icon: <Truck className="w-5 h-5" />,
      badge: orderCount > 0 ? `${orderCount}` : undefined,
    },
    {
      id: 'calendar' as ActiveTab,
      label: 'Agenda de Instalação',
      icon: <Calendar className="w-5 h-5" />,
      badge: '1 Baia',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Configurações',
      icon: <Settings className="w-5 h-5" />,
    },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-100/90 w-64 select-none">
      {/* Brand Header with Real Rhino Logo */}
      <div className="p-6 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}robusty-logo.png`}
            alt="Robusty"
            className="h-10 w-auto object-contain"
          />
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Inbound AI Status Card (Nexo style) */}
      <div className="mx-4 mb-4 p-3 rounded-2xl bg-[#FFF8F3] border border-[#FFE6D5] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">
              Meta Coexistence
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              WhatsApp & IG Ativos
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Items (Exact Nexo Style) */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
        <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Módulos
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                setIsMobileOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-left transition-all cursor-pointer font-medium ${
                isActive
                  ? 'bg-[#EA580C] text-white shadow-sm font-bold shadow-orange-500/20'
                  : 'text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF3EA]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="text-xs tracking-tight truncate">
                  {item.label}
                </span>
              </div>

              {item.badge && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-orange-50 text-[#EA580C] border border-orange-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Operator Profile Card (Nexo Footer Style) */}
      <div className="p-4 border-t border-slate-100">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {currentUser?.avatarLetter || 'N'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">
                {currentUser?.name || 'Norlando Vendas'}
              </div>
              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{currentUser?.roleLabel || 'Comercial Ativo'}</span>
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Trocar usuário / Sair"
              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 z-30 shadow-nexo">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-10 w-64 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
