import React, { useEffect } from 'react'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Trash2
} from 'lucide-react'

export type AlertModalType = 'warning' | 'danger' | 'success' | 'info'

export interface CustomAlertModalProps {
  isOpen: boolean
  onClose: () => void
  type?: AlertModalType
  title: string
  message: React.ReactNode | string
  details?: string
  primaryButtonText?: string
  onPrimaryAction?: () => void
  secondaryButtonText?: string
  onSecondaryAction?: () => void
  tertiaryButtonText?: string
  onTertiaryAction?: () => void
  isDangerAction?: boolean
}

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  isOpen,
  onClose,
  type = 'warning',
  title,
  message,
  details,
  primaryButtonText = 'Entendido',
  onPrimaryAction,
  secondaryButtonText,
  onSecondaryAction,
  tertiaryButtonText,
  onTertiaryAction,
  isDangerAction = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getIconAndStyle = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
          badgeBg: 'bg-rose-50 border-rose-200/80',
          primaryBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
          titleColor: 'text-slate-900',
        }
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          badgeBg: 'bg-emerald-50 border-emerald-200/80',
          primaryBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
          titleColor: 'text-slate-900',
        }
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-blue-600" />,
          badgeBg: 'bg-blue-50 border-blue-200/80',
          primaryBg: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20',
          titleColor: 'text-slate-900',
        }
      case 'warning':
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-[#EA580C]" />,
          badgeBg: 'bg-orange-50 border-orange-200/80',
          primaryBg: isDangerAction
            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
            : 'bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-orange-500/20',
          titleColor: 'text-slate-900',
        }
    }
  }

  const { icon, badgeBg, primaryBg, titleColor } = getIconAndStyle()

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Icon and Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${badgeBg}`}>
              {icon}
            </div>
            <div>
              <h3 className={`text-base font-bold ${titleColor} tracking-tight leading-snug`}>
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Body */}
        <div className="text-xs text-slate-600 leading-relaxed space-y-2">
          {typeof message === 'string' ? (
            <p>{message}</p>
          ) : (
            message
          )}

          {details && (
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-[11px] font-mono text-slate-700">
              {details}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-slate-100">
          {tertiaryButtonText && (
            <button
              type="button"
              onClick={() => {
                onTertiaryAction?.()
                onClose()
              }}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer mr-auto"
            >
              {tertiaryButtonText}
            </button>
          )}

          {secondaryButtonText && (
            <button
              type="button"
              onClick={() => {
                onSecondaryAction?.()
                onClose()
              }}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {secondaryButtonText}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (onPrimaryAction) {
                onPrimaryAction()
              } else {
                onClose()
              }
            }}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 text-center ${primaryBg}`}
          >
            {primaryButtonText}
          </button>
        </div>
      </div>
    </div>
  )
}
