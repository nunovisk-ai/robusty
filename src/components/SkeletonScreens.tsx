import React from 'react'

interface SkeletonBoxProps {
  className?: string
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({ className = '' }) => (
  <div aria-hidden="true" className={`skeleton-shimmer ${className}`} />
)

// ============================================================================
// 1. PIPELINE / KANBAN SKELETON
// ============================================================================
const KANBAN_COLUMN_STRIPES = [
  { color: '#6366F1', cards: 2 },
  { color: '#0EA5E9', cards: 3 },
  { color: '#2563EB', cards: 2 },
  { color: '#EA580C', cards: 3 },
  { color: '#F59E0B', cards: 2 },
  { color: '#10B981', cards: 2 },
]

export const KanbanSkeleton: React.FC = () => (
  <div className="flex-1 flex flex-col min-h-0 space-y-3" role="status" aria-label="Carregando pipeline">
    {/* Top Header & Pipeline Mode Switcher Skeleton */}
    <div className="bg-white rounded-2xl p-2.5 sm:px-4 sm:py-2.5 border border-slate-200/90 shadow-2xs shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-9 w-36 rounded-xl" />
        <SkeletonBox className="h-9 w-36 rounded-xl" />
      </div>

      <div className="flex items-center gap-2 flex-1 max-w-lg justify-end flex-wrap">
        <SkeletonBox className="h-8 w-40 rounded-xl" />
        <SkeletonBox className="h-8 flex-1 min-w-[170px] max-w-xs rounded-xl" />
        <SkeletonBox className="h-8 w-36 rounded-xl" />
      </div>
    </div>

    {/* Horizontal Columns Skeleton */}
    <div className="flex-1 flex gap-3 overflow-x-auto pb-1 kanban-scroll items-stretch min-h-0">
      {KANBAN_COLUMN_STRIPES.map((col, colIdx) => (
        <div
          key={colIdx}
          className="w-[290px] flex-shrink-0 bg-slate-100/90 rounded-2xl border border-slate-200/90 flex flex-col h-full max-h-full shadow-2xs overflow-hidden"
        >
          {/* Top Stripe */}
          <div className="h-1.5 w-full shrink-0 opacity-45" style={{ backgroundColor: col.color }} />

          {/* Column Header */}
          <div className="p-3 bg-white border-b border-slate-200/80 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full opacity-40" style={{ backgroundColor: col.color }} />
                <SkeletonBox className="h-3.5 w-28 rounded-md" />
              </div>
              <SkeletonBox className="h-4 w-7 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-3 w-10 rounded" />
              <SkeletonBox className="h-3.5 w-20 rounded" />
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="p-2 space-y-2.5 overflow-hidden flex-1">
            {Array.from({ length: col.cards }).map((_, cardIdx) => (
              <div
                key={cardIdx}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 space-y-3 shadow-2xs"
              >
                {/* Code + Origin Pill */}
                <div className="flex items-center justify-between gap-2">
                  <SkeletonBox className="h-3.5 w-14 rounded" />
                  <SkeletonBox className="h-5 w-20 rounded-full" />
                </div>

                {/* Vehicle Pill + Total Value */}
                <div className="flex items-center justify-between gap-2">
                  <SkeletonBox className="h-5 w-24 rounded-md" />
                  <SkeletonBox className="h-5 w-20 rounded-md" />
                </div>

                {/* Client Name */}
                <div className="space-y-1.5">
                  <SkeletonBox className="h-4 w-4/5 rounded" />
                  <SkeletonBox className="h-3 w-1/2 rounded" />
                </div>

                {/* Footer: Responsible + Social Dock */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <SkeletonBox className="h-4 w-4 rounded-full" />
                    <SkeletonBox className="h-3 w-16 rounded" />
                  </div>
                  <div className="flex items-center gap-1">
                    <SkeletonBox className="h-6 w-6 rounded-lg" />
                    <SkeletonBox className="h-6 w-6 rounded-lg" />
                    <SkeletonBox className="h-6 w-6 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

// ============================================================================
// 2. CATALOG SKELETONS
// ============================================================================
export const CatalogVehiclePillsSkeleton: React.FC = () => (
  <>
    {['w-24', 'w-28', 'w-32', 'w-24', 'w-36', 'w-28', 'w-32'].map((w, idx) => (
      <SkeletonBox key={idx} className={`h-8 ${w} rounded-full shrink-0`} />
    ))}
  </>
)

export const CatalogProductsGridSkeleton: React.FC<{ count?: number }> = ({ count = 9 }) => (
  <div
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    role="status"
    aria-label="Carregando catálogo de produtos"
  >
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-nexo flex flex-col justify-between space-y-4"
      >
        <div className="space-y-3">
          {/* Category Badge + Action Icons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-5 w-20 rounded-full" />
              <SkeletonBox className="h-4 w-16 rounded" />
            </div>
            <div className="flex items-center gap-1">
              <SkeletonBox className="h-7 w-7 rounded-lg" />
              <SkeletonBox className="h-7 w-7 rounded-lg" />
              <SkeletonBox className="h-7 w-7 rounded-lg" />
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-1.5">
            <SkeletonBox className="h-4 w-11/12 rounded" />
            <SkeletonBox className="h-4 w-2/3 rounded" />
          </div>

          {/* Specs Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            <SkeletonBox className="h-6 w-28 rounded-lg" />
            <SkeletonBox className="h-6 w-24 rounded-lg" />
            <SkeletonBox className="h-6 w-16 rounded-lg" />
          </div>
        </div>

        {/* Price Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
          <div className="space-y-1.5">
            <SkeletonBox className="h-3 w-16 rounded" />
            <SkeletonBox className="h-6 w-28 rounded-md" />
          </div>
          <div className="space-y-1.5 text-right">
            <SkeletonBox className="h-3 w-16 rounded ml-auto" />
            <SkeletonBox className="h-4 w-20 rounded ml-auto" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

// ============================================================================
// 3. ORDERS VIEW SKELETON
// ============================================================================
export const OrdersSkeleton: React.FC = () => (
  <div className="space-y-6" role="status" aria-label="Carregando pedidos">
    {/* Header Card */}
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-2">
        <SkeletonBox className="h-6 w-72 rounded-lg" />
        <SkeletonBox className="h-3.5 w-96 max-w-full rounded" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-9 w-24 rounded-full" />
        <SkeletonBox className="h-9 w-32 rounded-full" />
        <SkeletonBox className="h-9 w-24 rounded-full" />
      </div>
    </div>

    {/* Flow Legend Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[0, 1].map((idx) => (
        <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2.5">
          <SkeletonBox className="h-4 w-56 rounded" />
          <SkeletonBox className="h-3 w-full rounded" />
          <SkeletonBox className="h-3 w-5/6 rounded" />
          <SkeletonBox className="h-3 w-4/5 rounded" />
        </div>
      ))}
    </div>

    {/* Order Rows */}
    <div className="space-y-3">
      {[0, 1, 2, 3].map((idx) => (
        <div
          key={idx}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-nexo flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <SkeletonBox className="h-6 w-24 rounded-full" />
              <SkeletonBox className="h-6 w-36 rounded-full" />
              <SkeletonBox className="h-4 w-48 rounded" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <SkeletonBox className="h-3.5 w-28 rounded" />
              <SkeletonBox className="h-3.5 w-36 rounded" />
              <SkeletonBox className="h-3.5 w-32 rounded" />
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <SkeletonBox className="h-9 w-36 rounded-full" />
            <SkeletonBox className="h-9 w-32 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

// ============================================================================
// 4. CALENDAR / SCHEDULE SKELETON
// ============================================================================
export const CalendarSkeleton: React.FC = () => (
  <div className="space-y-6" role="status" aria-label="Carregando agenda">
    {/* Header + KPI Counters */}
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <SkeletonBox className="h-6 w-48 rounded-lg" />
          <SkeletonBox className="h-5 w-32 rounded-full" />
        </div>
        <SkeletonBox className="h-3.5 w-96 max-w-full rounded" />
      </div>

      <div className="flex items-center gap-3">
        <SkeletonBox className="h-14 w-40 rounded-xl" />
        <SkeletonBox className="h-14 w-44 rounded-xl" />
      </div>
    </div>

    {/* Control Bar */}
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-nexo flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      <SkeletonBox className="h-9 w-72 rounded-xl" />
      <SkeletonBox className="h-8 w-64 rounded-full" />
      <SkeletonBox className="h-8 w-56 rounded-full" />
    </div>

    {/* Date Navigation */}
    <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-nexo flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-8 w-8 rounded-xl" />
        <SkeletonBox className="h-8 w-16 rounded-xl" />
        <SkeletonBox className="h-8 w-8 rounded-xl" />
      </div>
      <SkeletonBox className="h-5 w-40 rounded-lg" />
      <SkeletonBox className="h-8 w-32 rounded-xl" />
    </div>

    {/* Month Calendar Grid */}
    <div className="bg-white rounded-2xl border border-slate-100 shadow-nexo overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 py-3 px-2 gap-2">
        {Array.from({ length: 7 }).map((_, idx) => (
          <SkeletonBox key={idx} className="h-3.5 w-14 mx-auto rounded" />
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {Array.from({ length: 35 }).map((_, idx) => (
          <div key={idx} className="min-h-[104px] p-2.5 space-y-2">
            <SkeletonBox className="h-4 w-6 rounded" />
            {(idx % 5 === 1 || idx % 7 === 3) && (
              <SkeletonBox className="h-5 w-full rounded-lg" />
            )}
            {idx % 9 === 2 && <SkeletonBox className="h-5 w-4/5 rounded-lg" />}
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ============================================================================
// 5. BUDGET BUILDER SKELETONS
// ============================================================================
export const BudgetSkeleton: React.FC = () => (
  <div className="space-y-6 max-w-7xl mx-auto pb-12" role="status" aria-label="Carregando orçamento">
    {/* Header Bar */}
    <div className="bg-white p-4 sm:px-6 rounded-2xl border border-slate-100 shadow-nexo flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-9 w-9 rounded-xl" />
        <div className="space-y-1.5">
          <SkeletonBox className="h-5 w-52 rounded-lg" />
          <SkeletonBox className="h-3 w-36 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-9 w-28 rounded-xl" />
        <SkeletonBox className="h-9 w-28 rounded-xl" />
      </div>
    </div>

    {/* Form Tabs */}
    <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-nexo flex gap-2 overflow-hidden">
      {[0, 1, 2, 3, 4].map((idx) => (
        <SkeletonBox key={idx} className="h-9 flex-1 min-w-[120px] rounded-xl" />
      ))}
    </div>

    {/* Main 2-Column Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-5">
        <SkeletonBox className="h-4 w-44 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="space-y-2">
              <SkeletonBox className="h-3 w-24 rounded" />
              <SkeletonBox className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-nexo space-y-4">
        <SkeletonBox className="h-4 w-36 rounded" />
        <div className="space-y-2.5 pt-2">
          <SkeletonBox className="h-4 w-full rounded" />
          <SkeletonBox className="h-4 w-5/6 rounded" />
          <SkeletonBox className="h-8 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
          <SkeletonBox className="h-11 w-full rounded-xl" />
          <SkeletonBox className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  </div>
)

export const BudgetVehiclePillsSkeleton: React.FC = () => (
  <>
    {['w-24', 'w-28', 'w-32', 'w-28', 'w-36', 'w-24', 'w-32', 'w-28'].map((w, idx) => (
      <SkeletonBox key={idx} className={`h-10 ${w} rounded-xl`} />
    ))}
  </>
)

export const BudgetProductListSkeleton: React.FC = () => (
  <div className="space-y-2" role="status" aria-label="Carregando produtos compatíveis">
    {[0, 1, 2, 3, 4].map((idx) => (
      <div
        key={idx}
        className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3"
      >
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-3.5 w-3/4 rounded" />
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-5 w-24 rounded" />
            <SkeletonBox className="h-5 w-16 rounded" />
            <SkeletonBox className="h-5 w-20 rounded" />
          </div>
        </div>
        <SkeletonBox className="h-8 w-24 rounded-lg shrink-0" />
      </div>
    ))}
  </div>
)
