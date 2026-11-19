import React, { useState, useEffect, useCallback } from 'react'
import type { Vehicle, Product } from '../types'
import {
  fetchVehicles,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  PRODUCT_CATEGORIES,
  getCategoryLabel,
  formatWeightKg,
  type ProductInput,
} from '../services/catalogService'
import { formatCurrency } from '../utils/formatters'
import { ProductFormModal } from './ProductFormModal'
import { ProductDetailModal } from './ProductDetailModal'
import { CustomAlertModal } from './CustomAlertModal'
import {
  Search,
  AlertTriangle,
  Ruler,
  Scale,
  Layers,
  Filter,
  Eye,
  Pencil,
  Trash2,
  PackagePlus,
  CheckCircle2,
  X,
} from 'lucide-react'

export const CatalogView: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // CRUD Modal States
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
  }, [])

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 3500)
    return () => clearTimeout(timer)
  }, [toastMessage])

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
      const vehicleModel = vehicles.find((v) => v.id === p.compatible_vehicle_id)?.model || ''
      const matchName = p.name.toLowerCase().includes(q)
      const matchSku = p.sku?.toLowerCase().includes(q)
      const matchDesc = p.description?.toLowerCase().includes(q)
      const matchDim = p.dimensions?.toLowerCase().includes(q)
      const matchVehicleName = vehicleModel.toLowerCase().includes(q)
      if (!matchName && !matchSku && !matchDesc && !matchDim && !matchVehicleName) return false
    }

    return true
  })

  // CRUD Handlers
  const handleOpenCreate = () => {
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (product: Product) => {
    setViewingProduct(null)
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const handleRequestDelete = (product: Product) => {
    setViewingProduct(null)
    setDeletingProduct(product)
  }

  const handleSaveProduct = async (input: ProductInput, editingId?: string) => {
    if (editingId) {
      const { product: updated } = await updateProduct(editingId, input)
      setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
      showToast(`Produto "${updated.name}" atualizado com sucesso!`)
    } else {
      const { product: created } = await createProduct(input)
      setProducts((prev) => [created, ...prev])
      showToast(`Produto "${created.name}" cadastrado com sucesso!`)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return
    const target = deletingProduct
    setDeletingProduct(null)
    await deleteProduct(target.id)
    setProducts((prev) => prev.filter((p) => p.id !== target.id))
    showToast(`Produto "${target.name}" excluído do catálogo.`)
  }

  const hasActiveFilters =
    selectedVehicleId !== 'all' || selectedCategory !== 'all' || searchQuery.trim() !== ''

  const handleClearFilters = () => {
    setSelectedVehicleId('all')
    setSelectedCategory('all')
    setSearchQuery('')
  }

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/80 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Fechar aviso"
            className="ml-1 p-0.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Tabela de Produtos & Condições Comerciais
          </h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
            Oficial Fev/2026
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold rounded-xl text-xs transition-all shadow-sm shadow-orange-600/20 self-start sm:self-auto cursor-pointer"
        >
          <PackagePlus className="w-4 h-4" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Vehicle Filter Pills */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-nexo space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Filtrar por Veículo Compatível:</span>
          </span>
          <span className="text-xs text-slate-400 font-mono font-medium">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'item encontrado' : 'itens encontrados'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-scroll pb-3 catalog-scroll">
          <button
            type="button"
            onClick={() => setSelectedVehicleId('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedVehicleId === 'all'
                ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-sm shadow-orange-500/20'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos os Veículos
          </button>
          {vehicles.map((v) => (
            <button
              type="button"
              key={v.id}
              onClick={() => setSelectedVehicleId(v.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                selectedVehicleId === v.id
                  ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-sm shadow-orange-500/20'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{v.model}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Technical Warning Banner */}
      {selectedVehicle?.notes && (
        <div className="p-4 rounded-2xl bg-[#FFF8F3] border border-[#FED7AA] flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
          <div className="text-xs text-[#9A3412]">
            <span className="font-bold text-[#7C2D12] block mb-0.5">
              Nota Técnica para {selectedVehicle.model}:
            </span>
            {selectedVehicle.notes}
          </div>
        </div>
      )}

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, SKU, veículo ou característica..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200/80 rounded-full pl-11 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 shadow-nexo transition-all font-medium"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-slate-200/80 rounded-full px-5 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#EA580C] shadow-nexo cursor-pointer font-bold"
        >
          <option value="all">Todas as Categorias</option>
          {PRODUCT_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.pluralLabel}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Carregando catálogo oficial...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <p className="text-slate-500 text-sm font-medium">
            Nenhum produto encontrado para estes filtros.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] transition-colors cursor-pointer"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Cadastrar Novo Produto</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const vehicle = vehicles.find((v) => v.id === p.compatible_vehicle_id)
            const weightFormatted = formatWeightKg(p.weight_kg)

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-[#FED7AA] hover:shadow-nexo-hover transition-all flex flex-col justify-between shadow-nexo group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 truncate max-w-[55%]">
                      {p.sku || 'ROBUSTY'}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF3EA] text-[#EA580C] border border-[#FED7AA]/60 whitespace-nowrap">
                      {getCategoryLabel(p.category)}
                    </span>
                  </div>

                  {/* Title (clickable to view full details) */}
                  <button
                    type="button"
                    onClick={() => setViewingProduct(p)}
                    className="text-left w-full cursor-pointer"
                  >
                    <h3 className="font-bold text-[#121212] text-sm tracking-tight mb-1.5 group-hover:text-[#EA580C] transition-colors leading-snug">
                      {p.name}
                    </h3>
                  </button>

                  {/* Vehicle Tag */}
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-2 font-medium">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Veículo:{' '}
                      <strong className="text-slate-800 font-bold">
                        {vehicle ? vehicle.model : 'Universal / Todos'}
                      </strong>
                    </span>
                  </div>

                  {/* Dimensions & Weight Chips */}
                  {(p.dimensions || weightFormatted) && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {p.dimensions && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5 bg-[#F8F9FA] px-3 py-1 rounded-full border border-slate-100 font-mono">
                          <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Medidas: {p.dimensions}</span>
                        </div>
                      )}
                      {weightFormatted && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5 bg-[#F8F9FA] px-3 py-1 rounded-full border border-slate-100 font-mono">
                          <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Peso: {weightFormatted}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {p.description && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* 3-Tier Pricing Card & Actions */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-slate-100 space-y-1.5 mb-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">10x sem juros:</span>
                      <span className="font-bold text-[#121212] font-mono">
                        {formatCurrency(p.base_price_10x)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">À vista (5% boleto):</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {formatCurrency(p.cash_price_5pct)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[#EA580C] font-semibold">PIX (10% MAX):</span>
                      <span className="font-bold text-[#EA580C] font-mono text-sm">
                        {formatCurrency(p.max_discount_price_10pct)}
                      </span>
                    </div>

                    {p.installation_cost > 0 && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>Instalação:</span>
                        <span className="font-mono text-slate-700 font-semibold">
                          +{formatCurrency(p.installation_cost)}
                        </span>
                      </div>
                    )}

                    {p.payment_conditions_notes && (
                      <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 line-clamp-1">
                        {p.payment_conditions_notes}
                      </p>
                    )}
                  </div>

                  {/* CRUD Action Strip */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setViewingProduct(p)}
                      title="Visualizar detalhes do produto"
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      title="Editar produto"
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF3EA] transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRequestDelete(p)}
                      title="Excluir produto"
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View Product Modal */}
      <ProductDetailModal
        product={viewingProduct}
        vehicles={vehicles}
        onClose={() => setViewingProduct(null)}
        onEdit={handleOpenEdit}
        onDelete={handleRequestDelete}
      />

      {/* Create / Edit Product Modal */}
      {isFormOpen && (
        <ProductFormModal
          key={editingProduct?.id || `new-${selectedVehicleId}`}
          isOpen={isFormOpen}
          product={editingProduct}
          vehicles={vehicles}
          existingProducts={products}
          defaultVehicleId={selectedVehicleId}
          onClose={() => {
            setIsFormOpen(false)
            setEditingProduct(null)
          }}
          onSubmit={handleSaveProduct}
        />
      )}

      {/* Delete Confirmation Modal */}
      <CustomAlertModal
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        type="danger"
        isDangerAction={true}
        title="Excluir produto do catálogo?"
        message="Esta ação removerá o produto da listagem do catálogo e dos novos orçamentos. Orçamentos já criados não serão afetados."
        details={
          deletingProduct
            ? `${deletingProduct.name}${deletingProduct.sku ? ` (${deletingProduct.sku})` : ''}`
            : undefined
        }
        primaryButtonText="Excluir Produto"
        onPrimaryAction={handleConfirmDelete}
        secondaryButtonText="Cancelar"
      />
    </div>
  )
}
