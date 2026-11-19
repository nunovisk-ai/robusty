import React, { useState, useEffect, useMemo } from 'react'
import type { Product, ProductCategory, Vehicle } from '../types'
import { PRODUCT_CATEGORIES, type ProductInput } from '../services/catalogService'
import {
  X,
  PackagePlus,
  Pencil,
  Save,
  Ruler,
  Scale,
  Tag,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

interface ProductFormModalProps {
  isOpen: boolean
  product: Product | null // null = create mode, Product = edit mode
  vehicles: Vehicle[]
  existingProducts: Product[]
  defaultVehicleId?: string
  onClose: () => void
  onSubmit: (input: ProductInput, editingId?: string) => Promise<void>
}

function formatDecimalForInput(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return ''
  return String(val).replace('.', ',')
}

function parseDecimalInput(raw: string): number {
  const cleaned = raw.trim().replace(/\s/g, '')
  if (!cleaned) return NaN
  // Support both "2.600,50" and "2600.50" and "2600,50"
  const normalized =
    cleaned.includes(',') && cleaned.includes('.')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(',', '.')
  const num = Number(normalized)
  return isNaN(num) ? NaN : num
}

function round2(val: number): number {
  return Math.round(val * 100) / 100
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  product,
  vehicles,
  existingProducts,
  defaultVehicleId,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(product)

  const initialWeight =
    product && product.weight_kg !== undefined && product.weight_kg !== null && product.weight_kg > 0
      ? formatDecimalForInput(product.weight_kg)
      : ''

  const [name, setName] = useState(product?.name || '')
  const [sku, setSku] = useState(product?.sku || '')
  const [category, setCategory] = useState<ProductCategory>(product?.category || 'bagageiro')
  const [vehicleId, setVehicleId] = useState<string>(
    product
      ? product.compatible_vehicle_id || ''
      : defaultVehicleId && defaultVehicleId !== 'all'
      ? defaultVehicleId
      : ''
  )
  const [modelVersion, setModelVersion] = useState(product?.model_version || '')
  const [dimensions, setDimensions] = useState(product?.dimensions || '')
  const [weightInput, setWeightInput] = useState(initialWeight)
  const [description, setDescription] = useState(product?.description || '')

  const [basePriceInput, setBasePriceInput] = useState(
    product ? formatDecimalForInput(product.base_price_10x) : ''
  )
  const [installationCostInput, setInstallationCostInput] = useState(
    product ? formatDecimalForInput(product.installation_cost ?? 0) : '0'
  )

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, saving, onClose])

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId),
    [vehicles, vehicleId]
  )

  const parsedBase = parseDecimalInput(basePriceInput)
  const parsedInstall = parseDecimalInput(installationCostInput || '0')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMsg('Informe o nome do produto.')
      return
    }

    const trimmedSku = sku.trim().toUpperCase()
    if (trimmedSku) {
      const duplicate = existingProducts.find(
        (p) => p.id !== product?.id && p.sku?.trim().toUpperCase() === trimmedSku
      )
      if (duplicate) {
        setErrorMsg(`O SKU "${trimmedSku}" já está em uso pelo produto "${duplicate.name}".`)
        return
      }
    }

    if (isNaN(parsedBase) || parsedBase < 0) {
      setErrorMsg('Informe um valor válido para o produto ou serviço.')
      return
    }

    const finalInstall = installationCostInput.trim() ? parsedInstall : 0
    if (isNaN(finalInstall) || finalInstall < 0) {
      setErrorMsg('Informe um valor válido para o custo de instalação.')
      return
    }

    let finalWeight: number | undefined = undefined
    if (weightInput.trim()) {
      const parsedWeight = parseDecimalInput(weightInput)
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        setErrorMsg('Informe um peso válido maior que zero (kg) ou deixe em branco.')
        return
      }
      finalWeight = parsedWeight
    }

    const baseRounded = round2(parsedBase)
    const payload: ProductInput = {
      name: trimmedName,
      sku: trimmedSku || undefined,
      category,
      compatible_vehicle_id: vehicleId || undefined,
      model_version: modelVersion.trim() || undefined,
      dimensions: dimensions.trim() || undefined,
      weight_kg: finalWeight,
      base_price_10x: baseRounded,
      cash_price_5pct: round2(baseRounded * 0.95),
      max_discount_price_10pct: round2(baseRounded * 0.9),
      installation_cost: round2(finalInstall),
      description: description.trim() || undefined,
      is_active: true,
    }

    try {
      setSaving(true)
      await onSubmit(payload, product?.id)
      onClose()
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Ocorreu um erro ao salvar o produto. Tente novamente.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => {
        if (!saving) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200/80 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF3EA] border border-[#FED7AA] flex items-center justify-center shrink-0">
              {isEditing ? (
                <Pencil className="w-5 h-5 text-[#EA580C]" />
              ) : (
                <PackagePlus className="w-5 h-5 text-[#EA580C]" />
              )}
            </div>
            <div>
              <h3
                id="product-form-title"
                className="text-base sm:text-lg font-bold text-[#121212] tracking-tight"
              >
                {isEditing ? 'Editar Produto do Catálogo' : 'Cadastrar Novo Produto'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Atualize as informações técnicas, veículo compatível e preço.'
                  : 'Preencha os dados do produto para disponibilizá-lo no catálogo e nos orçamentos.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar formulário"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="p-6 overflow-y-auto space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1. Identificação & Classificação
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nome do Produto <span className="text-[#EA580C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Bagageiro Kombi MX 100 Plus (Aba Dupla)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    SKU / Código
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="Ex: KOM-MX100-PLUS"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Categoria <span className="text-[#EA580C]">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-semibold cursor-pointer"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Veículo Compatível
                  </label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-semibold cursor-pointer"
                  >
                    <option value="">Universal / Todos os Veículos</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Versão / Modelo <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={modelVersion}
                    onChange={(e) => setModelVersion(e.target.value)}
                    placeholder="Ex: MX 100 Plus Aba Dupla"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Descrição Curta <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Bagageiro integral para Kombi com aba dupla."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Dimensions & Weight */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                2. Medidas & Peso
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-slate-400" />
                    <span>Medidas</span>
                    <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="Ex: 3,30m X 1,28m x 0,38m"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Informe comprimento x largura x altura, "Sob medida" ou deixe em branco se não se aplicar.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                    <span>Peso (kg)</span>
                    <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      placeholder="Ex: 38 ou 3,5"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-mono font-bold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-slate-400">
                      kg
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Deixe em branco quando não se aplicar. Usado no cálculo automático de frete.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Price */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>3. Preço</span>
              </h4>

              <div className="bg-[#F8F9FA] p-4 rounded-2xl border border-slate-200/70">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Valor (R$) <span className="text-[#EA580C]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        value={basePriceInput}
                        onChange={(e) => setBasePriceInput(e.target.value)}
                        placeholder="0,00"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Custo de Instalação (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={installationCostInput}
                        onChange={(e) => setInstallationCostInput(e.target.value)}
                        placeholder="0,00"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono font-bold"
                      />
                    </div>
                    {selectedVehicle &&
                      selectedVehicle.standard_installation_cost > 0 &&
                      parsedInstall !== selectedVehicle.standard_installation_cost && (
                        <button
                          type="button"
                          onClick={() =>
                            setInstallationCostInput(
                              formatDecimalForInput(selectedVehicle.standard_installation_cost)
                            )
                          }
                          className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#EA580C] hover:underline cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>
                            Usar padrão {selectedVehicle.model} (+R$ {selectedVehicle.standard_installation_cost})
                          </span>
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 sm:px-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-98 disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {saving
                  ? 'Salvando...'
                  : isEditing
                  ? 'Salvar Alterações'
                  : 'Cadastrar Produto'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
