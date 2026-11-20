import { ROBUSTY_LOGO_BASE64, MIXFER_LOGO_BASE64 } from '../assets/logoBase64'
import { formatOrderCode, formatCurrency, formatCPF, formatCNPJ, formatBRPhone, getLargestPackageDimensions } from './formatters'
import type { PaymentSplit, PersonType, DocumentType } from '../types'

export interface ProposalPayload {
  orderNumber: number
  customerName: string
  customerPhone: string
  commercialPhone?: string
  customerEmail?: string
  personType?: PersonType
  documentType?: DocumentType
  document?: string
  stateRegistration?: string
  municipalRegistration?: string
  tradeName?: string
  vehicleModel: string
  items: Array<{
    product: {
      id: string
      name: string
      dimensions?: string
      weight_kg?: number
      base_price_10x: number
      color?: string
    }
    quantity: number
    color?: string
  }>
  budget: {
    subtotal: number
    freightValue: number
    installationValue: number
    discountValue: number
    discountPercent: number
    finalTotal: number
  }
  fulfillment: 'transportadora_envio' | 'instalacao_loja'
  address?: {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    cep?: string
  }
  pickupDate?: string
  pickupTime?: string
  installationDate?: string
  installationTime?: string
  paymentMethod?: string
  paymentSubtype?: string
  cardInstallments?: number
  paymentSplits?: PaymentSplit[]
  shippingCarrierName?: string
  shippingQuoteNumber?: string
  shippingCarrierContact?: string
  deliveryLeadTime?: string
  productionLeadTime?: string
  shippingPackageDimensions?: string
  shippingTrackingCode?: string
  productColor?: string
  totalWeightKg?: number
  assignedTo?: string
  notes?: string
}

const valOrDash = (val?: string | null): string => {
  const trimmed = val?.trim()
  return trimmed ? trimmed : '-'
}

const formatIsoDate = (dateStr?: string): string => {
  const trimmed = dateStr?.trim()
  if (!trimmed) return '-'
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-')
    return `${d}/${m}/${y}`
  }
  return trimmed
}

