import { ROBUSTY_LOGO_BASE64, MIXFER_LOGO_BASE64 } from '../assets/logoBase64'
import { formatOrderCode, formatCurrency } from './formatters'
import type { PaymentSplit, PersonType, DocumentType } from '../types'

export interface ProposalPayload {
  orderNumber: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  personType?: PersonType
  documentType?: DocumentType
  document?: string
  stateRegistration?: string
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
  cardInstallments?: number
  paymentSplits?: PaymentSplit[]
  shippingCarrierName?: string
  shippingQuoteNumber?: string
  shippingCarrierContact?: string
  deliveryLeadTime?: string
  productionLeadTime?: string
  shippingPackageDimensions?: string
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

  // Valor à vista: 5% a 10% de desconto sobre produtos à vista + frete
  const cashDiscount = data.budget.subtotal * 0.05
  const valorAVista = Math.max(0, data.budget.subtotal - cashDiscount + data.budget.freightValue)

  // Itens da Tabela com preenchimento para atingir pelo menos 8 linhas (como no modelo original)
  const totalRowsCount = Math.max(8, data.items.length)
  const rowsHtml: string[] = []

  for (let i = 0; i < totalRowsCount; i++) {
    const it = data.items[i]
    if (it) {
      const unitVal = it.product.base_price_10x
      const totalVal = unitVal * it.quantity
      rowsHtml.push(`
        <tr style="height: 26px;">
          <td style="border: 1px solid #000; text-align: center; font-weight: bold; padding: 4px 6px;">${it.quantity}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: 600;">
            ${it.product.name} ${it.product.dimensions ? `(${it.product.dimensions})` : ''}
          </td>
          <td style="border: 1px solid #000; text-align: right; padding: 4px 8px; font-family: monospace;">${formatCurrency(unitVal)}</td>
          <td style="border: 1px solid #000; text-align: right; font-weight: bold; padding: 4px 8px; font-family: monospace;">${formatCurrency(totalVal)}</td>
        </tr>
      `)
    } else {
      rowsHtml.push(`
        <tr style="height: 24px;">
          <td style="border: 1px solid #000; text-align: center; padding: 4px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 4px;">&nbsp;</td>
          <td style="border: 1px solid #000; text-align: right; padding: 4px 8px; font-family: monospace; color: #94a3b8;">-</td>
          <td style="border: 1px solid #000; text-align: right; padding: 4px 8px; font-family: monospace; color: #94a3b8;">R$ 0,00</td>
        </tr>
      `)
    }
  }

  // Seção de Formas de Pagamento
  let paymentDescriptionHtml = ''
  if (data.paymentSplits && data.paymentSplits.length > 0) {
    paymentDescriptionHtml = `
      <div style="margin-top: 4px; font-size: 11px; line-height: 1.4;">
        <strong>Pagamento Dividido / Misto Autorizado:</strong><br/>
        ${data.paymentSplits.map((sp, idx) => {
          const methodLabel = sp.method === 'pix'
            ? 'PIX (À vista)'
            : sp.method === 'cartao_credito'
            ? `Cartão de Crédito ${sp.installments ? `em ${sp.installments}x sem juros` : ''}`
            : sp.method === 'boleto'
            ? 'Boleto Bancário'
            : sp.method === 'dinheiro'
            ? 'Dinheiro / Espécie'
            : 'Outro'
          return `<span style="display: block;">• Parcela ${idx + 1}: <strong>${formatCurrency(sp.amount)}</strong> via ${methodLabel}</span>`
        }).join('')}
      </div>
    `
  } else {
    paymentDescriptionHtml = `
      <div style="margin-top: 2px; font-size: 11px;">
        À vista com desconto no PIX/Depósito ou em até 10x sem juros no cartão de crédito.
      </div>
    `
  }

