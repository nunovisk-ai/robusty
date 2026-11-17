import React, { useState } from 'react'
import type { AttachedDocument } from '../types'
import {
  X,
  Printer,
  Copy,
  Check,
  Paperclip,
  ShieldCheck,
  Truck,
  Wrench,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Weight,
  Download
} from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa6'

export interface CommercialProposalModalProps {
  isOpen: boolean
  onClose: () => void
  onAttachProposal?: (doc: AttachedDocument) => void
  data: {
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
  }
}

export const CommercialProposalModal: React.FC<CommercialProposalModalProps> = ({
  isOpen,
  onClose,
  onAttachProposal,
  data
}) => {
  const [copied, setCopied] = useState(false)
  const [attached, setAttached] = useState(false)

  if (!isOpen) return null

  const todayStr = new Date().toLocaleDateString('pt-BR')
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 7)
  const validUntilStr = validUntil.toLocaleDateString('pt-BR')

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadProposalDocument = () => {
    const printableElement = document.getElementById('commercial-proposal-printable')
    if (!printableElement) return

    const sanitizedName = (data.customerName || 'Cliente').trim().replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚãõÃÕâêîôûÂÊÎÔÛçÇ_-]/g, '_')
    const fileName = `Proposta_ROB-${data.orderNumber}_${sanitizedName}.html`

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Proposta Comercial ROB-${data.orderNumber} - Robusty Bagageiros</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Urbanist', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #ffffff; color: #1e293b; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    @media print {
      @page { margin: 12mm; size: A4; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body class="p-8 max-w-4xl mx-auto">
  ${printableElement.innerHTML}
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleAttachToOrder = () => {
    if (onAttachProposal) {
      const doc: AttachedDocument = {
        id: `doc-prop-${Date.now()}`,
        name: `Proposta_Comercial_ROB-${data.orderNumber}_${data.customerName.trim().replace(/\s+/g, '_') || 'Cliente'}.pdf`,
        type: 'orcamento_pdf',
        file_size: '185 KB',
        uploaded_at: new Date().toISOString()
      }
      onAttachProposal(doc)
      setAttached(true)
      setTimeout(() => setAttached(false), 3000)
    }
  }

  const handleCopyWhatsApp = () => {
    const lines = [
      `*PROPOSTA COMERCIAL — ROBUSTY BAGAGEIROS*`,
      `*Proposta:* #ROB-${data.orderNumber}`,
      `*Cliente:* ${data.customerName || 'Cliente'}`,
      `*Veículo:* ${data.vehicleModel || 'Utilitário'}`,
      `*Data de Emissão:* ${todayStr} (Válido até ${validUntilStr})`,
      ``,
      `*ITENS DA PROPOSTA:*`,
      ...data.items.map(
        (it) =>
          `• ${it.quantity}x ${it.product.name}${it.product.dimensions ? ` (${it.product.dimensions})` : ''} - ${formatCurrency(it.product.base_price_10x * it.quantity)}`
      ),
      ``,
      data.fulfillment === 'transportadora_envio'
        ? `*Entrega:* Envio via Transportadora (${formatCurrency(data.budget.freightValue)})\n*Destino:* ${data.address?.city || 'A definir'}/${data.address?.state || ''} - CEP: ${data.address?.cep || ''}\n*Peso Total da Carga:* ${data.totalWeightKg || 0} kg`
        : `*Atendimento:* Instalação na Loja Física (${formatCurrency(data.budget.installationValue)})\n*Agendamento:* ${data.installationDate ? data.installationDate.split('-').reverse().join('/') : 'A combinar'} às ${data.installationTime || '14:00'}`,
      ``,
      `*RESUMO FINANCEIRO:*`,
      `• Subtotal Produtos: ${formatCurrency(data.budget.subtotal)}`,
      data.budget.discountValue > 0 ? `• Desconto Especial (${data.budget.discountPercent}%): -${formatCurrency(data.budget.discountValue)}` : '',
      data.fulfillment === 'transportadora_envio' ? `• Frete: ${formatCurrency(data.budget.freightValue)}` : `• Instalação: ${formatCurrency(data.budget.installationValue)}`,
      `*VALOR TOTAL:* ${formatCurrency(data.budget.finalTotal)}`,
      ``,
      `*CONDIÇÕES DE PAGAMENTO:*`,
      `• À vista no PIX (com desconto aplicado)`,
      `• Cartão de Crédito em até 10x sem juros`,
      ``,
      `*GARANTIA ROBUSTY:* 1 ano contra qualquer defeito de fabricação ou estrutura.`,
      ``,
      `Ficamos à disposição para confirmar o pedido e providenciar o envio/instalação!`
    ].filter(Boolean)

    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-[#EA580C] border border-orange-200">
              Proposta Comercial Oficial
            </span>
            <span className="text-xs font-mono font-bold text-slate-700">
              #ROB-{data.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWhatsApp}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-200 hover:border-[#25D366] text-slate-700 hover:text-[#25D366] bg-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#25D366]" /> : <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />}
              <span>{copied ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
            </button>

            <button
              onClick={handleAttachToOrder}
              disabled={attached}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-200 hover:border-slate-400 text-slate-700 bg-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60"
            >
              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
              <span>{attached ? 'Anexado aos Documentos!' : 'Anexar ao Pedido'}</span>
            </button>

            <button
              onClick={handleDownloadProposalDocument}
              title="Baixar proposta em documento autônomo formatado"
              className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-orange-200 hover:border-[#EA580C] text-[#EA580C] hover:bg-orange-50 bg-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Proposta</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-orange-500/20 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div id="commercial-proposal-printable" className="p-8 sm:p-12 overflow-y-auto space-y-6 text-slate-800 font-sans print:p-0 print:m-0">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div className="flex items-center gap-4">
              <img
                src={`${import.meta.env.BASE_URL}robusty-logo.png`}
                alt="Robusty"
                className="h-12 w-auto object-contain"
              />
              <div>
                <div className="text-sm font-bold text-slate-900 tracking-tight">
                  ROBUSTY FABRICAÇÃO DE BAGAGEIROS AUTOMOTIVOS
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Estruturas em Aço Reforçado • Pintura Eletrostática a Pó Epóxi
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs">
              <div className="text-base font-bold font-mono text-[#EA580C]">
                PROPOSTA #ROB-{data.orderNumber}
              </div>
              <div className="text-slate-500 text-[11px]">
                Emissão: <strong className="text-slate-800">{todayStr}</strong>
              </div>
              <div className="text-slate-500 text-[11px]">
                Validade: <strong className="text-slate-800">{validUntilStr}</strong> (7 dias)
              </div>
            </div>
          </div>

          {/* Customer & Vehicle Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Dados do Cliente
              </div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{data.customerName || 'Cliente'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 font-mono text-xs">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{data.customerPhone || 'Sem telefone'}</span>
              </div>
              {data.customerEmail && (
                <div className="flex items-center gap-1.5 text-slate-600 text-xs truncate">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{data.customerEmail}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Veículo de Aplicação
              </div>
              <div className="text-sm font-bold text-slate-900">
                {data.vehicleModel || 'Utilitário'}
              </div>
              <div className="text-xs text-slate-600">
                Fixação original nas furações e calhas originais do teto (sem perfurações).
              </div>
              {data.totalWeightKg && (
                <div className="text-xs font-mono font-bold text-slate-700 flex items-center gap-1 pt-0.5">
                  <Weight className="w-3 h-3 text-slate-400" />
                  <span>Peso Estimado da Carga: {data.totalWeightKg} kg</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-4">Item / Descrição do Produto</th>
                  <th className="py-2.5 px-3 text-center">Medidas / Peso</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      Nenhum produto adicionado ao orçamento.
                    </td>
                  </tr>
                ) : (
                  data.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {it.product.name}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-mono text-[11px]">
                        {it.product.dimensions || 'Padrão'} {it.product.weight_kg ? `• ${it.product.weight_kg}kg` : ''}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {it.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 font-mono">
                        {formatCurrency(it.product.base_price_10x)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(it.product.base_price_10x * it.quantity)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Fulfillment Specifications */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 text-xs space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              {data.fulfillment === 'transportadora_envio' ? <Truck className="w-3.5 h-3.5 text-sky-600" /> : <Wrench className="w-3.5 h-3.5 text-purple-600" />}
              <span>{data.fulfillment === 'transportadora_envio' ? 'Logística de Envio — Transportadora' : 'Instalação Física na Loja'}</span>
            </div>

            {data.fulfillment === 'transportadora_envio' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div>
                  <strong>Destino: </strong>
                  {data.address?.street ? `${data.address.street}, ${data.address.number || 'S/N'}` : 'Endereço a confirmar'}
                  {data.address?.city && ` — ${data.address.city}/${data.address.state}`}
                  {data.address?.cep && ` (CEP: ${data.address.cep})`}
                </div>
                <div>
                  <strong>Previsão de Coleta: </strong>
                  {data.pickupDate ? `${data.pickupDate.split('-').reverse().join('/')} às ${data.pickupTime || '10:00'}` : 'A alinhar com transportadora'}
                </div>
              </div>
            ) : (
              <div className="text-slate-700 space-y-1">
                <div>
                  <strong>Local: </strong> Oficina Matriz Robusty — Fabricação e Instalação
                </div>
                <div>
                  <strong>Agendamento: </strong>
                  {data.installationDate ? `${data.installationDate.split('-').reverse().join('/')} às ${data.installationTime || '14:00'}` : 'A agendar com a loja'}
                </div>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between pt-2 gap-4">
            <div className="text-xs text-slate-600 space-y-1 max-w-sm">
              <div className="font-bold text-slate-800">Condições Comerciais:</div>
              <div>• Parcelamento em até 10x sem juros no cartão de crédito.</div>
              <div>• Desconto especial para pagamento à vista no PIX.</div>
            </div>

            <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produtos:</span>
                <span className="font-mono">{formatCurrency(data.budget.subtotal)}</span>
              </div>
              {data.budget.discountValue > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Desconto ({data.budget.discountPercent}%):</span>
                  <span className="font-mono">-{formatCurrency(data.budget.discountValue)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>{data.fulfillment === 'transportadora_envio' ? 'Frete Transportadora:' : 'Mão de Obra Instalação:'}</span>
                <span className="font-mono">
                  {formatCurrency(data.fulfillment === 'transportadora_envio' ? data.budget.freightValue : data.budget.installationValue)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Total da Proposta:</span>
                <span className="text-base text-[#EA580C] font-mono">{formatCurrency(data.budget.finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Quality & Warranty Footer */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl flex items-center gap-3 text-xs text-emerald-950">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="leading-snug">
              <strong>Garantia de 1 Ano Robusty:</strong> Todas as peças possuem garantia integral contra qualquer defeito de fabricação, fadiga de solda e fixação, garantindo total segurança para sua carga na estrada.
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Robusty Bagageiros Automotivos • Gestão Comercial & Operacional • CRM Robusty 2026
          </div>
        </div>
      </div>
    </div>
  )
}
