import { ROBUSTY_LOGO_BASE64 } from '../assets/logoBase64'
import { formatOrderCode } from './formatters'

export interface ProposalPayload {
  orderNumber: number
  customerName: string
  customerPhone: string
  customerEmail?: string
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
  totalWeightKg?: number
  assignedTo?: string
}

export function generateProposalHtml(data: ProposalPayload): string {
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const todayStr = new Date().toLocaleDateString('pt-BR')
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 7)
  const validUntilStr = validUntil.toLocaleDateString('pt-BR')

  const itemsRows = data.items.length === 0
    ? `<tr><td colspan="5" class="py-6 text-center text-slate-400 italic">Nenhum produto adicionado ao orçamento.</td></tr>`
    : data.items.map((it) => `
      <tr class="hover:bg-slate-50/50">
        <td class="py-3 px-4 font-semibold text-slate-900">${it.product.name}</td>
        <td class="py-3 px-3 text-center text-slate-600 font-mono text-[11px]">
          ${it.product.dimensions || 'Padrão'} ${it.product.weight_kg ? `• ${it.product.weight_kg}kg` : ''}
        </td>
        <td class="py-3 px-3 text-center font-bold text-slate-800">${it.quantity}</td>
        <td class="py-3 px-3 text-right text-slate-600 font-mono">${formatCurrency(it.product.base_price_10x)}</td>
        <td class="py-3 px-4 text-right font-bold text-slate-900 font-mono">${formatCurrency(it.product.base_price_10x * it.quantity)}</td>
      </tr>
    `).join('')

  const fulfillmentSection = data.fulfillment === 'transportadora_envio'
    ? `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
        <div>
          <strong>Destino: </strong>
          ${data.address?.street ? `${data.address.street}, ${data.address.number || 'S/N'}` : 'Endereço a confirmar'}
          ${data.address?.city ? ` — ${data.address.city}/${data.address.state || ''}` : ''}
          ${data.address?.cep ? ` (CEP: ${data.address.cep})` : ''}
        </div>
        <div>
          <strong>Previsão de Coleta: </strong>
          ${data.pickupDate ? `${data.pickupDate.split('-').reverse().join('/')}${data.pickupTime ? ` às ${data.pickupTime}` : ' (horário a definir)'}` : 'A alinhar com transportadora'}
        </div>
      </div>
    `
    : `
      <div class="text-slate-700 space-y-1">
        <div>
          <strong>Local: </strong> Oficina Matriz Robusty — Fabricação e Instalação
        </div>
        <div>
          <strong>Agendamento: </strong>
          ${data.installationDate ? `${data.installationDate.split('-').reverse().join('/')} às ${data.installationTime || '14:00'}` : 'A agendar com a loja'}
        </div>
      </div>
    `

  const discountRow = data.budget.discountValue > 0
    ? `
      <div class="flex justify-between text-emerald-700 font-semibold">
        <span>Desconto (${data.budget.discountPercent}%):</span>
        <span class="font-mono">-${formatCurrency(data.budget.discountValue)}</span>
      </div>
    `
    : ''

  const fulfillmentCostRow = `
    <div class="flex justify-between text-slate-600">
      <span>${data.fulfillment === 'transportadora_envio' ? 'Frete Transportadora:' : 'Mão de Obra Instalação:'}</span>
      <span class="font-mono">
        ${formatCurrency(data.fulfillment === 'transportadora_envio' ? data.budget.freightValue : data.budget.installationValue)}
      </span>
    </div>
  `

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta Comercial ${formatOrderCode(data.orderNumber)} - Robusty Bagageiros</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }
    .font-mono {
      font-family: 'Geist Mono', monospace;
    }
    @media print {
      body {
        background: #ffffff;
        color: #000000;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
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
        margin: 10mm;
        size: A4 portrait;
      }
    }
  </style>
