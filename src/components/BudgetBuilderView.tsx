import React, { useState, useEffect } from 'react'
import { Vehicle, Product, PaymentMethod, FulfillmentType } from '../types'
import { fetchVehicles, fetchProducts, calculateBudget } from '../services/catalogService'
import { lookupCep, CepResult } from '../services/cepService'
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
  DollarSign
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
  
  // Budget Items: [{ product, quantity }]
  const [items, setItems] = useState<{ product: Product; quantity: number }[]>([])
  
  // Fulfillment & Address
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
  const [addressNumber, setAddressNumber] = useState('')
  
  // Pricing parameters
  const [freightValue, setFreightValue] = useState<number>(0)
  const [includeInstallation, setIncludeInstallation] = useState<boolean>(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  
  // Customer info for proposal
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  // UI states
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

  // Products filtered STRICTLY by selected vehicle
  const compatibleProducts = allProducts.filter(
    (p) => !p.compatible_vehicle_id || p.compatible_vehicle_id === selectedVehicleId
  )

  // Auto-calculate installation cost
  const baseInstallationCost = (selectedVehicle && includeInstallation && fulfillment === 'instalacao_loja')
    ? selectedVehicle.standard_installation_cost
    : 0

  // Calculate budget
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

  // Format budget text for WhatsApp (Norlando can paste directly)
  const generateWhatsAppMessage = () => {
    const lines = [
      `*PROPOSTA COMERCIAL ROBUSTY — BAGAGEIROS AUTOMOTIVOS*`,
      `Olá ${customerName ? customerName : 'Cliente'}! Segue o orçamento detalhado:`,
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
      ...(discountPercent > 0 ? [`• Desconto Especial (${discountPercent}%): -${formatCurrency(budget.discountValue)}`] : []),
      ...(fulfillment === 'transportadora_envio' ? [`• Frete Transportadora: ${formatCurrency(budget.freightValue)}`] : []),
      ...(fulfillment === 'instalacao_loja' && budget.installationValue > 0 ? [`• Taxa de Instalação: ${formatCurrency(budget.installationValue)}`] : []),
      ``,
      `*VALOR TOTAL FINAL:* *${formatCurrency(budget.finalTotal)}*`,
      `*Condição Selecionada:* ${
        paymentMethod === 'pix'
          ? 'À vista no PIX (com 10% de desconto)'
          : paymentMethod === 'boleto'
          ? 'À vista no Boleto (com 5% de desconto)'
          : 'Cartão de Crédito em até 10x sem juros'
      }`,
      ``,
      `Qualquer dúvida estou à disposição para confirmarmos seu pedido!`,
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
      {/* Title */}
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Calculator className="w-6 h-6 text-orange-500" />
          <span>Construtor de Orçamento Comercial</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Regra de dependência veicular: selecione o veículo para liberar exclusivamente os bagageiros e acessórios compatíveis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vehicle & Item Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Select Vehicle */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3 flex items-center gap-2">
              <Car className="w-4 h-4 text-orange-400" />
              <span>1. Selecione o Veículo do Cliente:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVehicleId(v.id)
                    // Clear incompatible items when vehicle changes
                    setItems([])
                  }}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    selectedVehicleId === v.id
                      ? 'bg-orange-500/10 border-orange-500 text-white font-medium ring-1 ring-orange-500/30'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{v.model}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{v.make}</div>
                </button>
              ))}
            </div>

            {selectedVehicle?.notes && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{selectedVehicle.notes}</span>
              </div>
            )}
          </div>

          {/* Step 2: Compatible Products for Selected Vehicle */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                2. Bagageiros e Acessórios Compatíveis:
              </label>
              <span className="text-xs text-orange-400 font-mono">
                {compatibleProducts.length} itens disponíveis
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {compatibleProducts.map((p) => {
                const inBudget = items.find((i) => i.product.id === p.id)
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white truncate">{p.name}</span>
                        {p.dimensions && (
                          <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                            ({p.dimensions})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="text-slate-400">10x: {formatCurrency(p.base_price_10x)}</span>
                        <span className="text-emerald-400 font-medium">PIX: {formatCurrency(p.max_discount_price_10pct)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddItem(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        inBudget
                          ? 'bg-orange-500 text-slate-950 font-semibold'
                          : 'bg-slate-800 hover:bg-orange-500 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-orange-400'
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

          {/* Step 3: Fulfillment (Transportadora vs Instalação) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
              3. Modalidade de Atendimento:
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setFulfillment('transportadora_envio')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  fulfillment === 'transportadora_envio'
                    ? 'bg-orange-500/10 border-orange-500 text-white font-medium ring-1 ring-orange-500/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Truck className="w-5 h-5 text-orange-400 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-semibold">Envio por Transportadora</div>
                  <div className="text-[10px] text-slate-400">Exige CEP e cotação de frete</div>
                </div>
              </button>

              <button
                onClick={() => setFulfillment('instalacao_loja')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  fulfillment === 'instalacao_loja'
                    ? 'bg-orange-500/10 border-orange-500 text-white font-medium ring-1 ring-orange-500/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Wrench className="w-5 h-5 text-orange-400 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-semibold">Instalação na Loja</div>
                  <div className="text-[10px] text-slate-400">Agendamento físico interno</div>
                </div>
              </button>
            </div>

            {/* If Transportadora: CEP & Freight Fields */}
            {fulfillment === 'transportadora_envio' && (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] text-slate-400 block mb-1">CEP de Entrega (Obrigatório):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="00000-000"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        onClick={handleCepSearch}
                        disabled={loadingCep}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5"
                      >
                        {loadingCep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 text-orange-400" />}
                        <span>Buscar CEP</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-40">
                    <label className="text-[11px] text-slate-400 block mb-1">Valor do Frete (R$):</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={freightValue || ''}
                      onChange={(e) => setFreightValue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                {address.city && (
                  <div className="text-xs text-slate-300 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">{address.street || 'Logradouro'}</span>, {address.neighborhood} — {address.city}/{address.state}
                    </div>
                  </div>
                )}
                {address.error && (
                  <div className="text-xs text-red-400">{address.error}</div>
                )}
              </div>
            )}

            {/* If Instalação: show standard installation note */}
            {fulfillment === 'instalacao_loja' && (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Custo de Instalação Padrão ({selectedVehicle?.model}):</span>
                  <span className="font-mono font-bold text-orange-400">
                    {formatCurrency(selectedVehicle?.standard_installation_cost || 0)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Agendamento manual será registrado na Agenda interna da Loja (1 veículo por vez).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Financial Summary & WhatsApp Output */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sticky top-20 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <span>Resumo do Orçamento</span>
              <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </span>
            </h2>

            {/* Customer Inputs */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Nome do Cliente:</label>
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">WhatsApp / Telefone:</label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>

            {/* Selected Items List */}
            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/50 mb-4">
                Nenhum produto adicionado ainda. Selecione os itens ao lado.
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-[180px] overflow-y-auto pr-1">
                {items.map((i) => (
                  <div
                    key={i.product.id}
                    className="flex items-center justify-between text-xs bg-slate-950/40 p-2 rounded-lg border border-slate-800/50"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium text-white truncate">{i.product.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {i.quantity}x {formatCurrency(
                          paymentMethod === 'pix'
                            ? i.product.max_discount_price_10pct
                            : paymentMethod === 'boleto'
                            ? i.product.cash_price_5pct
                            : i.product.base_price_10x
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleQuantityChange(i.product.id, -1)}
                        className="w-5 h-5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center font-mono"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono text-white px-1">{i.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(i.product.id, 1)}
                        className="w-5 h-5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center font-mono"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleRemoveItem(i.product.id)}
                        className="ml-1 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Condition Radios */}
            <div className="space-y-1.5 mb-4 pt-3 border-t border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-1">Forma de Pagamento:</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-medium border transition-all ${
                    paymentMethod === 'pix'
                      ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>PIX (10%)</div>
                  <div className="text-[9px] text-slate-500 font-normal">Máx desconto</div>
                </button>

                <button
                  onClick={() => setPaymentMethod('boleto')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-medium border transition-all ${
                    paymentMethod === 'boleto'
                      ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>Boleto (5%)</div>
                  <div className="text-[9px] text-slate-500 font-normal">À vista</div>
                </button>

                <button
                  onClick={() => setPaymentMethod('cartao_link_igor')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-medium border transition-all ${
                    paymentMethod === 'cartao_link_igor'
                      ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>10x Cartão</div>
                  <div className="text-[9px] text-slate-500 font-normal">Sem juros</div>
                </button>
              </div>
            </div>

            {/* Manual Discount Slider (0% - 10%) */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Desconto Adicional Comercial:</span>
                <span className="font-mono text-orange-400 font-bold">{discountPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                className="w-full accent-orange-500 bg-slate-950"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>0%</span>
                <span>Alçada Máx 10%</span>
              </div>
            </div>

            {/* Financial Calculations Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 mb-4 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Produtos:</span>
                <span className="text-white">{formatCurrency(budget.subtotal)}</span>
              </div>

              {budget.discountValue > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto ({budget.discountPercent}%):</span>
                  <span>-{formatCurrency(budget.discountValue)}</span>
                </div>
              )}

              {fulfillment === 'transportadora_envio' && (
                <div className="flex justify-between text-slate-400">
                  <span>Frete (Transportadora):</span>
                  <span className="text-white">+{formatCurrency(budget.freightValue)}</span>
                </div>
              )}

              {fulfillment === 'instalacao_loja' && (
                <div className="flex justify-between text-slate-400">
                  <span>Instalação Loja:</span>
                  <span className="text-white">+{formatCurrency(budget.installationValue)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="font-bold text-sm text-white">TOTAL FINAL:</span>
                <span className="font-bold text-lg text-orange-400">
                  {formatCurrency(budget.finalTotal)}
                </span>
              </div>

              {budget.savingsVs10x > 0 && (
                <div className="text-[11px] text-emerald-400 text-right font-sans font-medium">
                  Economia para o cliente: {formatCurrency(budget.savingsVs10x)}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleCopyProposal}
                disabled={items.length === 0}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  copied
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-orange-500 hover:bg-orange-600 text-slate-950 shadow-lg shadow-orange-500/20 disabled:opacity-50'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado para o WhatsApp!' : 'Copiar Texto para o WhatsApp'}</span>
              </button>

              <button
                onClick={handleSaveToCrm}
                disabled={items.length === 0}
                className="w-full py-2 px-4 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 text-orange-400" />
                <span>Salvar como Card no Funil de Vendas</span>
              </button>

              {savedSuccess && (
                <div className="text-center text-xs text-emerald-400 py-1 font-medium animate-fade-in">
                  Card de oportunidade criado com sucesso no CRM!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
