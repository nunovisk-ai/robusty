import React, { useState, useEffect, useMemo } from 'react'
import type { Product, ProductCategory, Vehicle } from '../types'
import { PRODUCT_CATEGORIES, type ProductInput } from '../services/catalogService'
import { formatCurrency } from '../utils/formatters'
import {
  X,
  PackagePlus,
  Pencil,
  Save,
  Ruler,
  Scale,
  CreditCard,
  RefreshCw,
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

  const initialHasWeight = product
    ? product.weight_kg !== undefined && product.weight_kg !== null && product.weight_kg > 0
    : true

  const initialAutoCalc = product
    ? Math.abs(product.cash_price_5pct - round2(product.base_price_10x * 0.95)) < 0.05 &&
      Math.abs(product.max_discount_price_10pct - round2(product.base_price_10x * 0.9)) < 0.05
    : true

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
  const [hasWeight, setHasWeight] = useState(initialHasWeight)
  const [weightInput, setWeightInput] = useState(
    initialHasWeight && product ? formatDecimalForInput(product.weight_kg) : ''
  )
  const [weightTouched, setWeightTouched] = useState(Boolean(product))
  const [description, setDescription] = useState(product?.description || '')

  const [autoCalcDiscounts, setAutoCalcDiscounts] = useState(initialAutoCalc)
  const [basePriceInput, setBasePriceInput] = useState(
    product ? formatDecimalForInput(product.base_price_10x) : ''
  )
  const [cashPriceInput, setCashPriceInput] = useState(
    product ? formatDecimalForInput(product.cash_price_5pct) : ''
  )
  const [pixPriceInput, setPixPriceInput] = useState(
    product ? formatDecimalForInput(product.max_discount_price_10pct) : ''
  )
  const [installationCostInput, setInstallationCostInput] = useState(
    product ? formatDecimalForInput(product.installation_cost ?? 0) : '0'
  )
  const [paymentNotes, setPaymentNotes] = useState(product?.payment_conditions_notes || '')

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
  const parsedCash = parseDecimalInput(cashPriceInput)
  const parsedPix = parseDecimalInput(pixPriceInput)
  const parsedInstall = parseDecimalInput(installationCostInput || '0')

  const handleCategoryChange = (nextCat: ProductCategory) => {
    setCategory(nextCat)
    if (!isEditing && !weightTouched) {
      const catOption = PRODUCT_CATEGORIES.find((c) => c.value === nextCat)
      if (catOption) {
        setHasWeight(catOption.defaultHasWeight)
        if (!catOption.defaultHasWeight) {
          setWeightInput('')
        }
      }
    }
  }

  const handleBasePriceChange = (val: string) => {
    setBasePriceInput(val)
    if (autoCalcDiscounts) {
      const num = parseDecimalInput(val)
      if (!isNaN(num) && num >= 0) {
        setCashPriceInput(formatDecimalForInput(round2(num * 0.95)))
        setPixPriceInput(formatDecimalForInput(round2(num * 0.9)))
      } else if (!val.trim()) {
        setCashPriceInput('')
        setPixPriceInput('')
      }
    }
  }

  const handleRecalculateDiscounts = () => {
    const num = parseDecimalInput(basePriceInput)
    if (!isNaN(num) && num >= 0) {
      setCashPriceInput(formatDecimalForInput(round2(num * 0.95)))
      setPixPriceInput(formatDecimalForInput(round2(num * 0.9)))
    }
  }

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
      setErrorMsg('Informe um valor válido para 10x sem juros (valor base).')
      return
    }

    const finalCash = cashPriceInput.trim() ? parsedCash : round2(parsedBase * 0.95)
    const finalPix = pixPriceInput.trim() ? parsedPix : round2(parsedBase * 0.9)
    const finalInstall = installationCostInput.trim() ? parsedInstall : 0

    if (isNaN(finalCash) || finalCash < 0) {
      setErrorMsg('Informe um valor válido para À vista (5% boleto).')
      return
    }

    if (isNaN(finalPix) || finalPix < 0) {
      setErrorMsg('Informe um valor válido para PIX (10% MAX).')
      return
    }

    if (isNaN(finalInstall) || finalInstall < 0) {
      setErrorMsg('Informe um valor válido para o custo de instalação.')
      return
    }

    let finalWeight: number | undefined = undefined
    if (hasWeight && weightInput.trim()) {
      const parsedWeight = parseDecimalInput(weightInput)
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        setErrorMsg('Informe um peso válido maior que zero (kg) ou desmarque "Peso aplicável".')
        return
      }
      finalWeight = parsedWeight
    }

    const payload: ProductInput = {
      name: trimmedName,
      sku: trimmedSku || undefined,
      category,
      compatible_vehicle_id: vehicleId || undefined,
      model_version: modelVersion.trim() || undefined,
      dimensions: dimensions.trim() || undefined,
      weight_kg: finalWeight,
      base_price_10x: round2(parsedBase),
      cash_price_5pct: round2(finalCash),
      max_discount_price_10pct: round2(finalPix),
      installation_cost: round2(finalInstall),
      description: description.trim() || undefined,
      payment_conditions_notes: paymentNotes.trim() || undefined,
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

  const boletoPct =
    !isNaN(parsedBase) && parsedBase > 0 && !isNaN(parsedCash)
      ? ((parsedBase - parsedCash) / parsedBase) * 100
      : null
  const pixPct =
    !isNaN(parsedBase) && parsedBase > 0 && !isNaN(parsedPix)
      ? ((parsedBase - parsedPix) / parsedBase) * 100
      : null

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
                  ? 'Atualize as informações técnicas, veículo compatível e condições de pagamento.'
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
                    onChange={(e) => handleCategoryChange(e.target.value as ProductCategory)}
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
                        {v.standard_installation_cost > 0
                          ? ` (+R$ ${v.standard_installation_cost} inst.)`
                          : ''}
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-slate-400" />
                      <span>Peso (kg)</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasWeight}
                        onChange={(e) => {
                          setWeightTouched(true)
                          setHasWeight(e.target.checked)
                          if (!e.target.checked) setWeightInput('')
                        }}
                        className="rounded border-slate-300 accent-[#EA580C] cursor-pointer"
                      />
                      <span>Aplicável</span>
                    </label>
                  </div>

                  {hasWeight ? (
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={weightInput}
                        onChange={(e) => {
                          setWeightTouched(true)
                          setWeightInput(e.target.value)
                        }}
                        placeholder="Ex: 38 ou 3,5"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-mono font-bold"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-slate-400">
                        kg
                      </span>
                    </div>
                  ) : (
                    <div className="w-full bg-slate-50/70 border border-dashed border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 italic">
                      Peso não aplicável para este item
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Usado no cálculo automático de peso total para cotação de frete.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Payment Conditions */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>3. Condições de Pagamento</span>
                </h4>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoCalcDiscounts}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setAutoCalcDiscounts(checked)
                        if (checked) handleRecalculateDiscounts()
                      }}
                      className="rounded border-slate-300 accent-[#EA580C] cursor-pointer"
                    />
                    <span>Auto-calcular 5% / 10%</span>
                  </label>

                  {!autoCalcDiscounts && (
                    <button
                      type="button"
                      onClick={handleRecalculateDiscounts}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#EA580C] hover:text-[#C2410C] cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Recalcular</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-[#F8F9FA] p-4 rounded-2xl border border-slate-200/70 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Base 10x */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      10x sem juros (R$) <span className="text-[#EA580C]">*</span>
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
                        onChange={(e) => handleBasePriceChange(e.target.value)}
                        placeholder="0,00"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono font-bold"
                      />
                    </div>
                    {!isNaN(parsedBase) && parsedBase > 0 && (
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">
                        10x de {formatCurrency(parsedBase / 10)}
                      </p>
                    )}
                  </div>

                  {/* Cash 5% */}
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1.5">
                      À vista — 5% boleto (R$) <span className="text-[#EA580C]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-emerald-600">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        value={cashPriceInput}
                        onChange={(e) => {
                          setAutoCalcDiscounts(false)
                          setCashPriceInput(e.target.value)
                        }}
                        placeholder="0,00"
                        className="w-full bg-white border border-emerald-200 rounded-xl pl-9 pr-3 py-2 text-xs text-emerald-800 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                      />
                    </div>
                    {boletoPct !== null && (
                      <p className="text-[10px] text-emerald-700 mt-1 font-mono">
                        {boletoPct > 0
                          ? `-${boletoPct.toFixed(1).replace('.', ',')}% sobre tabela`
                          : 'Sem desconto'}
                      </p>
                    )}
                  </div>

                  {/* PIX 10% */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#EA580C] mb-1.5">
                      PIX — 10% MAX (R$) <span className="text-[#EA580C]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-[#EA580C]">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        value={pixPriceInput}
                        onChange={(e) => {
                          setAutoCalcDiscounts(false)
                          setPixPriceInput(e.target.value)
                        }}
                        placeholder="0,00"
                        className="w-full bg-white border border-[#FED7AA] rounded-xl pl-9 pr-3 py-2 text-xs text-[#EA580C] focus:outline-none focus:border-[#EA580C] font-mono font-bold"
                      />
                    </div>
                    {pixPct !== null && (
                      <p className="text-[10px] text-[#C2410C] mt-1 font-mono">
                        {pixPct > 0
                          ? `-${pixPct.toFixed(1).replace('.', ',')}% sobre tabela`
                          : 'Sem desconto'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Installation cost + Payment notes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/70">
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
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#EA580C] font-mono font-bold"
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

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Observações de Pagamento <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Ex: Condição especial para frotas ou sob encomenda"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#EA580C] font-medium"
                    />
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