</head>
<body class="min-h-screen pb-12">
  <!-- Top Action Bar for Viewer (Hidden in Print) -->
  <header class="no-print sticky top-0 z-50 bg-slate-900 text-white shadow-md border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <img src="${ROBUSTY_LOGO_BASE64}" alt="Robusty" class="h-6 w-auto object-contain brightness-0 invert" />
      <span class="text-xs font-mono font-bold text-orange-400">${formatOrderCode(data.orderNumber)}</span>
      <span class="hidden sm:inline text-xs text-slate-300">| Proposta Comercial Oficial</span>
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

  <!-- Printable Sheet Container -->
  <main class="max-w-4xl mx-auto mt-6 sm:mt-8 p-6 sm:p-12 bg-white rounded-3xl border border-slate-200/90 shadow-xl sheet-container space-y-6">
    <!-- Document Header with Robusty Logo -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
      <div class="flex items-center gap-4">
        <img
          src="${ROBUSTY_LOGO_BASE64}"
          alt="Robusty Bagageiros"
          class="h-12 sm:h-14 w-auto object-contain shrink-0"
        />
        <div>
          <div class="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            ROBUSTY FABRICAÇÃO DE BAGAGEIROS AUTOMOTIVOS
          </div>
          <div class="text-[11px] text-slate-500 font-medium">
            Estruturas em Aço Reforçado • Pintura Eletrostática a Pó Epóxi
          </div>
        </div>
      </div>

      <div class="text-left sm:text-right text-xs">
        <div class="text-base sm:text-lg font-extrabold font-mono text-[#EA580C]">
          PROPOSTA ${formatOrderCode(data.orderNumber)}
        </div>
        <div class="text-slate-500 text-[11px]">
          Emissão: <strong class="text-slate-800">${todayStr}</strong>
        </div>
        <div class="text-slate-500 text-[11px]">
          Validade: <strong class="text-slate-800">${validUntilStr}</strong> (7 dias)
        </div>
        ${data.assignedTo ? `<div class="text-slate-500 text-[11px]">Responsável: <strong class="text-slate-800">${data.assignedTo}</strong></div>` : ''}
      </div>
    </div>

    <!-- Customer & Vehicle Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
        <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Dados do Cliente
        </div>
        <div class="text-sm font-bold text-slate-900">
          ${data.customerName || 'Cliente'}
        </div>
        <div class="text-slate-600 font-mono text-xs">
          Telefone / WhatsApp: <strong>${data.customerPhone || 'Não informado'}</strong>
        </div>
        ${data.customerEmail ? `<div class="text-slate-600 text-xs">Email: <strong>${data.customerEmail}</strong></div>` : ''}
      </div>

      <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
        <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Veículo de Aplicação
        </div>
        <div class="text-sm font-bold text-slate-900">
          ${data.vehicleModel || 'Utilitário'}
        </div>
        <div class="text-xs text-slate-600">
          Fixação original nas furações e calhas originais do teto (sem perfurações).
        </div>
        ${data.totalWeightKg ? `<div class="text-xs font-mono font-bold text-slate-700 pt-0.5">Peso Estimado da Carga: ${data.totalWeightKg} kg</div>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <div class="border border-slate-200 rounded-2xl overflow-hidden">
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold">
            <th class="py-2.5 px-4">Item / Descrição do Produto</th>
            <th class="py-2.5 px-3 text-center">Medidas / Peso</th>
            <th class="py-2.5 px-3 text-center">Qtd</th>
            <th class="py-2.5 px-3 text-right">Preço Unit.</th>
            <th class="py-2.5 px-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- Fulfillment Specifications -->
    <div class="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 text-xs space-y-2">
      <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
        ${data.fulfillment === 'transportadora_envio' ? 'Logística de Envio — Transportadora' : 'Instalação Física na Loja'}
      </div>
      ${fulfillmentSection}
    </div>

    <!-- Financial Summary -->
    <div class="flex flex-col sm:flex-row items-start sm:items-end justify-between pt-2 gap-4">
      <div class="text-xs text-slate-600 space-y-1 max-w-sm">
        <div class="font-bold text-slate-800">Condições Comerciais:</div>
        <div>• Parcelamento em até 10x sem juros no cartão de crédito.</div>
        <div>• Desconto especial para pagamento à vista no PIX.</div>
      </div>

      <div class="w-full sm:w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5">
        <div class="flex justify-between text-slate-600">
          <span>Subtotal Produtos:</span>
          <span class="font-mono">${formatCurrency(data.budget.subtotal)}</span>
        </div>
        ${discountRow}
        ${fulfillmentCostRow}
        <div class="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
          <span>Total da Proposta:</span>
          <span class="text-base text-[#EA580C] font-mono">${formatCurrency(data.budget.finalTotal)}</span>
        </div>
      </div>
    </div>

    <!-- Quality & Warranty Footer -->
    <div class="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center gap-3 text-xs text-emerald-950">
      <div class="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">✓</div>
      <div class="leading-snug">
        <strong>Garantia de 1 Ano Robusty:</strong> Todas as peças possuem garantia integral contra qualquer defeito de fabricação, fadiga de solda e fixação, garantindo total segurança para sua carga na estrada.
      </div>
    </div>

    <footer class="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
      Robusty Bagageiros Automotivos • Gestão Comercial & Operacional • CRM Robusty 2026
    </footer>
  </main>
</body>
</html>`
}
