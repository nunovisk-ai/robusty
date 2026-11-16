import React from 'react'
import { 
  Package, 
  Calculator, 
  Kanban, 
  Truck, 
  Calendar, 
  Database,
  ExternalLink,
  ShieldCheck
} from 'lucide-react'

export type ActiveTab = 'catalog' | 'budget' | 'kanban' | 'orders' | 'calendar' | 'setup'

interface NavbarProps {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  onOpenSqlModal: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenSqlModal }) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'catalog', label: 'Catálogo de Produtos', icon: <Package className="w-4 h-4" /> },
    { id: 'budget', label: 'Construtor de Orçamento', icon: <Calculator className="w-4 h-4" /> },
    { id: 'kanban', label: 'Funil de Vendas (CRM)', icon: <Kanban className="w-4 h-4" />, badge: 'Norlando' },
    { id: 'orders', label: 'Pedidos & Operação', icon: <Truck className="w-4 h-4" />, badge: 'Igor & Loja' },
    { id: 'calendar', label: 'Agenda de Instalações', icon: <Calendar className="w-4 h-4" />, badge: '1 Baia' },
    { id: 'setup', label: 'Supabase & VPS', icon: <Database className="w-4 h-4" /> },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 font-black text-slate-950 tracking-tighter text-lg">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">ROBUSTY</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  CRM v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">Bagageiros & Operação Comercial</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSqlModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Script SQL</span>
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">Supabase Conectado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav scrollbar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 bg-slate-900 border-t border-slate-800 scrollbar-none">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === item.id
                ? 'bg-orange-500 text-slate-950 font-semibold'
                : 'text-slate-300 bg-slate-800/60'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </header>
  )
}