export function generateProposalHtml(data: ProposalPayload): string {
  const todayStr = new Date().toLocaleDateString('pt-BR')
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 7)
  const validUntilStr = validUntil.toLocaleDateString('pt-BR')

  // Formatação de Documentos (Tipo antes do Número)
  const isPJ = data.personType === 'juridica'
  const rawDoc = data.document?.trim() || ''
  const documentLabel = isPJ ? 'CNPJ' : (data.documentType ? data.documentType.toUpperCase() : 'CPF')
  const formattedDoc = rawDoc
    ? isPJ
      ? formatCNPJ(rawDoc)
      : data.documentType === 'cpf' || !data.documentType
      ? formatCPF(rawDoc)
      : rawDoc
    : '-'

  const formattedAddress = (() => {
    const a = data.address
    if (!a) return '-'
    const parts: string[] = []
    if (a.street?.trim()) {
      parts.push(`${a.street.trim()}, Nº ${a.number?.trim() || 'S/N'}${a.complement?.trim() ? ` (${a.complement.trim()})` : ''}`)
    }
    if (a.neighborhood?.trim()) parts.push(a.neighborhood.trim())
    const cityState = [a.city?.trim(), a.state?.trim()].filter(Boolean).join('/')
    if (cityState) parts.push(cityState)
    if (a.cep?.trim()) parts.push(`CEP: ${a.cep.trim()}`)
    return parts.length > 0 ? parts.join(' - ') : '-'
  })()

  // Peso total calculado pela soma dos itens
  const computedItemsWeight = data.items.reduce((sum, item) => {
    const unitW = Number(item.product.weight_kg || 0)
    return sum + unitW * item.quantity
  }, 0)
  const totalWeightKg = computedItemsWeight > 0 ? computedItemsWeight : (data.totalWeightKg || 0)

  // Cor padrão do orçamento quando o item não tiver cor própria
  const budgetColor = data.productColor?.trim() || '-'

  // Linhas da tabela de itens
  const itemsRows =
    data.items.length === 0
      ? `
        <tr>
          <td colspan="6" class="py-4 px-3 text-center text-slate-400">Nenhum item adicionado neste orçamento.</td>
        </tr>
      `
      : data.items
          .map((i, index) => {
            const unitPrice = i.product.base_price_10x
            const lineTotal = unitPrice * i.quantity
            const itemColor = i.color?.trim() || i.product.color?.trim() || budgetColor
            const itemWeight = i.product.weight_kg ? `${(i.product.weight_kg * i.quantity).toFixed(1).replace(/\.0$/, '')} kg` : '-'
            const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'

            return `
              <tr class="${rowBg} border-b border-slate-200/80">
                <td class="py-2 px-2.5 text-center font-mono font-semibold text-slate-700">${i.quantity}</td>
                <td class="py-2 px-2.5">
                  <div class="font-semibold text-slate-900 leading-tight">${i.product.name}</div>
                  ${i.product.dimensions ? `<div class="text-[10px] text-slate-500 font-mono mt-0.5">${i.product.dimensions}</div>` : ''}
                </td>
                <td class="py-2 px-2.5 text-center text-slate-700 font-medium">${itemColor}</td>
                <td class="py-2 px-2.5 text-center font-mono text-slate-600">${itemWeight}</td>
                <td class="py-2 px-2.5 text-right font-mono text-slate-700">${formatCurrency(unitPrice)}</td>
                <td class="py-2 px-2.5 text-right font-mono font-bold text-slate-900">${formatCurrency(lineTotal)}</td>
              </tr>
            `
          })
          .join('')

  // Formas de Pagamento (exatamente conforme campos do sistema)
  const cardInstallmentsCount = data.cardInstallments && data.cardInstallments > 0 ? data.cardInstallments : 1
  const cardInstallmentValue = Math.round((data.budget.finalTotal / cardInstallmentsCount) * 100) / 100

  const cashSubtypeLabel = (() => {
    switch (data.paymentSubtype) {
      case 'debito': return 'Cartão de Débito'
      case 'transferencia': return 'Transferência Bancária'
      case 'dinheiro': return 'Dinheiro'
      case 'pix':
      default: return 'PIX'
    }
  })()

  const hasSplitPayments = Boolean(data.paymentSplits && data.paymentSplits.length > 0)

  const paymentMethodDisplay = (() => {
    if (hasSplitPayments) {
      return `
        <div class="space-y-1">
          ${data.paymentSplits!
            .map((s, idx) => {
              const methodText =
                s.method === 'pix'
                  ? 'À Vista (PIX)'
                  : s.method === 'cartao_link_igor' || s.method === 'cartao_presencial' || s.method === 'cartao_credito'
                  ? `Cartão de Crédito (${s.installments || 1}x de ${formatCurrency((s.amount || 0) / (s.installments || 1))})`
                  : s.method === 'boleto'
                  ? 'Boleto Bancário'
                  : 'Transferência / Dinheiro'
              return `
                <div class="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-b-0">
                  <span class="font-medium text-slate-800">${idx + 1}. ${methodText}${s.notes ? ` — <span class="text-slate-500">${s.notes}</span>` : ''}</span>
                  <span class="font-mono font-bold text-slate-900">${formatCurrency(s.amount)}</span>
                </div>
              `
            })
            .join('')}
        </div>
      `
    }

    if (data.paymentMethod === 'pix') {
      return `
        <div class="text-xs font-semibold text-slate-900">
          À Vista — ${cashSubtypeLabel}
        </div>
      `
    }

    if (data.paymentMethod === 'boleto') {
      return `
        <div class="text-xs font-semibold text-slate-900">
          Boleto Bancário
        </div>
      `
    }

    return `
      <div class="text-xs font-semibold text-slate-900">
        Cartão de Crédito — ${cardInstallmentsCount}x de ${formatCurrency(cardInstallmentValue)}
      </div>
    `
  })()

  const pickupDateFormatted = formatIsoDate(data.pickupDate)
  const pickupDisplay =
    pickupDateFormatted !== '-'
      ? `${pickupDateFormatted}${data.pickupTime?.trim() ? ` às ${data.pickupTime.trim()}` : ''}`
      : '-'

  const installationDateFormatted = formatIsoDate(data.installationDate)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento ${formatOrderCode(data.orderNumber)} — MixFer / Robusty</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .font-mono {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
      font-variant-numeric: tabular-nums;
    }
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      .sheet-container {
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
        margin: 0 !important;
      }
      @page {
        margin: 10mm 12mm;
        size: A4 portrait;
      }
    }
  </style>
