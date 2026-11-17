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
      case 'kanban': return 'Pipeline'
      case 'budget': return 'Gerador de Orçamento'
      case 'catalog': return 'Catálogo Oficial Fev/2026'
      case 'orders': return 'Funil Operacional de Pedidos'
      case 'calendar': return 'Agenda'
      case 'settings': return 'Configurações & Parâmetros'
    }
  }

  const title = getTabTitle(activeTab)

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
    </header>
  )
}
