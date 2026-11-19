import { ROBUSTY_LOGO_BASE64, MIXFER_LOGO_BASE64 } from '../assets/logoBase64'
import { formatOrderCode, formatCurrency, formatCPF, formatCNPJ, formatBRPhone } from './formatters'
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
    }
    quantity: number
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

export function generateProposalHtml(data: ProposalPayload): string {
  const todayStr = new Date().toLocaleDateString('pt-BR')
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 7)
  const validUntilStr = validUntil.toLocaleDateString('pt-BR')

  // Formatação de Documentos
  const isPJ = data.personType === 'juridica'
  const formattedDoc = data.document
    ? isPJ
      ? formatCNPJ(data.document)
      : data.documentType === 'cpf'
      ? formatCPF(data.document)
      : data.document
    : 'Não informado'

  const documentLabel = isPJ ? 'CNPJ' : (data.documentType ? data.documentType.toUpperCase() : 'CPF')

  // Linhas de produtos
  const itemsRows = data.items.map((i, index) => {
    const unitPrice = i.product.base_price_10x
    const lineTotal = unitPrice * i.quantity
    const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'

    return `
      <tr class="${rowBg} border-b border-slate-100 hover:bg-slate-100/50 transition-colors">
        <td class="py-3 px-4 text-center font-mono font-bold text-slate-500">${i.quantity}</td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900">${i.product.name}</div>
          ${i.product.dimensions ? `<div class="text-[11px] text-slate-500 font-mono">Medidas: ${i.product.dimensions}</div>` : ''}
        </td>
        <td class="py-3 px-4 text-center text-[11px] font-mono text-slate-600">
          ${i.product.weight_kg ? `${i.product.weight_kg * i.quantity} kg (${i.product.weight_kg} kg/un)` : '—'}
        </td>
        <td class="py-3 px-4 text-right font-mono text-slate-700">${formatCurrency(unitPrice)}</td>
        <td class="py-3 px-4 text-right font-mono font-bold text-slate-900">${formatCurrency(lineTotal)}</td>
      </tr>
    `
  }).join('')

  // Cor do Produto
  const selectedColor = data.productColor || 'Preto Epóxi'

  // Formas de Pagamento formatadas
  const cardInstallmentsCount = data.cardInstallments && data.cardInstallments > 0 ? data.cardInstallments : 10
  const cardInstallmentValue = Math.round((data.budget.finalTotal / cardInstallmentsCount) * 100) / 100

  const cashSubtypeLabel = (() => {
    switch (data.paymentSubtype) {
      case 'debito': return 'Cartão de Débito'
      case 'transferencia': return 'Transferência Bancária (TED/DOC)'
      case 'dinheiro': return 'Dinheiro em Espécie'
      default: return 'PIX à Vista'
    }
  })()

  const hasSplitPayments = Boolean(data.paymentSplits && data.paymentSplits.length > 0)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento Comercial ${formatOrderCode(data.orderNumber)} — Robusty & MixFer</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
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
        padding: 0 !important;
        max-width: 100% !important;
        margin: 0 !important;
      }
      @page {
        margin: 8mm 10mm;
        size: A4 portrait;
      }
    }
  </style>
