import React, { useState, useRef, useEffect } from 'react'
import { Clock, X, Check } from 'lucide-react'

export const DEFAULT_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
]

interface CustomTimePickerProps {
  value?: string
  onChange: (timeStr: string) => void
  placeholder?: string
  label?: string
  className?: string
  options?: string[]
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Selecione horário da coleta',
  label,
  className = '',
  options = DEFAULT_TIME_SLOTS
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const handleSelect = (timeStr: string) => {
    onChange(timeStr)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[11px] font-bold text-slate-600 block mb-1">
          {label}
        </label>
      )}

      {/* Input button trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 hover:bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-all focus-within:border-[#EA580C] focus-within:ring-2 focus-within:ring-[#EA580C]/10 shadow-2xs"
      >
        <div className="flex items-center gap-2 text-slate-800 min-w-0">
          <Clock className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
          <span className={`truncate font-mono ${value ? 'font-bold text-slate-900' : 'text-slate-400 font-sans'}`}>
            {value || placeholder}
          </span>
        </div>

        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0 ml-1"
            title="Limpar horário"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">hh:mm</span>
        )}
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 right-0 sm:left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-700">Selecione o horário:</span>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Opção Em branco */}
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full py-1.5 px-3 mb-2 text-xs rounded-lg transition-all text-left flex items-center justify-between cursor-pointer ${
              !value
                ? 'bg-orange-50 text-[#EA580C] font-semibold border border-orange-200/60'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
            }`}
          >
            <span className="italic">Em branco (sem horário)</span>
            {!value && <Check className="w-3.5 h-3.5 text-[#EA580C]" />}
          </button>

          {/* Grade de horários */}
          <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
            {options.map((slot) => {
              const isSelected = value === slot
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleSelect(slot)}
                  className={`py-1.5 px-2 text-xs font-mono rounded-lg transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#EA580C] text-white font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-orange-50 hover:text-[#EA580C]'
                  }`}
                >
                  {slot}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
