import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Clock, X, Check, ChevronDown, Search } from 'lucide-react'

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
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
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
    setSearchQuery('')
  }

  const handleSelect = (timeStr: string) => {
    onChange(timeStr)
    setIsOpen(false)
    setSearchQuery('')
  }

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options
    const q = searchQuery.trim().toLowerCase()
    return options.filter((slot) => slot.toLowerCase().includes(q))
  }, [options, searchQuery])

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[11px] font-bold text-slate-600 block mb-1">
          {label}
        </label>
      )}

      {/* Input button trigger (Combobox) */}
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

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Limpar horário"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">hh:mm</span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#EA580C]' : ''}`} />
        </div>
      </div>

      {/* Popover Combobox (1 coluna) */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 left-0 w-full min-w-[200px] bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2.5 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Campo de Busca Rápida */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar horário (ex: 14)..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:border-[#EA580C]"
              autoFocus
            />
          </div>

          <div className="space-y-0.5 max-h-56 overflow-y-auto pr-0.5">
            {/* Opção Em branco (1 coluna) */}
            {(!searchQuery || 'em branco'.includes(searchQuery.toLowerCase())) && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full py-1.5 px-3 text-xs rounded-lg transition-all text-left flex items-center justify-between cursor-pointer ${
                  !value
                    ? 'bg-orange-50 text-[#EA580C] font-semibold border border-orange-200/60'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <span className="italic">Em branco (sem horário)</span>
                {!value && <Check className="w-3.5 h-3.5 text-[#EA580C]" />}
              </button>
            )}

            {/* Lista de horários em 1 coluna */}
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400 italic">
                Nenhum horário correspondente
              </div>
            ) : (
              filteredOptions.map((slot) => {
                const isSelected = value === slot
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSelect(slot)}
                    className={`w-full py-1.5 px-3 text-xs font-mono rounded-lg transition-all text-left flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#EA580C] text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-orange-50 hover:text-[#EA580C]'
                    }`}
                  >
                    <span>{slot}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