</head>
<body class="min-h-screen pb-12">
  <!-- Barra de Ações Superior (Oculta na Impressão) -->
  <header class="no-print sticky top-0 z-50 bg-slate-900 text-white shadow-md border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <img src="${ROBUSTY_LOGO_BASE64}" alt="Robusty" class="h-6 w-auto object-contain brightness-0 invert" />
      <span class="text-xs font-mono font-bold text-orange-400">${formatOrderCode(data.orderNumber)}</span>
      <span class="hidden sm:inline text-xs text-slate-300">| Orçamento Comercial Oficial</span>
    </div>

    <div class="flex items-center gap-2">
      <button onclick="window.print()" class="px-4 py-1.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
        <span>Imprimir / Salvar em PDF</span>
      </button>

      <button onclick="window.close()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer">
        Fechar
      </button>
    </div>
  </header>

  <!-- Container Principal do Orçamento -->
  <main class="max-w-4xl mx-auto mt-6 p-6 sm:p-10 bg-white rounded-3xl border border-slate-200/90 shadow-xl sheet-container space-y-5">
    
    <!-- Cabeçalho Oficial: Logos Robusty & MixFer -->
    <div class="flex flex-col sm:flex-row items-center justify-between pb-5 border-b border-slate-200 gap-4">
      <!-- Logo Robusty (Esquerda) -->
      <div class="flex items-center gap-3">
        <img
          src="${ROBUSTY_LOGO_BASE64}"
          alt="Robusty Bagageiros"
          class="h-11 sm:h-12 w-auto object-contain shrink-0"
        />
      </div>

      <!-- Título Central & Identificação -->
      <div class="text-center space-y-0.5">
        <div class="text-xs font-bold tracking-widest text-[#EA580C] uppercase">
          Proposta Comercial Oficial
        </div>
        <div class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
          ORÇAMENTO ${formatOrderCode(data.orderNumber)}
        </div>
        <div class="text-[11px] text-slate-500 flex items-center justify-center gap-3 pt-0.5">
          <span>Emissão: <strong class="text-slate-800">${todayStr}</strong></span>
          <span>•</span>
          <span>Validade: <strong class="text-slate-800">${validUntilStr}</strong> (7 dias)</span>
          ${data.assignedTo ? `<span>•</span><span>Vendedor: <strong class="text-slate-800">${data.assignedTo}</strong></span>` : ''}
        </div>
      </div>

      <!-- Logo MixFer (Direita) -->
      <div class="flex items-center gap-3">
        <img
          src="${MIXFER_LOGO_BASE64}"
          alt="MixFer Indústria"
          class="h-10 sm:h-11 w-auto object-contain shrink-0"
        />
      </div>
    </div>

    <!-- Barra de Fábrica & Endereço Oficial -->
    <div class="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-center text-[11px] text-slate-600 space-y-0.5">
      <div class="font-bold text-slate-800">
        MIXFER INDÚSTRIA E EXPORTAÇÃO LTDA. • FÁBRICA ROBUSTY BAGAGEIROS AUTOMOTIVOS
      </div>
      <div>
        Rua Dante Marteletti, Nº 122 - Jd. Maringá, São Paulo/SP - CEP 03525-150 • Fones: <strong>(11) 3774-4674</strong> / <strong>(11) 98703-7943</strong>
      </div>
    </div>

    <!-- Bloco 1: Dados do Cliente / Destinatário & Veículo de Aplicação -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
      
      <!-- Card Cliente (7 Colunas) -->
      <div class="md:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5 text-xs">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            ${isPJ ? '1. Dados da Empresa (Pessoa Jurídica)' : '1. Dados do Cliente (Pessoa Física)'}
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isPJ ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}">
            ${isPJ ? 'Pessoa Jurídica' : 'Pessoa Física'}
          </span>
        </div>

        <div>
          <div class="text-[10px] text-slate-400 uppercase font-semibold">
            ${isPJ ? 'Razão Social' : 'Nome Completo'}
          </div>
          <div class="text-sm font-bold text-slate-900 leading-tight">
            ${data.customerName || 'Cliente'}
          </div>
        </div>

        ${isPJ && data.tradeName ? `
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Nome do Responsável</div>
            <div class="text-xs font-semibold text-slate-800">${data.tradeName}</div>
          </div>
        ` : ''}

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-semibold">${documentLabel}</div>
            <div class="font-mono text-slate-800 font-bold">${formattedDoc}</div>
          </div>

          ${isPJ ? `
            <div>
              <div class="text-[10px] text-slate-400 uppercase font-semibold">Inscrição Estadual</div>
              <div class="font-mono text-slate-800 font-semibold">${data.stateRegistration || 'ISENTO'}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase font-semibold">Inscrição Municipal</div>
              <div class="font-mono text-slate-800 font-semibold">${data.municipalRegistration || '—'}</div>
            </div>
          ` : `
            <div>
              <div class="text-[10px] text-slate-400 uppercase font-semibold">Tipo Documento</div>
              <div class="uppercase text-slate-700 font-semibold">${data.documentType || 'CPF'}</div>
            </div>
          `}
        </div>

        <div class="grid grid-cols-1 ${isPJ && data.commercialPhone ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2 pt-1 border-t border-slate-100">
          ${isPJ && data.commercialPhone ? `
            <div>
              <div class="text-[10px] text-slate-400 uppercase font-semibold">Telefone Comercial</div>
              <div class="font-mono text-slate-800">${formatBRPhone(data.commercialPhone)}</div>
            </div>
          ` : ''}
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-semibold">${isPJ ? 'WhatsApp (Responsável)' : 'WhatsApp'}</div>
            <div class="font-mono text-slate-800">${data.customerPhone ? formatBRPhone(data.customerPhone) : 'Não informado'}</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-semibold">E-mail</div>
            <div class="text-slate-800 truncate">${data.customerEmail || 'Não informado'}</div>
          </div>
        </div>

        ${data.address?.street ? `
          <div class="pt-1 border-t border-slate-100">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Endereço de Entrega / Cadastro</div>
            <div class="text-slate-700 text-[11px] leading-snug">
              ${data.address.street}, Nº ${data.address.number || 'S/N'}${data.address.complement ? ` (${data.address.complement})` : ''} — ${data.address.neighborhood || ''}, ${data.address.city || ''}/${data.address.state || ''} • CEP: <span class="font-mono">${data.address.cep || ''}</span>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Card Veículo & Acabamento (5 Colunas) -->
      <div class="md:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 text-xs flex flex-col justify-between">
        <div>
          <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 pb-2 border-b border-slate-100">
            2. Veículo & Acabamento
          </div>

          <div class="pt-2">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Veículo de Aplicação</div>
            <div class="text-base font-bold text-slate-900 leading-tight">
              ${data.vehicleModel || 'Utilitário'}
            </div>
            <div class="text-[11px] text-slate-500 mt-0.5">
              Instalação nas furações e pontos originais de fábrica (sem perfurações).
            </div>
          </div>

          <div class="pt-3">
            <div class="text-[10px] text-slate-400 uppercase font-semibold mb-1">Acabamento & Pintura</div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
              <span class="w-2.5 h-2.5 rounded-full ${selectedColor.toLowerCase().includes('branco') ? 'bg-white' : selectedColor.toLowerCase().includes('cinza') ? 'bg-slate-400' : 'bg-[#EA580C]'}"></span>
              <span>*COR: ${selectedColor.toUpperCase()}*</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-1">Pintura Eletrostática a Pó Epóxi de Alta Resistência</div>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-500">Peso Total Estimado:</span>
            <span class="font-mono font-bold text-slate-800">${data.totalWeightKg || 0} kg</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Estrutura:</span>
            <span class="text-slate-800 font-semibold">Aço Carbono Reforçado</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bloco 2: Itens do Orçamento (Tabela Moderna Limpa) -->
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div class="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
          3. Itens e Produtos do Orçamento (${data.items.length})
        </h3>
        <span class="text-[11px] font-mono text-slate-500">
          Valores com tabela de fábrica
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
              <th class="py-2.5 px-4 text-center w-14">Qtd</th>
              <th class="py-2.5 px-4">Descrição do Produto</th>
              <th class="py-2.5 px-4 text-center w-28">Peso Estimado</th>
              <th class="py-2.5 px-4 text-right w-28">Preço Unit.</th>
              <th class="py-2.5 px-4 text-right w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Bloco 3: Detalhes de Logística, Transporte & Prazos -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 text-xs">
      <div class="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
          4. Detalhes de Transporte & Logística
        </h3>
        <span class="text-xs font-bold text-[#EA580C]">
          ${data.fulfillment === 'transportadora_envio' ? 'Transportadora (Envio)' : 'Instalação Física na Loja'}
        </span>
      </div>

      ${data.fulfillment === 'transportadora_envio' ? `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Transportadora</div>
            <div class="font-bold text-slate-800 text-xs truncate">${data.shippingCarrierName || 'A definir / Despacho'}</div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Cotação Frete Nº</div>
            <div class="font-mono font-bold text-slate-800 text-xs">${data.shippingQuoteNumber || '—'}</div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Prazo de Produção</div>
            <div class="font-bold text-slate-800 text-xs">${data.productionLeadTime || '7 a 10 dias úteis'}</div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Prazo de Entrega</div>
            <div class="font-bold text-slate-800 text-xs">${data.deliveryLeadTime || '3 a 5 dias úteis'}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Dimensões do Volume (C x L x A)</div>
            <div class="font-mono text-slate-800 text-xs font-medium">${data.shippingPackageDimensions || 'Conforme especificação do veículo'}</div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Contato da Transportadora</div>
            <div class="text-slate-800 text-xs">${data.shippingCarrierContact || '—'}</div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Código de Rastreio / NF</div>
            <div class="font-mono text-slate-800 text-xs font-bold">${data.shippingTrackingCode || 'Emitido após despacho'}</div>
          </div>
        </div>
      ` : `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Data da Instalação</div>
            <div class="font-bold text-slate-800 text-xs">${data.installationDate || 'A agendar com o vendedor'}</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Horário Agendado</div>
            <div class="font-bold text-slate-800 text-xs">${data.installationTime || 'A definir'}</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Local da Loja / Fábrica</div>
            <div class="text-slate-800 text-xs">Rua Dante Marteletti, 122 - Jd. Maringá, SP</div>
          </div>
        </div>
      `}
    </div>

    <!-- Bloco 4: Formas de Pagamento & Resumo Financeiro -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
      
      <!-- Detalhamento de Pagamento (7 Colunas) -->
      <div class="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 text-xs flex flex-col justify-between">
        <div>
          <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>5. Condições de Pagamento</span>
            <span class="font-bold text-[#EA580C]">${hasSplitPayments ? 'Pagamento Dividido / Misto' : 'Forma Única'}</span>
          </div>

          ${hasSplitPayments ? `
            <div class="space-y-2 pt-2">
              <div class="text-[11px] text-slate-600 font-medium">Desdobramento acordado para o pedido:</div>
              <div class="space-y-1.5">
                ${data.paymentSplits!.map((s, idx) => {
                  const methodText = s.method === 'pix'
                    ? 'PIX / À vista'
                    : s.method === 'cartao_link_igor' || s.method === 'cartao_presencial' || s.method === 'cartao_credito'
                    ? `Cartão de Crédito (${s.installments || 1}x de ${formatCurrency((s.amount || 0) / (s.installments || 1))})`
                    : s.method === 'boleto'
                    ? 'Boleto Bancário'
                    : 'Dinheiro / Transferência'

                  return `
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <div class="font-bold text-slate-900">${idx + 1}. ${methodText}</div>
                        ${s.notes ? `<div class="text-[11px] text-slate-500 italic mt-0.5">${s.notes}</div>` : ''}
                      </div>
                      <div class="font-mono font-bold text-slate-900 text-xs">${formatCurrency(s.amount)}</div>
                    </div>
                  `
                }).join('')}
              </div>
            </div>
          ` : `
            <div class="space-y-2 pt-2 text-slate-700">
              ${data.paymentMethod === 'pix' ? `
                <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium leading-relaxed">
                  <strong>Condição À Vista:</strong> Pagamento via <strong>${cashSubtypeLabel}</strong> com desconto especial aplicado na proposta.
                </div>
              ` : data.paymentMethod === 'boleto' ? `
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium leading-relaxed">
                  <strong>Boleto Bancário:</strong> Emissão mediante aprovação cadastral e confirmação de pagamento.
                </div>
              ` : `
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1">
                  <div class="font-bold text-slate-900">Cartão de Crédito:</div>
                  <div class="text-xs">
                    Parcelamento em <strong>${cardInstallmentsCount}x de ${formatCurrency(cardInstallmentValue)} sem juros</strong>.
                  </div>
                  <div class="text-[11px] text-slate-500">Link de pagamento seguro ou presencial.</div>
                </div>
              `}
            </div>
          `}
        </div>

        <div class="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          * Qualquer dúvida sobre outras condições comerciais, consulte nosso departamento comercial.
        </div>
      </div>

      <!-- Totais & Resumo Financeiro (5 Colunas) -->
      <div class="md:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
        <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 pb-1.5 border-b border-slate-200">
          Resumo Financeiro
        </div>

        <div class="flex justify-between text-slate-600">
          <span>Subtotal Produtos:</span>
          <span class="font-mono font-semibold text-slate-800">${formatCurrency(data.budget.subtotal)}</span>
        </div>

        ${data.budget.discountValue > 0 ? `
          <div class="flex justify-between text-emerald-700 font-semibold">
            <span>Desconto Comercial (${data.budget.discountPercent}%):</span>
            <span class="font-mono">-${formatCurrency(data.budget.discountValue)}</span>
          </div>
        ` : ''}

        ${data.fulfillment === 'transportadora_envio' ? `
          <div class="flex justify-between text-slate-600">
            <span>Frete Transportadora:</span>
            <span class="font-mono font-semibold text-slate-800">${formatCurrency(data.budget.freightValue)}</span>
          </div>
        ` : ''}

        ${data.fulfillment === 'instalacao_loja' ? `
          <div class="flex justify-between text-slate-600">
            <span>Custo de Instalação:</span>
            <span class="font-mono font-semibold text-slate-800">${formatCurrency(data.budget.installationValue)}</span>
          </div>
        ` : ''}

        <div class="pt-3 border-t-2 border-slate-300 flex justify-between items-center text-slate-900">
          <span class="text-xs font-extrabold uppercase">Valor Total:</span>
          <span class="text-lg font-black text-[#EA580C] font-mono">${formatCurrency(data.budget.finalTotal)}</span>
        </div>
      </div>
    </div>

    <!-- Bloco 5: Dados Bancários Oficiais para Depósito / PIX -->
    <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-2.5 text-xs">
      <div class="flex items-center justify-between pb-2 border-b border-slate-700">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-xs font-bold uppercase tracking-wider text-slate-200">
            6. Dados para Depósito Bancário & Chave PIX Oficial
          </span>
        </div>
        <span class="text-[10px] text-slate-400 font-mono">Conta Jurídica Oficial MixFer</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div>
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Favorecido</div>
          <div class="font-bold text-white text-xs">Mixfer Ind. e Exp. Ltda.</div>
        </div>

        <div>
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Chave PIX / CNPJ</div>
          <div class="font-mono font-bold text-emerald-400 text-xs">13.563.446/0001-76</div>
        </div>

        <div>
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Banco Bradesco (237)</div>
          <div class="font-mono font-bold text-white text-xs">Agência: 0298 • C/C: 217100-7</div>
        </div>
      </div>
    </div>

    <!-- Bloco 6: Garantia Oficial & Instruções de Recebimento -->
    <div class="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3.5 text-xs text-emerald-950">
      <div class="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
        ✓
      </div>
      <div class="space-y-1 leading-relaxed">
        <div>
          <strong>Garantia de 1 Ano Robusty:</strong> Todas as peças e suportes possuem garantia integral de 1 ano contra defeitos de fabricação e fadiga de solda.
        </div>
        <div class="text-[11px] text-emerald-800">
          <strong>Atenção ao Recebimento na Transportadora:</strong> Favor conferir todas as embalagens no ato da entrega antes de assinar o canhoto. Em caso de avaria aparente, faça a ressalva no conhecimento de transporte (CT-e) imediatamente.
        </div>
      </div>
    </div>

    <!-- Rodapé -->
    <footer class="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-between">
      <span>Robusty Bagageiros Automotivos • CRM Comercial & Operacional</span>
      <span class="font-mono">Documento emitido eletronicamente</span>
    </footer>
  </main>
</body>
</html>`
}