  // Detalhes do Transporte
  const isEnvio = data.fulfillment === 'transportadora_envio'
  const shippingSectionHtml = isEnvio
    ? `
      <div style="font-size: 11px; line-height: 1.5; color: #000;">
        <div><strong>Transportadora:</strong> ${data.shippingCarrierName || 'A definir / Em cotação'} &nbsp;•&nbsp; <strong>Frete:</strong> ${formatCurrency(data.budget.freightValue)} &nbsp;•&nbsp; <strong>Cotação Nº:</strong> ${data.shippingQuoteNumber || 'Pendente'} &nbsp;•&nbsp; <strong>Contato:</strong> ${data.shippingCarrierContact || 'Central Transportadora'}</div>
        <div><strong>Prazo de entrega:</strong> ${data.deliveryLeadTime || '3 a 5 dias úteis'} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Prazo de produção:</strong> ${data.productionLeadTime || '7 a 10 dias úteis'}</div>
        <div><strong>Dimensões do volume para transporte:</strong> ${data.shippingPackageDimensions || 'Volume desmontado com proteções contra impacto'}</div>
      </div>
    `
    : `
      <div style="font-size: 11px; line-height: 1.5; color: #000;">
        <div><strong>Modalidade:</strong> Instalação na Matriz Robusty &nbsp;•&nbsp; <strong>Custo de Instalação:</strong> ${formatCurrency(data.budget.installationValue)}</div>
        <div><strong>Agendamento:</strong> ${data.installationDate ? `${data.installationDate.split('-').reverse().join('/')} às ${data.installationTime || '14:00'}` : 'A agendar com a oficina'}</div>
        <div><strong>Endereço de Montagem:</strong> Rua Dante Marteletti, Nº 122 - Jd. Maringá, São Paulo/SP</div>
      </div>
    `

  const customerDisplayName = data.tradeName
    ? `${data.customerName || 'Cliente'} (A/C: ${data.tradeName})`
    : (data.customerName || 'Cliente')

