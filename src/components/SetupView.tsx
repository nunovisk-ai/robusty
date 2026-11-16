import React, { useState } from 'react'
import { 
  Database, 
  Server, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react'
import { getSupabaseConfig } from '../lib/supabase'

export const SetupView: React.FC<{ onOpenSqlModal: () => void }> = ({ onOpenSqlModal }) => {
  const config = getSupabaseConfig()
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  const copyText = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Configurações de Banco & Infraestrutura
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Online
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Ambiente conectado ao Supabase Cloud com validação contínua no GitHub Pages e futura migração para VPS da Robusty.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supabase Status Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-sm text-slate-900">Banco de Dados Supabase</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
              PostgreSQL 16
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Supabase URL (API Gateway):
              </label>
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-slate-700">
                <span className="truncate">{config.url}</span>
                <button
                  onClick={() => copyText(config.url, setCopiedUrl)}
                  className="text-slate-400 hover:text-slate-700 ml-2 cursor-pointer"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Publishable Key (Frontend):
              </label>
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-slate-700">
                <span>{config.keyPreview}</span>
                <button
                  onClick={() => copyText('sb_publishable_M392arFdTtMCD2fJ6mlg7g_hkCzzA5H', setCopiedKey)}
                  className="text-slate-400 hover:text-slate-700 ml-2 cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenSqlModal}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>Ver Script SQL de Migração (Tabelas & Catálogo)</span>
            </button>
          </div>
        </div>

        {/* VPS Roadmap Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-sm text-slate-900">Estratégia de Hospedagem</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
              CI/CD Ativo
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Etapa Atual: GitHub Pages</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Cada alteração enviada para o branch <code className="bg-slate-200 px-1 rounded text-slate-800">main</code> é compilada e atualizada no link de validação.
              </p>
              <a
                href="https://nunovisk-ai.github.io/robusty/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-orange-600 font-bold hover:underline pt-1"
              >
                <span>Acessar: nunovisk-ai.github.io/robusty</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Próxima Etapa: VPS Própria da Robusty</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Após homologar as fases de CRM e IA, migraremos a aplicação para container Docker na VPS da empresa com domínio oficial.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
