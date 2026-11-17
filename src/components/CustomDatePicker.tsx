import React, { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface CustomDatePickerProps {
  value?: string // YYYY-MM-DD
  onChange: (dateStr: string) => void
  placeholder?: string
  label?: string
  className?: string
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const WEEKDAY_NAMES_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Selecione a data',
  label,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Current viewed month & year in popover
  const initialDate = value ? new Date(value + 'T12:00:00') : new Date()
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth())

  // Keep view in sync when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T12:00:00')
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
      }
    }
  }, [value])

  // Close when clicking outside
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

  // Month navigation
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  // Days in month calculation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  const handleSelectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const formatted = `${viewYear}-${m}-${d}`
    onChange(formatted)
    setIsOpen(false)
  }

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation()
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    setIsOpen(false)
  }

  const handleSetTomorrow = (e: React.MouseEvent) => {
    e.stopPropagation()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const y = tomorrow.getFullYear()
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const d = String(tomorrow.getDate()).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
    setViewYear(tomorrow.getFullYear())
    setViewMonth(tomorrow.getMonth())
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  // Format display text (e.g. 19/02/2026)
  const getDisplayText = () => {
    if (!value) return ''
    const parts = value.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return value
  }

  const todayStr = (() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  })()

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
        <div className="flex items-center gap-2 text-slate-800">
          <CalendarIcon className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
          <span className={`font-mono ${value ? 'font-bold text-slate-900' : 'text-slate-400 font-sans'}`}>
            {getDisplayText() || placeholder}
          </span>
        </div>

        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
            title="Limpar data"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">dd/mm/aaaa</span>
        )}
      </div>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 left-0 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3.5 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:text-[#EA580C] hover:bg-orange-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold text-slate-900">
              {MONTH_NAMES_PT[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:text-[#EA580C] hover:bg-orange-50 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAY_NAMES_PT.map((w) => (
              <span key={w} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-0.5">
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank padding for first week */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1
              const mStr = String(viewMonth + 1).padStart(2, '0')
              const dStr = String(day).padStart(2, '0')
              const dateStr = `${viewYear}-${mStr}-${dStr}`

              const isSelected = value === dateStr
              const isToday = todayStr === dateStr

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#EA580C] text-white font-bold shadow-xs'
                      : isToday
                      ? 'bg-orange-50 text-[#EA580C] font-bold border border-orange-200'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Quick preset buttons */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleSetToday}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-orange-50 hover:text-[#EA580C] text-slate-700 font-medium transition-colors cursor-pointer"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={handleSetTomorrow}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-orange-50 hover:text-[#EA580C] text-slate-700 font-medium transition-colors cursor-pointer"
              >
                Amanhã
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