  const documentLabel = data.personType === 'juridica' ? 'CNPJ' : (data.documentType?.toUpperCase() || 'CPF/RG')
  const formattedDoc = data.document || 'Não informado'
  const stateReg = data.stateRegistration || 'ISENTO'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento ${formatOrderCode(data.orderNumber)} - Robusty & MixFer</title>
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000000;
      background-color: #f1f5f9;
      margin: 0;
      padding: 0;
    }
    .no-print {
      display: flex;
    }
    @media print {
      body {
        background-color: #ffffff;
      }
      .no-print {
        display: none !important;
      }
      .page-sheet {
        box-shadow: none !important;
        margin: 0 !important;
        padding: 6mm 10mm !important;
        max-width: 100% !important;
        border: none !important;
      }
      @page {
        size: A4 portrait;
        margin: 8mm;
      }
    }
    .page-sheet {
      max-width: 820px;
      margin: 24px auto;
      background: #ffffff;
      padding: 24px 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
      border-radius: 4px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
  </style>
</head>
<body>
  <!-- Top Action Bar (Oculta na Impressão/PDF) -->
  <header class="no-print" style="position: sticky; top: 0; z-index: 50; background: #0f172a; color: #fff; padding: 12px 20px; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-weight: 900; color: #ea580c; font-family: monospace; font-size: 14px;">${formatOrderCode(data.orderNumber)}</span>
      <span style="font-size: 12px; color: #94a3b8;">| Orçamento Oficial Robusty & MixFer</span>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <button onclick="window.print()" style="background: #ea580c; color: #fff; font-weight: bold; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px;">
        <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
        <span>Imprimir / Salvar em PDF</span>
      </button>
      <button onclick="window.close()" style="background: #334155; color: #cbd5e1; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 12px;">
        Fechar
      </button>
    </div>
  </header>

  <!-- Folha Oficial do Orçamento (A4 Exato) -->
  <main class="page-sheet">
    <!-- Cabeçalho Oficial: Robusty (Esquerda), Título (Centro) e MixFer (Direita) -->
    <table style="width: 100%; border: none; margin-bottom: 4px;">
      <tr>
        <td style="width: 30%; text-align: left; vertical-align: middle;">
          <img src="${ROBUSTY_LOGO_BASE64}" alt="Robusty Bagageiros" style="height: 48px; max-width: 180px; object-fit: contain;" />
        </td>
        <td style="width: 40%; text-align: center; vertical-align: middle;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #000;">ORÇAMENTO</h1>
        </td>
        <td style="width: 30%; text-align: right; vertical-align: middle;">
          <img src="${MIXFER_LOGO_BASE64}" alt="MixFer Soluções em Aço" style="height: 44px; max-width: 170px; object-fit: contain;" />
        </td>
      </tr>
    </table>

    <!-- Endereço da Empresa e Contato -->
    <div style="font-size: 11px; color: #000; margin-top: 2px; line-height: 1.35;">
      <div>Rua Dante Marteletti, Nº 122 - Jd. Maringá, São Paulo/SP - CEP 03525-150</div>
      <div>Tel.: (11)3774-4674 / (11)98703-7943</div>
    </div>

    <!-- Linha Divisória Superior -->
    <div style="border-bottom: 2px solid #000; margin-top: 6px; margin-bottom: 8px;"></div>

    <!-- Tabela de Metadados: Pedido, Data e Validade -->
    <table style="width: 100%; font-size: 11px; font-weight: bold; margin-bottom: 10px;">
      <tr>
        <td style="width: 30%; text-align: center;">
          PEDIDO<br/>
          <span style="font-weight: normal; font-size: 12px;">(${formatOrderCode(data.orderNumber)})</span>
        </td>
        <td style="width: 40%; text-align: center;">
          DATA DO ORÇAMENTO<br/>
          <span style="font-weight: normal; font-size: 12px;">(${todayStr})</span>
        </td>
        <td style="width: 30%; text-align: center;">
          VALIDADE DO ORÇAMENTO<br/>
          <span style="font-weight: normal; font-size: 12px;">(7 Dias Corridos)</span>
        </td>
      </tr>
    </table>

    <!-- Dados do Cliente e Vendedor (Formato Compacto Oficial) -->
    <table style="width: 100%; font-size: 11px; line-height: 1.45; border: none; margin-bottom: 8px;">
      <tr>
        <td style="width: 65%;"><strong>DESTINATARIO:</strong> ${customerDisplayName}</td>
        <td style="width: 35%;"><strong>VENDEDOR:</strong> ${data.assignedTo || 'Norlando'}</td>
      </tr>
      <tr>
        <td><strong>END:</strong> ${data.address?.street ? `${data.address.street}, ${data.address.number || 'S/N'}${data.address.complement ? ` - ${data.address.complement}` : ''}` : 'A combinar'}</td>
        <td><strong>BAIRRO:</strong> ${data.address?.neighborhood || '-'}</td>
      </tr>
      <tr>
        <td><strong>CEP:</strong> ${data.address?.cep || '-'} &nbsp;&nbsp;&nbsp;&nbsp; <strong>CIDADE:</strong> ${data.address?.city || '-'}</td>
        <td><strong>ESTADO:</strong> ${data.address?.state || '-'}</td>
      </tr>
      <tr>
        <td><strong>TEL:</strong> ${data.customerPhone || '-'} &nbsp;&nbsp;&nbsp;&nbsp; <strong>${documentLabel}:</strong> ${formattedDoc}</td>
        <td><strong>INSCRIÇÃO:</strong> ${stateReg}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>E-MAIL:</strong> ${data.customerEmail || '-'} &nbsp;&nbsp;&nbsp;&nbsp; <strong>VEÍCULO:</strong> ${data.vehicleModel || 'Utilitário'}</td>
      </tr>
    </table>

    <!-- Tabela Oficial de Produtos (Amarela / Dourada com Borda Preta) -->
    <table style="width: 100%; border: 2px solid #000; border-collapse: collapse; font-size: 11px; margin-top: 6px;">
      <thead>
        <tr style="background-color: #FFB800; color: #000; font-weight: 900; height: 32px;">
          <th style="border: 2px solid #000; width: 8%; text-align: center; padding: 4px;">QTD</th>
          <th style="border: 2px solid #000; width: 56%; text-align: center; padding: 4px;">DESCRIÇÃO DOS PRODUTOS</th>
          <th style="border: 2px solid #000; width: 18%; text-align: center; padding: 4px;">VALOR UNIDADE</th>
          <th style="border: 2px solid #000; width: 18%; text-align: center; padding: 4px;">VALOR TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml.join('')}
      </tbody>
    </table>

    <!-- Resumo dos Totais (Caixas com Borda Preta Alinhadas à Direita) -->
    <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
      <table style="width: 36%; border-collapse: collapse; font-size: 12px; font-weight: bold;">
        <tr style="border: 2px solid #000; height: 26px;">
          <td style="padding: 4px 8px; border-right: 2px solid #000; width: 55%; background: #fafafa;">VALOR TOTAL</td>
          <td style="padding: 4px 8px; text-align: right; font-family: monospace;">${formatCurrency(data.budget.finalTotal)}</td>
        </tr>
        <tr style="border: 2px solid #000; height: 26px;">
          <td style="padding: 4px 8px; border-right: 2px solid #000; background: #fafafa;">VALOR À VISTA</td>
          <td style="padding: 4px 8px; text-align: right; font-family: monospace; color: #000;">${formatCurrency(valorAVista)}</td>
        </tr>
        <tr style="border: 2px solid #000; height: 26px; border-top: 3px solid #000;">
          <td style="padding: 4px 8px; border-right: 2px solid #000; background: #fafafa;">VALOR DO FRETE</td>
          <td style="padding: 4px 8px; text-align: right; font-family: monospace;">${isEnvio ? formatCurrency(data.budget.freightValue) : '-'}</td>
        </tr>
      </table>
    </div>

    <!-- Detalhes do Transporte -->
    <div style="margin-top: 10px;">
      <div style="font-size: 12px; font-weight: bold; margin-bottom: 2px;">Detalhes do Transporte:</div>
      ${shippingSectionHtml}
    </div>

    <!-- Formas de Pagamento e Conta para Depósito / PIX -->
    <div style="margin-top: 8px;">
      <div style="font-size: 12px; font-weight: bold;">Formas de Pagamento:</div>
      ${paymentDescriptionHtml}

      <div style="margin-top: 6px; font-size: 11px; line-height: 1.4;">
        <strong>Conta para Depósito / PIX:</strong><br/>
        Mixfer Ind. e Exp. Ltda. / CNPJ - 13.563.446/0001-76 (Chave Pix)<br/>
        Banco Bradesco: Agencia 0298 Conta Corrente 217100-7
      </div>
    </div>

    <!-- Especificação da Cor do Bagageiro -->
    <div style="margin-top: 8px; font-size: 12px; font-weight: 900; letter-spacing: 0.5px;">
      *COR: ${(data.productColor || 'PRETO/BRANCO').toUpperCase()}*
    </div>

    <!-- Termos e Observações Oficiais com Borda Preta -->
    <div style="margin-top: 8px; border: 2px solid #000; padding: 8px 10px; font-size: 10px; line-height: 1.4; color: #000;">
      <div>• <strong>Garantia de 1 Ano:</strong> Todas as estruturas em aço possuem garantia total contra defeito de fabricação e fadiga de solda.</div>
      <div>• <strong>Pintura Eletrostática a Pó Epóxi:</strong> Alta resistência a intempéries e corrosão automotiva.</div>
      <div>• <strong>Fixação Segura:</strong> Fixado estritamente nas furações e calhas originais do veículo, sem necessidade de perfurar a lataria.</div>
      ${data.notes ? `<div style="margin-top: 4px;">• <strong>Observações Específicas:</strong> ${data.notes}</div>` : ''}
    </div>

    <!-- Rodapé -->
    <div style="margin-top: 10px; text-align: center; font-size: 9px; color: #64748b;">
      Robusty Bagageiros Automotivos & MixFer Soluções em Aço • Proposta Comercial Oficial • ${todayStr}
    </div>
  </main>
</body>
</html>`
}
