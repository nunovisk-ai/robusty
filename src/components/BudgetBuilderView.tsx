import React, { useState, useEffect } from 'react'
import type { Vehicle, Product, PaymentMethod, FulfillmentType } from '../types'
import { fetchVehicles, fetchProducts, calculateBudget } from '../services/catalogService'
import { lookupCep, type CepResult } from '../services/cepService'
import { 
  Calculator, 
  Truck, 
  Wrench, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  MapPin, 
  Loader2, 
  AlertCircle,
  Car,
  FileCheck,
  Send
} from 'lucide-react'

interface BudgetBuilderViewProps {
  initialVehicleId?: string
  onSaveToKanban?: (opportunityData: any) => void
}

export const BudgetBuilderView: React.FC<BudgetBuilderViewProps> = ({ 
  initialVehicleId,
  onSaveToKanban 
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId || '')
  
  const [items, setItems] = useState<{ product: Product; quantity: number }[]>([])
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('transportadora_envio')
  const [cep, setCep] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)
  const [address, setAddress] = useState<CepResult>({
    cep: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
  })
  
  const [freightValue, setFreightValue] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  const [copied, setCopied] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const [vList, pList] = await Promise.all([fetchVehicles(), fetchProducts()])
      setVehicles(vList)
      setAllProducts(pList)
      if (!selectedVehicleId && vList.length > 0) {
        setSelectedVehicleId(vList[0].id)
      }
    }
    load()
  }, [])

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)

  const compatibleProducts = allProducts.filter(
    (p) => !p.compatible_vehicle_id || p.compatible_vehicle_id === selectedVehicleId
  )

  const baseInstallationCost = (selectedVehicle && fulfillment === 'instalacao_loja')
    ? selectedVehicle.standard_installation_cost
    : 0

  const budget = calculateBudget(
    items,
    paymentMethod,
    discountPercent,
    fulfillment === 'transportadora_envio' ? freightValue : 0,
    baseInstallationCost
  )

  const handleAddItem = (prod: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === prod.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product: prod, quantity: 1 }]
    })
  }

  const handleRemoveItem = (prodId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== prodId))
  }

  const handleQuantityChange = (prodId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.product.id === prodId) {
            const nextQty = i.quantity + delta
            return nextQty > 0 ? { ...i, quantity: nextQty } : null
          }
          return i
        })
        .filter(Boolean) as { product: Product; quantity: number }[]
    )
  }

  const handleCepSearch = async () => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) return
    setLoadingCep(true)
    const res = await lookupCep(cep)
    setAddress(res)
    setLoadingCep(false)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const generateWhatsAppMessage = () => {
    const lines = [
      `*PROPOSTA COMERCIAL ROBUSTY — BAGAGEIROS AUTOMOTIVOS*`,
      `Olá ${customerName ? customerName : 'Cliente'}! Segue seu orçamento oficial:`,
      ``,
      `*Veículo:* ${selectedVehicle ? selectedVehicle.model : 'Não especificado'}`,
      `*Modalidade:* ${fulfillment === 'instalacao_loja' ? 'Instalação na Loja Robusty' : 'Envio por Transportadora'}`,
      ...(fulfillment === 'transportadora_envio' && address.city ? [`*Destino:* ${address.city} - ${address.state} (CEP: ${address.cep})`] : []),
      ``,
      `*ITENS DO ORÇAMENTO:*`,
      ...items.map(
        (i, idx) =>
          `${idx + 1}. ${i.product.name} (x${i.quantity}) — ${formatCurrency(
            paymentMethod === 'pix'
              ? i.product.max_discount_price_10pct
              : paymentMethod === 'boleto'
              ? i.product.cash_price_5pct
              : i.product.base_price_10x
          )}`
      ),
      ``,
      `*RESUMO FINANCEIRO:*`,
      `• Subtotal Produtos: ${formatCurrency(budget.subtotal)}`,
      ...(discountPercent > 0 ? [`• Desconto Comercial (${discountPercent}%): -${formatCurrency(budget.discountValue)}`] : []),
      ...(fulfillment === 'transportadora_envio' ? [`• Frete Transportadora: ${formatCurrency(budget.freightValue)}`] : []),
      ...(fulfillment === 'instalacao_loja' && budget.installationValue > 0 ? [`• Taxa de Instalação: ${formatCurrency(budget.installationValue)}`] : []),
      ``,
      `*VALOR TOTAL:* *${formatCurrency(budget.finalTotal)}*`,
      `*Condição:* ${
        paymentMethod === 'pix'
          ? 'À vista no PIX (10% de desconto)'
          : paymentMethod === 'boleto'
          ? 'À vista no Boleto (5% de desconto)'
          : 'Cartão de Crédito em até 10x sem juros'
      }`,
      ``,
      `Qualquer dúvida estamos à disposição para confirmar seu pedido!`,
    ]
    return lines.join('\n')
  }

  const handleCopyProposal = () => {
    const text = generateWhatsAppMessage()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSaveToCrm = () => {
    if (onSaveToKanban) {
      onSaveToKanban({
        customerName: customerName || 'Novo Cliente',
        customerPhone,
        vehicle: selectedVehicle,
        items,
        fulfillment,
        address: fulfillment === 'transportadora_envio' ? address : null,
        budget,
        paymentMethod,
      })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Item Picker */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step 1: Customer Contact Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Dados do Contato
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nome do Cliente:</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-full px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 transition-all font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">WhatsApp / Telefone:</label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-full px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 font-mono transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Select Vehicle */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Car className="w-4 h-4 text-[#EA580C]" />
                <span>2. Veículo do Cliente (Regra de Dependência)</span>
              </h3>
              {selectedVehicle && (
                <span className="text-xs font-semibold text-[#EA580C] bg-[#FFF3EA] px-3 py-1 rounded-full">
                  {selectedVehicle.model}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVehicleId(v.id)
                    setItems([]) // clear incompatible items
                  }}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedVehicleId === v.id
                      ? 'bg-[#FFF3EA] border-[#EA580C] text-[#EA580C] font-semibold shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/70 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{v.model}</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">{v.make}</div>
                </button>
              ))}
            </div>

            {selectedVehicle?.notes && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{selectedVehicle.notes}</span>
              </div>
            )}
          </div>

          {/* Step 3: Compatible Products for Selected Vehicle */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Bagageiros e Acessórios Compatíveis
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {compatibleProducts.length} itens disponíveis
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {compatibleProducts.map((p) => {
                const inBudget = items.find((i) => i.product.id === p.id)
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{p.name}</span>
                        {p.dimensions && (
                          <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                            ({p.dimensions})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-0.5 font-mono">
                        <span className="text-slate-500">10x: {formatCurrency(p.base_price_10x)}</span>
                        <span className="text-emerald-700 font-semibold">PIX: {formatCurrency(p.max_discount_price_10pct)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddItem(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        inBudget
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{inBudget ? `Adicionado (${inBudget.quantity})` : 'Adicionar'}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step 4: Fulfillment (Transportadora vs Instalação) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              4. Modalidade de Atendimento
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFulfillment('transportadora_envio')}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  fulfillment === 'transportadora_envio'
                    ? 'bg-orange-50 border-orange-500 text-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-lg ${fulfillment === 'transportadora_envio' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">Transportadora</div>
                  <div className="text-[10px] text-slate-500">Requer CEP e Frete</div>
                </div>
              </button>

              <button
                onClick={() => setFulfillment('instalacao_loja')}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  fulfillment === 'instalacao_loja'
                    ? 'bg-orange-50 border-orange-500 text-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-lg ${fulfillment === 'instalacao_loja' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">Instalação na Loja</div>
                  <div className="text-[10px] text-slate-500">Agenda interna física</div>
                </div>
              </button>
            </div>

            {/* If Transportadora: CEP & Freight Fields */}
            {fulfillment === 'transportadora_envio' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      CEP do Cliente (Obrigatório):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="00000-000"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-mono"
                      />
                      <button
                        onClick={handleCepSearch}
                        disabled={loadingCep}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {loadingCep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                        <span>Buscar</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-full sm:w-44">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Valor do Frete (R$):
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={freightValue || ''}
                      onChange={(e) => setFreightValue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                {address.city && (
                  <div className="text-xs text-slate-700 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">{address.street || 'Logradouro'}</span>, {address.neighborhood} — {address.city}/{address.state}
                    </div>
                  </div>
                )}
                {address.error && (
                  <div className="text-xs text-red-600">{address.error}</div>
                )}
              </div>
            )}

            {/* If Instalação: Standard installation fee */}
            {fulfillment === 'instalacao_loja' && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Taxa de Instalação ({selectedVehicle?.model}):</span>
                <span className="font-mono font-bold text-orange-700">
                  {formatCurrency(selectedVehicle?.standard_installation_cost || 0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Helena/Kommo Style Quotation Sheet */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm sticky top-20">
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <img src={`${import.meta.env.BASE_URL}robusty-logo.png`} alt="Robusty" className="h-7 w-auto object-contain" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                PROPOSTA OFICIAL
              </span>
            </div>

            {/* Customer & Vehicle Header */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-1 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-900">{customerName || 'Cliente não informado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Veículo:</span>
                <span className="font-semibold text-slate-800">{selectedVehicle?.model || 'Não selecionado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Modalidade:</span>
                <span className="text-slate-800 font-medium">
                  {fulfillment === 'transportadora_envio' ? 'Transportadora' : 'Instalação na Loja'}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 mb-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Itens Adicionados ({items.length})
              </div>

              {items.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Nenhum item selecionado
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {items.map((i) => (
                    <div
                      key={i.product.id}
                      className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-bold text-slate-900 truncate">{i.product.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {i.quantity}x {formatCurrency(
                            paymentMethod === 'pix'
                              ? i.product.max_discount_price_10pct
                              : paymentMethod === 'boleto'
                              ? i.product.cash_price_5pct
                              : i.product.base_price_10x
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuantityChange(i.product.id, -1)}
                          className="w-5 h-5 rounded bg-white text-slate-600 hover:bg-slate-200 flex items-center justify-center font-mono border border-slate-200"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold text-slate-900 px-1">{i.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(i.product.id, 1)}
                          className="w-5 h-5 rounded bg-white text-slate-600 hover:bg-slate-200 flex items-center justify-center font-mono border border-slate-200"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemoveItem(i.product.id)}
                          className="ml-1 text-slate-400 hover:text-red-500 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Pills */}
            <div className="space-y-1.5 mb-4 pt-3 border-t border-slate-100">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Condição de Pagamento:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`py-2.5 px-1 text-center rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    paymentMethod === 'pix'
                      ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-sm shadow-orange-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>PIX (10%)</div>
                </button>

                <button
                  onClick={() => setPaymentMethod('boleto')}
                  className={`py-2.5 px-1 text-center rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    paymentMethod === 'boleto'
                      ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-sm shadow-orange-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>Boleto (5%)</div>
                </button>

                <button
                  onClick={() => setPaymentMethod('cartao_link_igor')}
                  className={`py-2.5 px-1 text-center rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    paymentMethod === 'cartao_link_igor'
                      ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-sm shadow-orange-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>10x Cartão</div>
                </button>
              </div>
            </div>

            {/* Manual Discount Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 font-bold">Desconto Manual:</span>
                <span className="font-mono text-[#EA580C] font-bold">{discountPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                className="w-full accent-[#EA580C] cursor-pointer"
              />
            </div>

            {/* Financial Summary Breakdown */}
            <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-slate-100 space-y-2 font-mono text-xs mb-5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produtos:</span>
                <span className="text-[#121212] font-bold">{formatCurrency(budget.subtotal)}</span>
              </div>

              {budget.discountValue > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Desconto ({budget.discountPercent}%):</span>
                  <span>-{formatCurrency(budget.discountValue)}</span>
                </div>
              )}

              {fulfillment === 'transportadora_envio' && (
                <div className="flex justify-between text-slate-600">
                  <span>Frete Transportadora:</span>
                  <span className="text-[#121212] font-bold">+{formatCurrency(budget.freightValue)}</span>
                </div>
              )}

              {fulfillment === 'instalacao_loja' && (
                <div className="flex justify-between text-slate-600">
                  <span>Instalação Loja:</span>
                  <span className="text-[#121212] font-bold">+{formatCurrency(budget.installationValue)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-bold text-sm text-[#121212]">VALOR TOTAL:</span>
                <span className="font-bold text-2xl text-[#EA580C] font-sans">
                  {formatCurrency(budget.finalTotal)}
                </span>
              </div>

              {budget.savingsVs10x > 0 && (
                <div className="text-[11px] text-emerald-700 text-right font-sans font-semibold pt-0.5">
                  Economia cliente: {formatCurrency(budget.savingsVs10x)}
                </div>
              )}
            </div>

            {/* Actions (Nexo Pill Buttons) */}
            <div className="space-y-2.5">
              <button
                onClick={handleCopyProposal}
                disabled={items.length === 0}
                className={`w-full py-3 px-5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 active:scale-98'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                <span>{copied ? 'Copiado para o WhatsApp!' : 'Copiar Texto para o WhatsApp'}</span>
              </button>

              <button
                onClick={handleSaveToCrm}
                disabled={items.length === 0}
                className="w-full py-3 px-5 rounded-full text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Salvar como Card no Funil de Vendas</span>
              </button>

              {savedSuccess && (
                <div className="text-center text-xs text-emerald-700 py-1 font-bold animate-fade-in">
                  Card de oportunidade salvo no banco Supabase e adicionado ao Pipeline!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
