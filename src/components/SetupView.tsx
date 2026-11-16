import React, { useState } from 'react'
import { 
  Database, 
  Server, 
  CheckCircle2, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink,
  ShieldAlert,
  ArrowRight
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
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-orange-500" />
          <span>Configurações: Supabase & VPS Robusty</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Ambiente híbrido: desenvolvimento contínuo no GitHub com validação via GitHub Pages e futura migração para VPS própria da Robusty.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supabase Status Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="font-bold text-sm text-white">Banco de Dados Supabase (Ativo)</h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              PostgreSQL 16
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                Supabase Public URL:
              </label>
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-slate-300">
                <span className="truncate">{config.url}</span>
                <button
                  onClick={() => copyText(config.url, setCopiedUrl)}
                  className="text-slate-400 hover:text-white ml-2"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                Publishable Key (Frontend):
              </label>
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-slate-300">
                <span>{config.keyPreview}</span>
                <button
                  onClick={() => copyText('sb_publishable_M392arFdTtMCD2fJ6mlg7g_hkCzzA5H', setCopiedKey)}
                  className="text-slate-400 hover:text-white ml-2"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenSqlModal}
              className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"
            >
              <Terminal className="w-4 h-4" />
              <span>Ver Script SQL de Migração (Tabelas & Catálogo)</span>
            </button>
          </div>
        </div>

        {/* VPS & Deployment Roadmap Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-orange-400" />
              <h2 className="font-bold text-sm text-white">Estratégia de Hospedagem & Migração</h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Fases 1 e 2
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <span>Etapa Atual: GitHub Pages (Validação Contínua)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Cada alteração enviada para o branch <code className="text-orange-300">main</code> é compilada automaticamente e publicada no GitHub Pages para você testar no computador ou celular.
              </p>
              <a
                href="https://nunovisk-ai.github.io/robusty/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:underline pt-1"
              >
                <span>Acessar link público: nunovisk-ai.github.io/robusty</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Futura Migração: VPS Própria da Robusty</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Após a validação de todas as fases, o código será empacotado em container Docker com Nginx para rodar na VPS oficial da empresa, apontando para o domínio próprio (ex: <code className="text-blue-300">crm.robusty.com.br</code>).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
