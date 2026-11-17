import React from 'react'
import { Menu, Plus } from 'lucide-react'
import type { ActiveTab } from './Sidebar'
import type { CurrentUser } from './LoginView'

interface TopBarProps {
  activeTab: ActiveTab
  onToggleMobile: () => void
  onNewLeadClick: () => void
  currentUser?: CurrentUser | null
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
      case 'kanban': return 'Pipeline / Funil de Leads'
      case 'budget': return 'Montador de Orçamento'
      case 'catalog': return 'Catálogo Oficial Fev/2026'
      case 'orders': return 'Funil Operacional de Pedidos'
      case 'calendar': return 'Agenda de Instalações (Baia Única)'
      case 'settings': return 'Configurações & Parâmetros'
    }
  }

  const title = getTabTitle(activeTab)

  return (
    <header className="sticky top-0 z-20 h-20 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobile}
          className="md:hidden p-2.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#121212] tracking-tight leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Primary Action Button */}
        <button
          onClick={onNewLeadClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-full text-xs font-semibold transition-all shadow-md shadow-orange-500/25 hover:shadow-orange-500/35 active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Lead</span>
        </button>
      </div>
    </header>
  )
}
