import React, { useState } from 'react'
import { 
  Building2, 
  Users, 
  Percent, 
  MessageSquare, 
  CheckCircle2, 
  Save, 
  Smartphone,
  Camera
} from 'lucide-react'

export const SettingsView: React.FC = () => {
  const [companyName, setCompanyName] = useState('Robusty Bagageiros e Acessórios Automotivos')
  const [companyPhone, setCompanyPhone] = useState('(11) 98765-4321')
  const [companyAddress, setCompanyAddress] = useState('Rua dos Utilitários, 1500 — São Paulo, SP')
  const [pixDiscount, setPixDiscount] = useState(10)
  const [boletoDiscount, setBoletoDiscount] = useState(5)
  const [maxManualDiscount, setMaxManualDiscount] = useState(10)
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Configurações da Empresa & Operação
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Parâmetros comerciais, equipe de atendimento e canais digitais integrados.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Configurações salvas!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-sm text-slate-900">Dados da Robusty</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Nome Fantasia / Razão Social:</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Telefone Principal de Atendimento:</label>
              <input
                type="text"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Endereço da Fábrica / Loja Física (Instalações):</label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Commercial Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Percent className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-sm text-slate-900">Políticas Comerciais & Descontos</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Desconto Padrão PIX:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={pixDiscount}
                  onChange={(e) => setPixDiscount(parseInt(e.target.value) || 0)}
                  className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold font-mono"
                />
                <span className="text-xs text-slate-500">% à vista</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Desconto Padrão Boleto:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={boletoDiscount}
                  onChange={(e) => setBoletoDiscount(parseInt(e.target.value) || 0)}
                  className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold font-mono"
                />
                <span className="text-xs text-slate-500">% à vista</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Alçada Máx. Vendedor:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={maxManualDiscount}
                  onChange={(e) => setMaxManualDiscount(parseInt(e.target.value) || 0)}
                  className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold font-mono"
                />
                <span className="text-xs text-slate-500">% manual</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team & Roles */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Users className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-sm text-slate-900">Usuários & Responsabilidades</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
              <div className="text-xs font-bold text-slate-900">Norlando</div>
              <div className="text-[11px] text-orange-600 font-semibold">Comercial / Vendas</div>
              <p className="text-[10px] text-slate-500">Atendimento WhatsApp, qualificação e elaboração de orçamentos.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
              <div className="text-xs font-bold text-slate-900">Igor</div>
              <div className="text-[11px] text-blue-600 font-semibold">Gestão, Logística & Fiscal</div>
              <p className="text-[10px] text-slate-500">Cotação de fretes, links de pagamento, transportadoras e notas fiscais.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
              <div className="text-xs font-bold text-slate-900">Loja Física</div>
              <div className="text-[11px] text-emerald-600 font-semibold">Instalação & Produção</div>
              <p className="text-[10px] text-slate-500">Execução de montagens em veículos e preparação para coleta.</p>
            </div>
          </div>
        </div>

        {/* Inbound Channels */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MessageSquare className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-sm text-slate-900">Canais de Entrada Conectados (Inbound)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">WhatsApp Comercial</div>
                  <div className="text-[11px] text-emerald-700 font-medium">Coexistence Ativo — App Nativo Norlando</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Online
              </span>
            </div>

            <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Instagram Direct</div>
                  <div className="text-[11px] text-pink-700 font-medium">Recepção de Mensagens Ativa</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
                Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </form>
    </div>
  )
}
