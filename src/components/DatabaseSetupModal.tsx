import React, { useState } from 'react'
import { X, Copy, Check, Terminal, ExternalLink } from 'lucide-react'

interface DatabaseSetupModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DatabaseSetupModal: React.FC<DatabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const sqlInstruction = `-- Siga estes passos simples no painel do Supabase:
-- 1. Acesse: https://supabase.com/dashboard/project/mcthzfppvzfjbiothycs/sql
-- 2. Cole este script completo e clique em "RUN".
-- Ele criará todas as tabelas, RLS e carregará os dados oficiais do catálogo de Fev/2026.

-- O arquivo completo está disponível em:
-- supabase/migrations/20260216_initial_schema.sql`

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlInstruction)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-slate-900">Script SQL de Inicialização do Supabase</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-slate-600 space-y-3">
          <p>
            O arquivo de migração SQL oficial com todas as tabelas e dados do catálogo de Fevereiro/2026 está salvo no repositório em:
            <br />
            <code className="text-orange-700 font-mono bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg mt-1 inline-block font-semibold">
              supabase/migrations/20260216_initial_schema.sql
            </code>
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>Como rodar em 30 segundos no seu Supabase:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>Abra o link do <a href="https://supabase.com/dashboard/project/mcthzfppvzfjbiothycs/sql" target="_blank" rel="noreferrer" className="text-orange-600 font-bold underline inline-flex items-center gap-0.5">SQL Editor do seu projeto Supabase <ExternalLink className="w-3 h-3" /></a></li>
              <li>Abra o arquivo <code className="text-slate-800 font-semibold">20260216_initial_schema.sql</code></li>
              <li>Cole o conteúdo no editor e clique no botão verde <strong className="text-slate-900">RUN</strong></li>
            </ol>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            * Nota: A aplicação já funciona perfeitamente em modo de desenvolvimento mesmo antes de rodar o SQL, utilizando o catálogo local estruturado.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Caminho'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
