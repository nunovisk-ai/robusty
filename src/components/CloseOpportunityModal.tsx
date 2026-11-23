import React, { useState } from 'react'
import { AlertTriangle, X, Check } from 'lucide-react'

export const COMMON_LOSS_REASONS = [
  'Preço / Orçamento fora do esperado',
  'Comprou com concorrente',
  'Desistiu do projeto / Veículo vendido',
  'Prazo de entrega longo',
  'Sem retorno / Lead parou de responder',
  'Custo do frete inviável',
  'Outro motivo (especificar)'
] as const

interface CloseOpportunityModalProps {
  isOpen: boolean
  clientName: string
  orderCode?: string
  onClose: () => void
  onConfirm: (reason: string, details?: string) => Promise<void> | void
  isSubmitting?: boolean
}

export const CloseOpportunityModal: React.FC<CloseOpportunityModalProps> = ({
  isOpen,
  clientName,
  orderCode,
  onClose,
  onConfirm,
  isSubmitting = false
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [otherDetails, setOtherDetails] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConfirmAction = async () => {
    if (!selectedReason) {
      setErrorMsg('Por favor, selecione um motivo para o encerramento.')
      return
    }

    if (selectedReason === 'Outro motivo (especificar)' && !otherDetails.trim()) {
      setErrorMsg('Por favor, descreva o motivo do encerramento no campo abaixo.')
      return
    }

    setErrorMsg(null)
    const finalReason = selectedReason === 'Outro motivo (especificar)' ? 'Outro motivo' : selectedReason
    await onConfirm(finalReason, otherDetails.trim() || undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Encerrar Negociação
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {orderCode ? `${orderCode} — ` : ''}{clientName || 'Cliente'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explicação */}
        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          Esta oportunidade sairá do Funil de Vendas ativo e será enviada para a tela de 
          <strong className="text-slate-800"> Oportunidades Perdidas</strong>. O histórico e os dados permanecerão 
          salvos para futuro follow-up e reativação.
        </p>

        {/* Seleção do Motivo */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Qual foi o motivo principal do encerramento? <span className="text-rose-500">*</span>
          </label>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {COMMON_LOSS_REASONS.map((reason) => {
              const isSelected = selectedReason === reason
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setSelectedReason(reason)
                    setErrorMsg(null)
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs font-bold'
                      : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span>{reason}</span>
                  {isSelected && <Check className="w-4 h-4 text-rose-600 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Campo aberto caso "Outro motivo" ou observações adicionais */}
        {(selectedReason === 'Outro motivo (especificar)' || selectedReason) && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">
              {selectedReason === 'Outro motivo (especificar)'
                ? 'Descreva o motivo detalhado: *'
                : 'Observações adicionais (opcional):'}
            </label>
            <textarea
              rows={2}
              value={otherDetails}
              onChange={(e) => setOtherDetails(e.target.value)}
              placeholder="Ex: Cliente decidiu adiar para o próximo semestre..."
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-medium resize-none"
            />
          </div>
        )}

        {/* Feedback de erro */}
        {errorMsg && (
          <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirmAction()}
            disabled={isSubmitting || !selectedReason}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {isSubmitting ? 'Encerrando...' : 'Confirmar Encerramento'}
          </button>
        </div>
      </div>
    </div>
  )
}
