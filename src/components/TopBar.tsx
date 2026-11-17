import React from 'react'
import { Menu, Plus, Search, Smartphone } from 'lucide-react'
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
      case 'kanban': return { title: 'Pipeline / Funil de Leads', category: 'Comercial' }
      case 'budget': return { title: 'Montador de Orçamento', category: 'Comercial' }
      case 'catalog': return { title: 'Catálogo Oficial Fev/2026', category: 'Produtos' }
      case 'orders': return { title: 'Funil Operacional de Pedidos', category: 'Operação' }
      case 'calendar': return { title: 'Agenda de Instalações (Baia Única)', category: 'Oficina' }
      case 'settings': return { title: 'Configurações & Parâmetros', category: 'Sistema' }
    }
  }

  const { title, category } = getTabTitle(activeTab)

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
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Robusty CRM</span>
            <span>•</span>
            <span>{category}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#121212] tracking-tight leading-tight mt-0.5">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Search, Channel Status & Action */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* WhatsApp Channel Badge (Nexo Pill Style) */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-xs">
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>WhatsApp & IG Conectados</span>
        </div>

        {/* Primary Action Button (Nexo Pill Button) */}
        <button
          onClick={onNewLeadClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-full text-xs font-bold transition-all shadow-md shadow-orange-500/25 hover:shadow-orange-500/35 active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Lead / Orçamento</span>
        </button>
      </div>
    </header>
  )
}
