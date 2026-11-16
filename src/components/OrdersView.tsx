import React, { useState } from 'react'
import { Order, OrderStatus } from '../types'
import { 
  Truck, 
  Wrench, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  PackageCheck,
  CalendarCheck,
  Send
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
      case 'pedido_recebido':
        return <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">Pedido Recebido</span>
      case 'em_preparacao_loja':
        return <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs">Em Preparação (Loja)</span>
      case 'aguardando_coleta_transportadora':
        return <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs">Aguardando Coleta</span>
      case 'aguardando_instalacao_agendada':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">Instalação Agendada</span>
      case 'em_transporte_ou_instalacao':
        return <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs">Em Execução / Rota</span>
      case 'pedido_concluido':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">Pedido Concluído</span>
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs">{status}</span>
    }
  }

  const getNextStatus = (current: OrderStatus, type: string): OrderStatus => {
    if (type === 'transportadora_envio') {
      if (current === 'pedido_recebido') return 'em_preparacao_loja'
      if (current === 'em_preparacao_loja') return 'aguardando_coleta_transportadora'
      if (current === 'aguardando_coleta_transportadora') return 'em_transporte_ou_instalacao'
      if (current === 'em_transporte_ou_instalacao') return 'pedido_concluido'
    } else {
      if (current === 'pedido_recebido') return 'em_preparacao_loja'
      if (current === 'em_preparacao_loja') return 'aguardando_instalacao_agendada'
      if (current === 'aguardando_instalacao_agendada') return 'em_transporte_ou_instalacao'
      if (current === 'em_transporte_ou_instalacao') return 'pedido_concluido'
    }
    return current
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-orange-500" />
            <span>Funil Operacional de Pedidos (Igor & Loja)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão de expedição de mercadorias via transportadora e alinhamento de montagens na loja física.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'all' ? 'bg-orange-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            onClick={() => setFilterType('transportadora_envio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              filterType === 'transportadora_envio' ? 'bg-orange-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Transportadora ({transportOrders.length})</span>
          </button>
          <button
            onClick={() => setFilterType('instalacao_loja')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              filterType === 'instalacao_loja' ? 'bg-orange-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Instalação na Loja ({storeOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Operational Flow Legend Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Caminho A Box */}
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
            <Truck className="w-4 h-4" />
            <span>Caminho A: Entrega por Transportadora (Igor)</span>
          </div>
          <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
            <li>Norlando encaminha pedido aprovado para Igor e Loja</li>
            <li>Igor agenda coleta com a transportadora</li>
            <li>Loja prepara, embala e deixa pronto para coleta</li>
            <li>Igor providencia emissão e envio da Nota Fiscal (NF-e)</li>
            <li>Transportadora coleta e segue para entrega ao cliente</li>
          </ol>
        </div>

        {/* Caminho B Box */}
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            <Wrench className="w-4 h-4" />
            <span>Caminho B: Instalação na Loja Física (Loja)</span>
          </div>
          <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
            <li>Norlando comunica loja com data/hora e dados do veículo</li>
            <li>Loja organiza fila e prepara bagageiro para o veículo</li>
            <li>Cliente comparece e equipe executa a instalação física</li>
            <li>Se cliente necessitar de NF: Norlando solicita ao Igor</li>
            <li>Igor providencia a emissão da NF-e correspondente</li>
          </ol>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/30 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-sm">Nenhum pedido operacional em andamento.</p>
            <p className="text-xs text-slate-500 mt-1">
              Aprove uma venda no Funil de Vendas do Norlando para transformá-la em Pedido Operacional.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isTransport = order.fulfillment_type === 'transportadora_envio'
            return (
              <div
                key={order.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                      Pedido #{order.order_number}
                    </span>
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-slate-400">
                      Cliente: <strong className="text-white">{order.contact?.full_name}</strong> ({order.contact?.phone_e164})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      {isTransport ? <Truck className="w-3.5 h-3.5 text-blue-400" /> : <Wrench className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{isTransport ? 'Envio via Transportadora' : 'Instalação na Loja'}</span>
                    </span>

                    {order.shipping_carrier_name && (
                      <span className="text-slate-300">
                        Transportadora: <strong className="text-white">{order.shipping_carrier_name}</strong>
                      </span>
                    )}

                    {/* Invoice Status */}
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nota Fiscal: </span>
                      <strong className={
                        order.invoice_status === 'emitida_disponivel' ? 'text-emerald-400' :
                        order.invoice_status === 'solicitada_ao_igor' ? 'text-amber-400' : 'text-slate-500'
                      }>
                        {order.invoice_status === 'emitida_disponivel' ? 'Emitida' :
                         order.invoice_status === 'solicitada_ao_igor' ? 'Solicitada ao Igor' : 'Não Solicitada'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  {onToggleInvoiceRequest && order.invoice_status === 'nao_solicitada' && (
                    <button
                      onClick={() => onToggleInvoiceRequest(order.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-amber-400" />
                      <span>Solicitar NF ao Igor</span>
                    </button>
                  )}

                  {order.status !== 'pedido_concluido' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, getNextStatus(order.status, order.fulfillment_type))}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/10"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Avançar Etapa Operacional</span>
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
