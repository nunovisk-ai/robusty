import React, { useEffect } from 'react'
import type { Product, Vehicle } from '../types'
import { getCategoryLabel, formatWeightKg } from '../services/catalogService'
import { formatCurrency } from '../utils/formatters'
import {
  X,
  Ruler,
  Scale,
  Layers,
  Tag,
  CreditCard,
  Banknote,
  Zap,
  Wrench,
  Pencil,
  Trash2,
  AlertTriangle,
  FileText,
  Info,
} from 'lucide-react'

interface ProductDetailModalProps {
  product: Product | null
  vehicles: Vehicle[]
  onClose: () => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  vehicles,
  onClose,
  onEdit,
  onDelete,
}) => {
  useEffect(() => {
    if (!product) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [product, onClose])

  if (!product) return null

  const vehicle = vehicles.find((v) => v.id === product.compatible_vehicle_id)
  const weightFormatted = formatWeightKg(product.weight_kg)

  const installmentValue = product.base_price_10x > 0 ? product.base_price_10x / 10 : 0
  const boletoSavings = Math.max(0, product.base_price_10x - product.cash_price_5pct)
  const boletoPct =
    product.base_price_10x > 0 ? (boletoSavings / product.base_price_10x) * 100 : 0
  const pixSavings = Math.max(0, product.base_price_10x - product.max_discount_price_10pct)
  const pixPct =
    product.base_price_10x > 0 ? (pixSavings / product.base_price_10x) * 100 : 0

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {product.sku || 'ROBUSTY'}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF3EA] text-[#EA580C] border border-[#FED7AA]/70">
                {getCategoryLabel(product.category)}
              </span>
              {!vehicle && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Universal
                </span>
              )}
            </div>

            <h3
              id="product-detail-title"
              className="text-lg font-bold text-[#121212] tracking-tight leading-snug"
            >
              {product.name}
            </h3>

            {product.model_version && (
              <p className="text-xs text-slate-500 font-medium">
                Versão / Modelo: <span className="text-slate-700 font-semibold">{product.model_version}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes do produto"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Technical Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/70 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-[#EA580C]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Veículo Compatível
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {vehicle ? vehicle.model : 'Universal / Todos os Veículos'}
                </p>
                {vehicle && (vehicle.make || vehicle.year_range) && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {[vehicle.make, vehicle.year_range].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/70 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-[#EA580C]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Categoria
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {getCategoryLabel(product.category)}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/70 flex items-center justify-center shrink-0">
                <Ruler className="w-4 h-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Medidas
                </span>
                <p className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                  {product.dimensions || 'Não informada'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/70 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Peso
                </span>
                <p className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                  {weightFormatted || 'Não aplicável'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <FileText className="w-3.5 h-3.5" />
                <span>Descrição & Características</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Vehicle Technical Note */}
          {vehicle?.notes && (
            <div className="p-3.5 rounded-2xl bg-[#FFF8F3] border border-[#FED7AA] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
              <div className="text-xs text-[#9A3412]">
                <span className="font-bold text-[#7C2D12] block mb-0.5">
                  Nota Técnica ({vehicle.model}):
                </span>
                {vehicle.notes}
              </div>
            </div>
          )}

          {/* Payment Conditions */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Condições de Pagamento
            </h4>

            <div className="bg-[#F8F9FA] p-4 rounded-2xl border border-slate-200/70 space-y-3">
              {/* 10x sem juros */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <CreditCard className="w-3.5 h-3.5 text-slate-700" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      10x sem juros (Cartão / Tabela)
                    </span>
                    {installmentValue > 0 && (
                      <span className="text-[11px] text-slate-500">
                        10 parcelas de <strong className="font-mono text-slate-700">{formatCurrency(installmentValue)}</strong>
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold font-mono text-[#121212]">
                  {formatCurrency(product.base_price_10x)}
                </span>
              </div>

              {/* Boleto 5% */}
              <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shrink-0">
                    <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      À vista (5% boleto)
                    </span>
                    {boletoSavings > 0 ? (
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Economia de {formatCurrency(boletoSavings)} ({boletoPct.toFixed(1).replace('.', ',')}%)
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Valor fixo sem desconto</span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold font-mono text-emerald-700">
                  {formatCurrency(product.cash_price_5pct)}
                </span>
              </div>

              {/* PIX 10% */}
              <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FFF3EA] border border-[#FED7AA] flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5 text-[#EA580C]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#EA580C] block">
                      PIX (10% MAX)
                    </span>
                    {pixSavings > 0 ? (
                      <span className="text-[11px] text-[#C2410C] font-medium">
                        Economia de {formatCurrency(pixSavings)} ({pixPct.toFixed(1).replace('.', ',')}%)
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Valor fixo sem desconto</span>
                    )}
                  </div>
                </div>
                <span className="text-base font-bold font-mono text-[#EA580C]">
                  {formatCurrency(product.max_discount_price_10pct)}
                </span>
              </div>

              {/* Installation */}
              <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-200/70 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Wrench className="w-3.5 h-3.5 text-slate-400" />
                  <span>Custo de Instalação:</span>
                </div>
                <span className="font-mono font-bold text-slate-800">
                  {product.installation_cost > 0
                    ? `+${formatCurrency(product.installation_cost)}`
                    : 'Sem taxa adicional'}
                </span>
              </div>

              {product.payment_conditions_notes && (
                <div className="pt-2.5 border-t border-slate-200/70 flex items-start gap-2 text-xs text-slate-600">
                  <Info className="w-3.5 h-3.5 text-[#EA580C] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{product.payment_conditions_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(product)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-[#EA580C] hover:text-[#EA580C] transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(product)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-rose-600 bg-white border border-rose-200/80 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
