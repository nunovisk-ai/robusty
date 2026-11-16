import React from 'react'
import { 
  Kanban, 
  Calculator, 
  Package, 
  Truck, 
  Calendar, 
  Database,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Menu,
  X
} from 'lucide-react'

export type ActiveTab = 'kanban' | 'budget' | 'catalog' | 'orders' | 'calendar' | 'setup'

interface SidebarProps {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  onOpenSqlModal: () => void
  leadCount: number
  orderCount: number
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenSqlModal,
  leadCount,
  orderCount,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const navSections = [
    {
      title: 'COMERCIAL',
      items: [
        {
          id: 'kanban' as ActiveTab,
          label: 'Funil de Vendas',
          description: 'Kanban do Norlando',
          icon: <Kanban className="w-4 h-4" />,
          badge: leadCount > 0 ? `${leadCount} leads` : undefined,
          badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
        },
        {
          id: 'budget' as ActiveTab,
          label: 'Novo Orçamento',
          description: 'Proposta & Cálculo CEP',
          icon: <Calculator className="w-4 h-4" />,
        },
        {
          id: 'catalog' as ActiveTab,
          label: 'Catálogo de Produtos',
          description: 'Tabela Oficial Fev/2026',
          icon: <Package className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'OPERAÇÃO & LOGÍSTICA',
      items: [
        {
          id: 'orders' as ActiveTab,
          label: 'Pedidos & Expedição',
          description: 'Igor & Loja Física',
          icon: <Truck className="w-4 h-4" />,
          badge: orderCount > 0 ? `${orderCount}` : undefined,
          badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
        },
        {
          id: 'calendar' as ActiveTab,
          label: 'Agenda de Instalações',
          description: '1 Baia Exclusiva',
          icon: <Calendar className="w-4 h-4" />,
          badge: '1 Vaga',
          badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        {
          id: 'setup' as ActiveTab,
          label: 'Supabase & VPS',
          description: 'Banco & Conexões',
          icon: <Database className="w-4 h-4" />,
        },
      ],
    },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      {/* Brand Header with Real Rhino Logo */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/robusty-logo.png"
            alt="Robusty Logo"
            className="h-9 w-auto object-contain"
          />
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Operator Profile Card (Kommo Style) */}
      <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
          N
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 truncate">Norlando Vendas</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Atendimento Comercial</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setIsMobileOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`${isActive ? 'text-orange-600' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs tracking-tight truncate leading-tight">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer Info: Supabase Status */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-700">Supabase Cloud</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Postgres 16</span>
        </div>

        <button
          onClick={onOpenSqlModal}
          className="w-full py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <Database className="w-3 h-3 text-emerald-600" />
          <span>Script SQL de Migração</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
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
