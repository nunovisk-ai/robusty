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
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#121212] tracking-tight">
            Configurações da Empresa & Operação
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Parâmetros comerciais, equipe de atendimento e canais digitais integrados.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-[#EA580C]" />
            <h3 className="font-extrabold text-sm text-[#121212]">Dados da Robusty</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Nome Fantasia / Razão Social:</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-full px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#EA580C] font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Telefone Principal de Atendimento:</label>
              <input
                type="text"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-full px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#EA580C] font-mono font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Endereço da Fábrica / Loja Física (Instalações):</label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-full px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#EA580C] font-medium"
              />
            </div>
          </div>
        </div>

        {/* Commercial Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Percent className="w-4 h-4 text-[#EA580C]" />
            <h3 className="font-extrabold text-sm text-[#121212]">Políticas Comerciais & Descontos</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Desconto Padrão PIX:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={pixDiscount}
                  onChange={(e) => setPixDiscount(parseInt(e.target.value) || 0)}
                  className="w-20 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-900 font-black font-mono text-center"
                />
                <span className="text-xs text-slate-500 font-bold">% à vista</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Desconto Padrão Boleto:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={boletoDiscount}
                  onChange={(e) => setBoletoDiscount(parseInt(e.target.value) || 0)}
                  className="w-20 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-900 font-black font-mono text-center"
                />
                <span className="text-xs text-slate-500 font-bold">% à vista</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Alçada Máx. Vendedor:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={maxManualDiscount}
                  onChange={(e) => setMaxManualDiscount(parseInt(e.target.value) || 0)}
                  className="w-20 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-900 font-black font-mono text-center"
                />
                <span className="text-xs text-slate-500 font-bold">% manual</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team & Roles (Nexo Agent Card Style from image_5.png) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Users className="w-4 h-4 text-[#EA580C]" />
            <h3 className="font-extrabold text-sm text-[#121212]">Usuários Autorizados & Responsabilidades</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Joao Ricardo */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-[#F8F9FA] space-y-2 hover:border-[#FED7AA] hover:shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                  J
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Admin
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-[#121212]">João Ricardo</div>
                <div className="text-[11px] text-purple-600 font-bold truncate">joaoricardo@grupomixfer.com.br</div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Diretoria, supervisão global, métricas financeiras e parametrização do CRM.
              </p>
            </div>

            {/* Norlando */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-[#F8F9FA] space-y-2 hover:border-[#FED7AA] hover:shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#EA580C] text-white font-black text-xs flex items-center justify-center">
                  N
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  online
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-[#121212]">Norlando Vendas</div>
                <div className="text-[11px] text-[#EA580C] font-bold truncate">norlando@ironparts.com.br</div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Atendimento WhatsApp e Instagram, qualificação e elaboração de orçamentos.
              </p>
            </div>

            {/* Igor */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-[#F8F9FA] space-y-2 hover:border-[#FED7AA] hover:shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  I
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  online
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-[#121212]">Igor Gestão</div>
                <div className="text-[11px] text-blue-600 font-bold truncate">igor@grupomixfer.com.br</div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Cotação de fretes com transportadoras, links de pagamento e emissão de notas fiscais.
              </p>
            </div>
          </div>
        </div>

        {/* Inbound Channels (Nexo Pill Style) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <MessageSquare className="w-4 h-4 text-[#EA580C]" />
            <h3 className="font-extrabold text-sm text-[#121212]">Canais de Entrada Conectados (Inbound)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#121212]">WhatsApp Comercial</div>
                  <div className="text-[11px] text-emerald-800 font-medium">Meta Coexistence Ativo — App Nativo Norlando</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Online
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-pink-200/70 bg-pink-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#121212]">Instagram Direct</div>
                  <div className="text-[11px] text-pink-800 font-medium">Recepção de Mensagens Ativa</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-pink-100 text-pink-800">
                Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-7 py-3 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-full shadow-md shadow-orange-500/25 transition-all cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </form>
    </div>
  )
}
