import React, { useState } from 'react'
import type { Order, OrderStatus } from '../types'
import { 
  Truck, 
  Wrench, 
  FileText, 
  CheckCircle, 
  PackageCheck
} from 'lucide-react'

interface OrdersViewProps {
  orders: Order[]
  onUpdateOrderStatus: (orderId: string, nextStatus: OrderStatus) => void
  onToggleInvoiceRequest?: (orderId: string) => void
}

export const OrdersView: React.FC<OrdersViewProps> = ({ 
  orders, 
  onUpdateOrderStatus,
  onToggleInvoiceRequest 
}) => {
  const [filterType, setFilterType] = useState<'all' | 'transportadora_envio' | 'instalacao_loja'>('all')

  const filteredOrders = orders.filter((o) => {
    if (filterType !== 'all' && o.fulfillment_type !== filterType) return false
    return true
  })

  const transportOrders = orders.filter((o) => o.fulfillment_type === 'transportadora_envio')
  const storeOrders = orders.filter((o) => o.fulfillment_type === 'instalacao_loja')

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pedido_gerado':
      case 'pedido_recebido':
        return <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-bold">Pedido Gerado</span>
      case 'em_preparacao':
      case 'em_preparacao_loja':
        return <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 text-xs font-bold">Em Preparação</span>
      case 'aguardando_coleta_instalacao':
      case 'aguardando_coleta_transportadora':
      case 'aguardando_instalacao_agendada':
        return <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200/60 text-xs font-bold">Aguardando Coleta/Instalação</span>
      case 'em_entrega_instalacao':
      case 'em_transporte_ou_instalacao':
        return <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/60 text-xs font-bold">Em Entrega/Instalação</span>
      case 'pedido_concluido':
        return <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold">Pedido Concluído</span>
      case 'pedido_cancelado':
        return <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 text-xs font-bold">Pedido Cancelado</span>
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">{status}</span>
    }
  }

  const getNextStatus = (current: OrderStatus): OrderStatus => {
    const sequence: OrderStatus[] = [
      'pedido_gerado',
      'em_preparacao',
      'aguardando_coleta_instalacao',
      'em_entrega_instalacao',
      'pedido_concluido'
    ]
    let normalized = current
    if (current === 'pedido_recebido') normalized = 'pedido_gerado'
    if (current === 'em_preparacao_loja') normalized = 'em_preparacao'
    if (current === 'aguardando_coleta_transportadora' || current === 'aguardando_instalacao_agendada') normalized = 'aguardando_coleta_instalacao'
    if (current === 'em_transporte_ou_instalacao' || current === 'aguardando_emissao_nf') normalized = 'em_entrega_instalacao'

    const idx = sequence.indexOf(normalized)
    if (idx !== -1 && idx < sequence.length - 1) {
      return sequence[idx + 1]
    }
    return current
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-[#121212] tracking-tight">
              Funil Operacional de Pedidos (Igor & Loja)
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Acompanhe o faturamento, preparação na loja física, coleta de transportadora e emissão de notas fiscais.
          </p>
        </div>

        {/* Filter buttons (Pills) */}
        <div className="flex items-center gap-1.5 bg-[#F8F9FA] p-1.5 rounded-full border border-slate-200/60 self-start md:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'all' ? 'bg-[#EA580C] text-white shadow-sm shadow-orange-500/20' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            onClick={() => setFilterType('transportadora_envio')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'transportadora_envio' ? 'bg-[#EA580C] text-white shadow-sm shadow-orange-500/20' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Transportadora ({transportOrders.length})</span>
          </button>
          <button
            onClick={() => setFilterType('instalacao_loja')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'instalacao_loja' ? 'bg-[#EA580C] text-white shadow-sm shadow-orange-500/20' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Loja ({storeOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Operational Flow Legend Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200/60 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Caminho A: Envio por Transportadora (Igor)</span>
          </div>
          <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside font-medium">
            <li>Norlando encaminha pedido após venda ganha para Igor e Loja</li>
            <li>Igor agenda a coleta com a transportadora</li>
            <li>Loja prepara e embala o bagageiro para despacho</li>
            <li>Igor providencia e anexa a Nota Fiscal eletrônica (NF-e)</li>
            <li>Transportadora coleta na loja e segue para entrega</li>
          </ol>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
            <Wrench className="w-4 h-4 text-emerald-600" />
            <span>Caminho B: Instalação na Loja Física (Loja)</span>
          </div>
          <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside font-medium">
            <li>Norlando comunica a loja com dados do veículo e agendamento</li>
            <li>Loja separa o produto e reserva a baia de montagem</li>
            <li>Equipe executa a instalação física no veículo</li>
            <li>Se o cliente necessitar de NF-e: Norlando solicita ao Igor</li>
            <li>Igor providencia e envia a nota fiscal de serviço/venda</li>
          </ol>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-nexo">
            <p className="text-slate-500 text-sm font-bold">Nenhum pedido operacional nesta visualização.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isTransport = order.fulfillment_type === 'transportadora_envio'
            return (
              <div
                key={order.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-[#FED7AA] hover:shadow-nexo-hover transition-all shadow-nexo flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                      Pedido #{order.order_number}
                    </span>
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-slate-600 font-medium">
                      Cliente: <strong className="text-[#121212] font-bold">{order.contact?.full_name}</strong> ({order.contact?.phone_e164})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      {isTransport ? <Truck className="w-3.5 h-3.5 text-blue-600" /> : <Wrench className="w-3.5 h-3.5 text-emerald-600" />}
                      <span className="font-bold text-slate-700">{isTransport ? 'Transportadora' : 'Instalação na Loja'}</span>
                    </span>

                    {order.shipping_carrier_name && (
                      <span className="text-slate-600">
                        Transportadora: <strong className="text-slate-800">{order.shipping_carrier_name}</strong>
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Nota Fiscal: </span>
                      <strong className={
                        order.invoice_status === 'emitida_disponivel' ? 'text-emerald-700' :
                        order.invoice_status === 'solicitada_ao_igor' ? 'text-amber-700' : 'text-slate-400'
                      }>
                        {order.invoice_status === 'emitida_disponivel' ? 'Emitida' :
                         order.invoice_status === 'solicitada_ao_igor' ? 'Solicitada ao Igor' : 'Não Solicitada'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-auto">
                  {onToggleInvoiceRequest && order.invoice_status === 'nao_solicitada' && (
                    <button
                      onClick={() => onToggleInvoiceRequest(order.id)}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>Solicitar NF ao Igor</span>
                    </button>
                  )}

                  {order.status !== 'pedido_concluido' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, getNextStatus(order.status))}
                      className="px-5 py-2 rounded-full text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Avançar Etapa</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
