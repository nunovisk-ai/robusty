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
    // We copy the instructions or can copy the schema path
    navigator.clipboard.writeText(sqlInstruction)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold text-white">Script SQL de Inicialização do Supabase</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-slate-300 space-y-3">
          <p>
            O script de migração completo foi gerado no repositório no caminho:
            <br />
            <code className="text-orange-400 font-mono bg-slate-950 px-2 py-1 rounded mt-1 inline-block">
              supabase/migrations/20260216_initial_schema.sql
            </code>
          </p>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>Como executar no Supabase:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Acesse o <a href="https://supabase.com/dashboard/project/mcthzfppvzfjbiothycs/sql" target="_blank" rel="noreferrer" className="text-orange-400 underline inline-flex items-center gap-0.5">SQL Editor do seu projeto Supabase <ExternalLink className="w-3 h-3" /></a></li>
              <li>Abra o arquivo <code className="text-slate-300">20260216_initial_schema.sql</code></li>
              <li>Cole o conteúdo no editor e clique no botão verde <strong className="text-white">RUN</strong></li>
            </ol>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Nota: Mesmo antes de rodar o SQL no banco, a aplicação já carrega e opera normalmente em modo híbrido com os dados oficiais do catálogo salvos localmente.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-xs transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Caminho'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-lg text-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
