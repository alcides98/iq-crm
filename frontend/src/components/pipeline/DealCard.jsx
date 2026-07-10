import { formatGS, formatDate } from '@/utils/format'
import clsx from 'clsx'

const PRIORITY_STYLES = {
  urgente: 'border-l-red-500',
  alta: 'border-l-amber-400',
  normal: 'border-l-transparent',
}

export default function DealCard({ deal, isDragging }) {
  const hasTasks = (deal.tasks_count || 0) > 0

  const handleLinkClick = (e) => {
    e.stopPropagation()
    window.open(deal.document_link, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={clsx(
        'card p-3 mb-2 cursor-pointer border-l-4 transition-all select-none',
        PRIORITY_STYLES[deal.priority] || PRIORITY_STYLES.normal,
        isDragging ? 'shadow-lg rotate-1 opacity-90' : 'hover:shadow-md'
      )}
    >
      <p className="font-medium text-sm text-gray-900 leading-snug mb-1 line-clamp-2">
        {deal.name}
      </p>
      <p className="text-xs text-gray-500 mb-2 truncate">{deal.client_name}</p>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">
          {deal.amount ? formatGS(deal.amount) : <span className="text-gray-400 text-xs">Sin monto</span>}
        </span>
        <span className="text-xs text-gray-400">{deal.probability}%</span>
      </div>

      {/* Indicadores: tareas + enlace */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
        <div className="flex-1 min-w-0">
          {deal.next_followup && (
            <span className={clsx(
              'text-xs',
              deal.next_followup < new Date().toISOString().split('T')[0]
                ? 'text-red-500 font-medium'
                : 'text-gray-400 dark:text-gray-600'
            )}>
              {formatDate(deal.next_followup)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {hasTasks && (
            <span
              className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md px-1.5 py-0.5"
              title={`${deal.tasks_done ?? 0}/${deal.tasks_count} completadas`}
            >
              ✓ {deal.tasks_done ?? 0}/{deal.tasks_count}
            </span>
          )}
          {deal.document_link && (
            <button onClick={handleLinkClick} className="p-1 text-wolf-400 hover:text-wolf-600 rounded transition-colors" title="Documentación">
              🔗
            </button>
          )}
          {deal.assigned_to_name && (
            <span className="text-xs text-gray-400 dark:text-gray-600 truncate max-w-[60px]">
              {deal.assigned_to_name.split(' ')[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
