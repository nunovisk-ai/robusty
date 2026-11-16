import React from 'react'
import { Menu, MessageSquare, Search, Plus, LogOut } from 'lucide-react'
import type { ActiveTab } from './Sidebar'
import type { CurrentUser } from './LoginView'

interface TopBarProps {
  activeTab: ActiveTab
  onToggleMobile: () => void
  onNewLeadClick: () => void
  currentUser?: CurrentUser
  onLogout?: () => void
}

export const TopBar: React.FC<TopBarProps> = ({ 
  activeTab, 
  onToggleMobile, 
  onNewLeadClick,
  currentUser,
  onLogout 
}) => {
  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'kanban': return { title: 'Funil Comercial de Vendas', breadcrumb: 'Comercial' }
      case 'budget': return { title: 'Novo Orçamento', breadcrumb: 'Comercial' }
      case 'catalog': return { title: 'Catálogo de Produtos', breadcrumb: 'Produtos' }
      case 'orders': return { title: 'Pedidos & Expedição', breadcrumb: 'Operação' }
      case 'calendar': return { title: 'Agenda de Instalações', breadcrumb: 'Loja Física' }
      case 'settings': return { title: 'Configurações', breadcrumb: 'Sistema' }
    }
  }

  const { title, breadcrumb } = getTabTitle(activeTab)

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span>Robusty</span>
            <span>/</span>
            <span>{breadcrumb}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* WhatsApp Online Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>WhatsApp Ativo</span>
        </div>

        {/* Quick New Lead Button */}
        <button
          onClick={onNewLeadClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-orange-600/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Lead</span>
        </button>

        {/* Mobile/Quick User Info & Logout */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser.avatarLetter}
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sair / Trocar usuário"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
