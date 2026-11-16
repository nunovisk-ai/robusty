import React, { useState, useEffect } from 'react'
import type { Vehicle, Product } from '../types'
import { fetchVehicles, fetchProducts } from '../services/catalogService'
import { 
  Search, 
  AlertTriangle, 
  Plus, 
  Ruler, 
  Layers,
  ArrowRight,
  Filter,
  PackageCheck
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
    if (selectedVehicleId !== 'all') {
      const matchVehicle = p.compatible_vehicle_id === selectedVehicleId || !p.compatible_vehicle_id
      if (!matchVehicle) return false
    }

    if (selectedCategory !== 'all' && p.category !== selectedCategory) {
      return false
    }

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
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Tabela de Produtos & Condições Comerciais
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              Oficial Fev/2026
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Valores oficiais de tabela com regras de parcelamento em 10x sem juros, 5% no boleto e 10% no PIX.
          </p>
        </div>

        {onNavigateToBudget && (
          <button
            onClick={onNavigateToBudget}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm shadow-orange-600/20 self-start sm:self-auto cursor-pointer"
          >
            <span>Montar Novo Orçamento</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Vehicle Filter Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-orange-600" />
            <span>Filtrar por Veículo Compatível:</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {filteredProducts.length} itens encontrados
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedVehicleId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
              selectedVehicleId === 'all'
                ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos os Veículos
          </button>
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVehicleId(v.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                selectedVehicleId === v.id
                  ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{v.model}</span>
              {v.standard_installation_cost > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedVehicleId === v.id ? 'bg-orange-700 text-orange-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  +R$ {v.standard_installation_cost}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Technical Warning Banner */}
      {selectedVehicle?.notes && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <span className="font-bold text-amber-950 block mb-0.5">Nota Técnica para {selectedVehicle.model}:</span>
            {selectedVehicle.notes}
          </div>
        </div>
      )}

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, SKU ou característica..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-xs transition-all"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-orange-500 shadow-xs cursor-pointer font-medium"
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
        <div className="py-20 text-center text-slate-400 text-sm">Carregando catálogo oficial...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-sm font-medium">Nenhum produto encontrado para estes filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const vehicle = vehicles.find((v) => v.id === p.compatible_vehicle_id)
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {p.sku || 'ROBUSTY'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                      {getCategoryLabel(p.category)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-1 group-hover:text-orange-600 transition-colors">
                    {p.name}
                  </h3>

                  {/* Vehicle Tag */}
                  {vehicle && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-2">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Veículo: <strong className="text-slate-700 font-semibold">{vehicle.model}</strong></span>
                    </div>
                  )}

                  {/* Dimensions chip */}
                  {p.dimensions && (
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mb-3 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-mono">
                      <Ruler className="w-3.5 h-3.5 text-slate-400" />
                      <span>Medidas: {p.dimensions}</span>
                    </div>
                  )}

                  {p.description && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* 3-Tier Pricing Card */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-1.5 mb-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">10x sem juros:</span>
                      <span className="font-bold text-slate-900 font-mono">{formatCurrency(p.base_price_10x)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">À vista (5% boleto):</span>
                      <span className="font-semibold text-emerald-700 font-mono">{formatCurrency(p.cash_price_5pct)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-orange-700 font-semibold">PIX (10% MAX):</span>
                      <span className="font-bold text-orange-700 font-mono text-sm">{formatCurrency(p.max_discount_price_10pct)}</span>
                    </div>

                    {p.installation_cost > 0 && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>Instalação:</span>
                        <span className="font-mono text-slate-700">+{formatCurrency(p.installation_cost)}</span>
                      </div>
                    )}
                  </div>

                  {onSelectForBudget && (
                    <button
                      onClick={() => onSelectForBudget(p, vehicle)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-orange-600 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
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
