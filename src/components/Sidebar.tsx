import React from 'react'
import { 
  Kanban, 
  Calculator, 
  Package, 
  Truck, 
  Calendar, 
  Settings,
  X,
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
  const navSections = [
    {
      title: 'COMERCIAL',
      items: [
        {
          id: 'kanban' as ActiveTab,
          label: 'Funil de Vendas',
          description: 'Gestão de Leads Inbound',
          icon: <Kanban className="w-4 h-4" />,
          badge: leadCount > 0 ? `${leadCount}` : undefined,
          badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
        },
        {
          id: 'budget' as ActiveTab,
          label: 'Novo Orçamento',
          description: 'Proposta Comercial',
          icon: <Calculator className="w-4 h-4" />,
        },
        {
          id: 'catalog' as ActiveTab,
          label: 'Catálogo de Produtos',
          description: 'Bagageiros & Acessórios',
          icon: <Package className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'OPERAÇÃO',
      items: [
        {
          id: 'orders' as ActiveTab,
          label: 'Pedidos & Expedição',
          description: 'Logística & Loja Física',
          icon: <Truck className="w-4 h-4" />,
          badge: orderCount > 0 ? `${orderCount}` : undefined,
          badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
        },
        {
          id: 'calendar' as ActiveTab,
          label: 'Agenda de Instalações',
          description: 'Montagens na Oficina',
          icon: <Calendar className="w-4 h-4" />,
          badge: '1 Baia',
          badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        {
          id: 'settings' as ActiveTab,
          label: 'Configurações',
          description: 'Empresa & Regras',
          icon: <Settings className="w-4 h-4" />,
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
            alt="Robusty"
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

      {/* Operator Profile Card */}
      <div className="mx-4 mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {currentUser?.avatarLetter || 'R'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 truncate">
                {currentUser?.name || 'Colaborador'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              {currentUser?.roleLabel || 'Robusty CRM'}
            </span>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            title="Sair do sistema (Trocar usuário)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-bold shadow-xs'
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
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Clean Footer Status */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium text-slate-600">Sistema Conectado</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 font-semibold">v1.0</span>
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