</head>
<body class="min-h-screen pb-8">
  <!-- Barra de Ações (Oculta na Impressão) -->
  <header class="no-print sticky top-0 z-50 bg-slate-900 text-white shadow-sm border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <img src="${ROBUSTY_LOGO_BASE64}" alt="Robusty" class="h-5 w-auto object-contain brightness-0 invert" />
      <span class="text-xs font-mono font-bold text-orange-400">${formatOrderCode(data.orderNumber)}</span>
    </div>

    <div class="flex items-center gap-2">
      <button onclick="window.print()" class="px-3.5 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
        <span>Imprimir / Salvar PDF</span>
      </button>

      <button onclick="window.close()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer">
        Fechar
      </button>
    </div>
  </header>

  <!-- Folha A4 do Orçamento -->
  <main class="max-w-[820px] mx-auto mt-5 p-6 sm:p-7 bg-white border border-slate-200 shadow-sm rounded-lg sheet-container space-y-3.5 text-[11px]">
    
    <!-- 1. Cabeçalho Corporativo: Logo Robusty + Dados MixFer + Logo MixFer alinhada à direita -->
    <div class="flex items-center justify-between gap-4 pb-3 border-b-2 border-slate-800">
      <div class="flex items-center gap-3.5 min-w-0">
        <img
          src="${ROBUSTY_LOGO_BASE64}"
          alt="Robusty"
          class="h-10 w-auto object-contain shrink-0"
        />
        <div class="text-[10.5px] leading-snug text-slate-600 border-l border-slate-200 pl-3.5">
          <div class="font-bold text-slate-900 text-xs">MIXFER INDÚSTRIA E EXPORTAÇÃO LTDA.</div>
          <div><span class="font-semibold text-slate-700">CNPJ:</span> <span class="font-mono">13.563.446/0001-76</span></div>
          <div>Rua Dante Marteletti, Nº 122 - Jd. Maringá, São Paulo/SP - CEP 03525-150</div>
          <div><span class="font-semibold text-slate-700">Telefone:</span> (11) 3774-4674 / (11) 98703-7943</div>
        </div>
      </div>

      <img
        src="${MIXFER_LOGO_BASE64}"
        alt="MixFer"
        class="h-9 w-auto object-contain shrink-0"
      />
    </div>

    <!-- 2. Metadados do Orçamento: Número do Pedido, Emissão, Validade e Vendedor -->
    <div class="grid grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded px-3 py-2">
      <div>
        <div class="text-[9.5px] uppercase font-bold text-slate-400">Orçamento / Pedido</div>
        <div class="font-mono font-extrabold text-sm text-slate-900">${formatOrderCode(data.orderNumber)}</div>
      </div>
      <div>
        <div class="text-[9.5px] uppercase font-bold text-slate-400">Data de Emissão</div>
        <div class="font-mono font-semibold text-slate-800">${todayStr}</div>
      </div>
      <div>
        <div class="text-[9.5px] uppercase font-bold text-slate-400">Validade</div>
        <div class="font-mono font-semibold text-slate-800">${validUntilStr}</div>
      </div>
      <div>
        <div class="text-[9.5px] uppercase font-bold text-slate-400">Vendedor</div>
        <div class="font-semibold text-slate-800 truncate">${valOrDash(data.assignedTo)}</div>
      </div>
    </div>

    <!-- 3. Dados do Cliente -->
    <section class="border border-slate-200 rounded overflow-hidden">
      <div class="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-700">1. Dados do Cliente</h2>
        <span class="text-[10px] font-semibold text-slate-500">${isPJ ? 'Pessoa Jurídica' : 'Pessoa Física'}</span>
      </div>

      <div class="p-3 space-y-2">
        ${isPJ ? `
          <div class="grid grid-cols-12 gap-x-3 gap-y-1.5">
            <div class="col-span-7">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Razão Social</div>
              <div class="font-bold text-slate-900 text-xs">${valOrDash(data.customerName)}</div>
            </div>
            <div class="col-span-5">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Documento</div>
              <div class="font-mono font-semibold text-slate-900"><span class="text-slate-500 font-sans font-semibold">${documentLabel}:</span> ${formattedDoc}</div>
            </div>
            <div class="col-span-4">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Inscrição Estadual</div>
              <div class="font-mono text-slate-800">${valOrDash(data.stateRegistration)}</div>
            </div>
            <div class="col-span-4">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Inscrição Municipal</div>
              <div class="font-mono text-slate-800">${valOrDash(data.municipalRegistration)}</div>
            </div>
            <div class="col-span-4">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Nome do Responsável</div>
              <div class="text-slate-800 font-medium">${valOrDash(data.tradeName)}</div>
            </div>
            <div class="col-span-4">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Telefone Comercial</div>
              <div class="font-mono text-slate-800">${data.commercialPhone?.trim() ? formatBRPhone(data.commercialPhone) : '-'}</div>
            </div>
            <div class="col-span-4">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">WhatsApp</div>
              <div class="font-mono text-slate-800">${data.customerPhone?.trim() ? formatBRPhone(data.customerPhone) : '-'}</div>
            </div>
            <div class="col-span-4">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">E-mail</div>
              <div class="text-slate-800 truncate">${valOrDash(data.customerEmail)}</div>
            </div>
            <div class="col-span-12 pt-1 border-t border-slate-100">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Endereço</div>
              <div class="text-slate-800">${formattedAddress}</div>
            </div>
          </div>
        ` : `
          <div class="grid grid-cols-12 gap-x-3 gap-y-1.5">
            <div class="col-span-7">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Nome Completo</div>
              <div class="font-bold text-slate-900 text-xs">${valOrDash(data.customerName)}</div>
            </div>
            <div class="col-span-5">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Documento</div>
              <div class="font-mono font-semibold text-slate-900"><span class="text-slate-500 font-sans font-semibold">${documentLabel}:</span> ${formattedDoc}</div>
            </div>
            <div class="col-span-4">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">WhatsApp</div>
              <div class="font-mono text-slate-800">${data.customerPhone?.trim() ? formatBRPhone(data.customerPhone) : '-'}</div>
            </div>
            <div class="col-span-8">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">E-mail</div>
              <div class="text-slate-800 truncate">${valOrDash(data.customerEmail)}</div>
            </div>
            <div class="col-span-12 pt-1 border-t border-slate-100">
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Endereço</div>
              <div class="text-slate-800">${formattedAddress}</div>
            </div>
          </div>
        `}
      </div>
    </section>

    <!-- 4. Itens e Produtos do Orçamento -->
    <section class="border border-slate-200 rounded overflow-hidden">
      <div class="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between gap-2">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-700">2. Itens do Orçamento (${data.items.length})</h2>
        <div class="text-[10.5px] text-slate-700">
          <span class="text-slate-500 font-semibold">Veículo:</span> <strong class="text-slate-900">${valOrDash(data.vehicleModel)}</strong>
        </div>
      </div>

      <table class="w-full text-left text-[11px] border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9.5px]">
            <th class="py-1.5 px-2.5 text-center w-12">Qtd</th>
            <th class="py-1.5 px-2.5">Descrição do Produto</th>
            <th class="py-1.5 px-2.5 text-center w-24">Cor</th>
            <th class="py-1.5 px-2.5 text-center w-20">Peso</th>
            <th class="py-1.5 px-2.5 text-right w-24">Preço Unit.</th>
            <th class="py-1.5 px-2.5 text-right w-24">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </section>

    <!-- 5. Detalhes de Logística (100% Dinâmico por Modalidade) -->
    <section class="border border-slate-200 rounded overflow-hidden">
      <div class="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-700">3. Detalhes de Logística</h2>
        <span class="text-[10.5px] font-bold text-slate-800">
          ${data.fulfillment === 'transportadora_envio' ? 'Transportadora (Envio)' : 'Instalação na Loja'}
        </span>
      </div>

      <div class="p-3">
        ${data.fulfillment === 'transportadora_envio' ? `
          <div class="grid grid-cols-3 gap-x-3 gap-y-2">
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Transportadora</div>
              <div class="font-semibold text-slate-900 truncate">${valOrDash(data.shippingCarrierName)}</div>
            </div>
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Cotação Frete Nº</div>
              <div class="font-mono font-semibold text-slate-800">${valOrDash(data.shippingQuoteNumber)}</div>
            </div>
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Contato Transportadora</div>
              <div class="text-slate-800 truncate">${valOrDash(data.shippingCarrierContact)}</div>
            </div>
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Prazo de Produção</div>
              <div class="font-mono font-semibold text-slate-800">${formatIsoDate(data.productionLeadTime)}</div>
            </div>
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Prazo de Entrega</div>
              <div class="font-mono font-semibold text-slate-800">${formatIsoDate(data.deliveryLeadTime)}</div>
            </div>
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Previsão de Coleta</div>
              <div class="font-mono text-slate-800">${pickupDisplay}</div>
            </div>
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Peso Total Estimado</div>
              <div class="font-mono font-bold text-slate-800">${totalWeightKg > 0 ? `${totalWeightKg.toFixed(1).replace(/\.0$/, '')} kg` : '-'}</div>
            </div>
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Dimensões Volume (C x L x A)</div>
              <div class="font-mono text-slate-800">${valOrDash(data.shippingPackageDimensions?.trim() || getLargestPackageDimensions(data.items))}</div>
            </div>
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Cód. Rastreio</div>
              <div class="font-mono text-slate-800">${valOrDash(data.shippingTrackingCode)}</div>
            </div>
          </div>
        ` : `
          <div class="grid grid-cols-4 gap-x-3 gap-y-2">
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Prazo de Produção</div>
              <div class="font-mono font-semibold text-slate-900">${formatIsoDate(data.productionLeadTime)}</div>
            </div>
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Data da Instalação</div>
              <div class="font-mono font-semibold text-slate-900">${installationDateFormatted}</div>
            </div>
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Horário Agendado</div>
              <div class="font-mono font-semibold text-slate-900">${valOrDash(data.installationTime)}</div>
            </div>
            <div>
              <div class="text-[9.5px] uppercase font-semibold text-slate-400">Local da Instalação</div>
              <div class="text-slate-800">Rua Dante Marteletti, Nº 122 - Jd. Maringá, São Paulo/SP</div>
            </div>
          </div>
        `}
      </div>
    </section>

    <!-- 6. Condições de Pagamento & Resumo Financeiro (Bloco Único) -->
    <section class="border border-slate-200 rounded overflow-hidden">
      <div class="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-700">4. Condições de Pagamento</h2>
        <span class="text-[10px] font-semibold text-slate-500">${hasSplitPayments ? 'Pagamento Combinado' : 'Forma Única'}</span>
      </div>

      <div class="p-3 grid grid-cols-12 gap-4 items-start">
        <div class="col-span-7">
          <div class="text-[9.5px] uppercase font-semibold text-slate-400 mb-1">Forma Selecionada</div>
          ${paymentMethodDisplay}
        </div>

        <div class="col-span-5 border-l border-slate-200 pl-4 space-y-1 text-[11px]">
          <div class="flex justify-between text-slate-600">
            <span>Subtotal Produtos:</span>
            <span class="font-mono font-semibold text-slate-800">${formatCurrency(data.budget.subtotal)}</span>
          </div>
          ${data.budget.discountValue > 0 ? `
            <div class="flex justify-between text-emerald-700 font-semibold">
              <span>Desconto (${data.budget.discountPercent}%):</span>
              <span class="font-mono">-${formatCurrency(data.budget.discountValue)}</span>
            </div>
          ` : ''}
          ${data.fulfillment === 'transportadora_envio' ? `
            <div class="flex justify-between text-slate-600">
              <span>Frete:</span>
              <span class="font-mono font-semibold text-slate-800">${formatCurrency(data.budget.freightValue)}</span>
            </div>
          ` : `
            <div class="flex justify-between text-slate-600">
              <span>Instalação:</span>
              <span class="font-mono font-semibold text-slate-800">${formatCurrency(data.budget.installationValue)}</span>
            </div>
          `}
          <div class="pt-1.5 mt-1 border-t border-slate-300 flex justify-between items-center text-slate-900">
            <span class="font-extrabold uppercase text-[11px]">Valor Total:</span>
            <span class="font-mono font-black text-sm text-[#EA580C]">${formatCurrency(data.budget.finalTotal)}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. Dados para Depósito Bancário -->
    <section class="border border-slate-200 rounded overflow-hidden">
      <div class="bg-slate-100 px-3 py-1.5 border-b border-slate-200">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-700">5. Dados para Depósito Bancário / PIX</h2>
      </div>
      <div class="p-3 grid grid-cols-3 gap-3">
        <div>
          <div class="text-[9.5px] uppercase font-semibold text-slate-400">Favorecido</div>
          <div class="font-semibold text-slate-900">Mixfer Ind. e Exp. Ltda.</div>
        </div>
        <div>
          <div class="text-[9.5px] uppercase font-semibold text-slate-400">Banco Bradesco (237)</div>
          <div class="font-mono text-slate-800">Agência: 0298 • C/C: 217100-7</div>
        </div>
        <div>
          <div class="text-[9.5px] uppercase font-semibold text-slate-400">Chave PIX (CNPJ)</div>
          <div class="font-mono font-semibold text-slate-900">13.563.446/0001-76</div>
        </div>
      </div>
    </section>

  </main>
</body>
</html>`
}
