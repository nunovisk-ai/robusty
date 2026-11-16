import React, { useState, useEffect } from 'react'
import { Vehicle, Product } from '../types'
import { fetchVehicles, fetchProducts } from '../services/catalogService'
import { 
  Search, 
  Tag, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Ruler, 
  Layers,
  ArrowRight
} from 'lucide-react'

interface CatalogViewProps {
  onSelectForBudget?: (product: Product, vehicle?: Vehicle) => void
  onNavigateToBudget?: () => void
}

export const CatalogView: React.FC<CatalogViewProps> = ({ 
  onSelectForBudget,
  onNavigateToBudget 
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [vList, pList] = await Promise.all([fetchVehicles(), fetchProducts()])
      setVehicles(vList)
      setProducts(pList)
      setLoading(false)
    }
    loadData()
  }, [])

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)

  const filteredProducts = products.filter((p) => {
    // Filter by vehicle
    if (selectedVehicleId !== 'all') {
      const matchVehicle = p.compatible_vehicle_id === selectedVehicleId || !p.compatible_vehicle_id
      if (!matchVehicle) return false
    }

    // Filter by category
    if (selectedCategory !== 'all' && p.category !== selectedCategory) {
      return false
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = p.name.toLowerCase().includes(q)
      const matchSku = p.sku?.toLowerCase().includes(q)
      const matchDesc = p.description?.toLowerCase().includes(q)
      if (!matchName && !matchSku && !matchDesc) return false
    }

    return true
  })

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'bagageiro': return 'Bagageiro'
      case 'escada': return 'Escada'
      case 'deck': return 'Deck de Madeira'
      case 'suporte': return 'Suporte Especial'
      case 'acessorio_fixacao': return 'Fixação / Acessório'
      case 'servico_instalacao': return 'Serviço de Instalação'
      case 'servico_especial': return 'Serviço Especial'
      default: return cat
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Catálogo Oficial de Produtos Robusty
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
              Tabela Fev/2026
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Preços oficiais com 3 opções de pagamento (10x sem juros, 5% à vista no boleto e 10% no PIX).
          </p>
        </div>

        {onNavigateToBudget && (
          <button
            onClick={onNavigateToBudget}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 self-start md:self-auto"
          >
            <span>Ir para Construtor de Orçamento</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Vehicle Filter Pills */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
          Filtrar por Veículo Utilitário:
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedVehicleId('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              selectedVehicleId === 'all'
                ? 'bg-orange-500 text-slate-950 border-orange-400 font-semibold shadow-md shadow-orange-500/10'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
            }`}
          >
            Todos os Veículos
          </button>
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVehicleId(v.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedVehicleId === v.id
                  ? 'bg-orange-500 text-slate-950 border-orange-400 font-semibold shadow-md shadow-orange-500/10'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{v.model}</span>
              {v.standard_installation_cost > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedVehicleId === v.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  +R$ {v.standard_installation_cost} inst.
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Technical Warning Banner for Specific Vehicles (e.g. Nova Kangoo) */}
      {selectedVehicle?.notes && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <span className="font-semibold block text-amber-300 mb-0.5">Nota Técnica para {selectedVehicle.model}:</span>
            {selectedVehicle.notes}
          </div>
        </div>
      )}

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, SKU ou característica..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
        >
          <option value="all">Todas as Categorias</option>
          <option value="bagageiro">Bagageiros</option>
          <option value="escada">Escadas</option>
          <option value="deck">Decks</option>
          <option value="suporte">Suportes</option>
          <option value="acessorio_fixacao">Fixação & Acessórios</option>
          <option value="servico_instalacao">Serviços de Instalação</option>
          <option value="servico_especial">Serviços Especiais</option>
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">Carregando catálogo oficial...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/30 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">Nenhum produto encontrado com os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const vehicle = vehicles.find((v) => v.id === p.compatible_vehicle_id)
            return (
              <div
                key={p.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm hover:shadow-lg"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                      {p.sku || 'ROBUSTY'}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      {getCategoryLabel(p.category)}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3 className="font-semibold text-white text-sm tracking-tight mb-1 group-hover:text-orange-400 transition-colors">
                    {p.name}
                  </h3>

                  {/* Vehicle Compatibility Tag */}
                  {vehicle && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-2.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>Compatível: <strong className="text-slate-300">{vehicle.model}</strong></span>
                    </div>
                  )}

                  {/* Dimensions if applicable */}
                  {p.dimensions && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-3 bg-slate-950/40 px-2 py-1 rounded-md border border-slate-800/80">
                      <Ruler className="w-3.5 h-3.5 text-slate-500" />
                      <span>Medidas: {p.dimensions}</span>
                    </div>
                  )}

                  {p.description && (
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Price Breakdown Matrix */}
                <div className="pt-4 border-t border-slate-800/80 mt-2">
                  <div className="space-y-1.5 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/50">
                    {/* 10x Card Price */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">10x sem juros:</span>
                      <span className="font-semibold text-white font-mono">{formatCurrency(p.base_price_10x)}</span>
                    </div>

                    {/* 5% Boleto Price */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">À vista (5% boleto):</span>
                      <span className="text-emerald-400 font-mono font-medium">{formatCurrency(p.cash_price_5pct)}</span>
                    </div>

                    {/* 10% PIX MAX Price */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                      <span className="text-orange-400 font-medium">PIX (10% MAX):</span>
                      <span className="text-orange-400 font-mono font-bold">{formatCurrency(p.max_discount_price_10pct)}</span>
                    </div>

                    {p.installation_cost > 0 && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Custo Instalação:</span>
                        <span className="font-mono text-slate-300">+{formatCurrency(p.installation_cost)}</span>
                      </div>
                    )}
                  </div>

                  {onSelectForBudget && (
                    <button
                      onClick={() => onSelectForBudget(p, vehicle)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-orange-500 text-slate-200 hover:text-slate-950 font-medium text-xs transition-all border border-slate-700 hover:border-orange-400"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar ao Orçamento</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
