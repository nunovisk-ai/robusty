import React from 'react'
import { Menu, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react'
import { ActiveTab } from './Sidebar'

interface TopBarProps {
  activeTab: ActiveTab
  onToggleMobile: () => void
}

export const TopBar: React.FC<TopBarProps> = ({ activeTab, onToggleMobile }) => {
  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'kanban': return { title: 'Funil Comercial de Vendas', breadcrumb: 'Comercial' }
      case 'budget': return { title: 'Construtor de Orçamento', breadcrumb: 'Comercial' }
      case 'catalog': return { title: 'Catálogo Oficial de Produtos', breadcrumb: 'Produtos & Preços' }
      case 'orders': return { title: 'Pedidos & Expedição Operacional', breadcrumb: 'Operação' }
      case 'calendar': return { title: 'Agenda de Instalações na Loja', breadcrumb: 'Loja Física' }
      case 'setup': return { title: 'Configurações de Banco & Infra', breadcrumb: 'Sistema' }
    }
  }

  const { title, breadcrumb } = getTabTitle(activeTab)

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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

      <div className="flex items-center gap-3">
        {/* WhatsApp Coexistence Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          <span>WhatsApp Coexistence Ativo</span>
        </div>

        {/* Live Demo Pill */}
        <a
          href="https://nunovisk-ai.github.io/robusty/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors border border-slate-200"
        >
          <span className="hidden sm:inline">GitHub Pages</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  )
}
