import { useState } from 'react'
import { useTask, useTaskChecklist, useCreateChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem, useUpdateTask } from '@/hooks/useTasks'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate } from '@/utils/format'
import clsx from 'clsx'

const STATUS_COLORS = {
  pending:     'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  waiting:     'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  completed:   'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  cancelled:   'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pendiente' },
  { value: 'in_progress', label: 'En Proceso' },
  { value: 'waiting',     label: 'En Espera' },
  { value: 'completed',   label: 'Finalizado' },
  { value: 'cancelled',   label: 'Cancelado' },
]

export default function TaskDetailDrawer({ taskId, onEdit, onClose }) {
  const { data: task, isLoading } = useTask(taskId)
  const { data: checklistData, isLoading: loadingChecklist } = useTaskChecklist(taskId)
  const [newItem, setNewItem] = useState('')
  const [addingItem, setAddingItem] = useState(false)

  const createItem = useCreateChecklistItem(taskId)
  const updateItem = useUpdateChecklistItem(taskId)
  const deleteItem = useDeleteChecklistItem(taskId)
  const updateTask = useUpdateTask()

  const checklist = Array.isArray(checklistData) ? checklistData : (checklistData?.results || [])
  const today = new Date().toISOString().split('T')[0]

  const handleAddItem = (e) => {
    e.preventDefault()
    if (!newItem.trim()) return
    createItem.mutate({ text: newItem.trim(), order: checklist.length }, {
      onSuccess: () => { setNewItem(''); setAddingItem(false) }
    })
  }

  const toggleItem = (item) => {
    updateItem.mutate({ id: item.id, is_done: !item.is_done })
  }

  const handleStatusChange = (status) => {
    updateTask.mutate({ id: taskId, status }, {
      onSuccess: () => {}
    })
  }

  if (isLoading) return <div className="p-8 flex justify-center"><PageSpinner /></div>
  if (!task) return null

  const isOverdue = task.due_date && task.due_date < today && !['completed', 'cancelled'].includes(task.status)
  const checklistTotal = checklist.length
  const checklistDone = checklist.filter(i => i.is_done).length
  const progress = checklistTotal > 0 ? Math.round(checklistDone / checklistTotal * 100) : (task.progress_percent || 0)

  return (
    <div className="px-6 py-5 space-y-5">
      {/* Header */}
      <div className="-mx-6 -mt-5 px-6 py-4 bg-gray-50 dark:bg-surface-dark-secondary border-b border-gray-100 dark:border-gray-800 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">{task.name}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`badge text-xs ${STATUS_COLORS[task.status]}`}>
                {task.status_display || task.status}
              </span>
              {task.deal_name && (
                <span className="text-xs text-wolf-600 dark:text-wolf-400 font-medium">
                  ↗ {task.deal_name}
                </span>
              )}
              {task.project_name && (
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  📁 {task.project_name}
                </span>
              )}
            </div>
          </div>
          <button
            className="btn-secondary text-xs py-1 px-2.5 flex-shrink-0"
            onClick={onEdit}
          >
            Editar
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-5">

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-600 font-medium uppercase tracking-wide">Progreso</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500',
                progress === 100 ? 'bg-green-500' : 'bg-wolf-600'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          {checklistTotal > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
              {checklistDone} de {checklistTotal} ítems completados
            </p>
          )}
        </div>

        {/* Cambiar estado */}
        <div>
          <p className="section-title mb-2">Estado</p>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                disabled={updateTask.isPending}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                  task.status === opt.value
                    ? 'bg-wolf-600 text-white border-wolf-600'
                    : 'bg-transparent text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-800 hover:border-wolf-400 hover:text-wolf-600 dark:hover:text-wolf-400'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {task.assigned_to_name && (
            <>
              <span className="text-gray-400 dark:text-gray-600">Asignado a</span>
              <span className="text-gray-800 dark:text-gray-200 font-medium">{task.assigned_to_name}</span>
            </>
          )}
          {task.due_date && (
            <>
              <span className="text-gray-400 dark:text-gray-600">Vencimiento</span>
              <span className={clsx('font-medium', isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200')}>
                {formatDate(task.due_date)} {isOverdue && '⚠️'}
              </span>
            </>
          )}
          {task.priority && (
            <>
              <span className="text-gray-400 dark:text-gray-600">Prioridad</span>
              <span className="text-gray-800 dark:text-gray-200 capitalize">{task.priority}</span>
            </>
          )}
        </div>

        {/* Notas */}
        {task.notes && (
          <div>
            <p className="section-title mb-1.5">Notas</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl p-3">
              {task.notes}
            </p>
          </div>
        )}

        {/* Enlace */}
        {task.document_link && (
          <div>
            <p className="section-title mb-1.5">Enlace</p>
            <a
              href={task.document_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-wolf-600 dark:text-wolf-400 hover:underline bg-wolf-50 dark:bg-wolf-900/20 rounded-xl px-3 py-2 truncate"
            >
              🔗 {task.document_link}
            </a>
          </div>
        )}

        {/* Checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">
              Checklist {checklistTotal > 0 && `(${checklistDone}/${checklistTotal})`}
            </p>
            <button
              onClick={() => setAddingItem(true)}
              className="text-xs text-wolf-600 dark:text-wolf-400 hover:underline font-medium"
            >
              + Agregar ítem
            </button>
          </div>

          {loadingChecklist ? (
            <div className="flex justify-center py-4"><PageSpinner /></div>
          ) : (
            <ul className="space-y-1.5">
              {checklist.map(item => (
                <li key={item.id} className="flex items-center gap-2.5 group">
                  <button
                    onClick={() => toggleItem(item)}
                    className={clsx(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      item.is_done
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-700 hover:border-wolf-400'
                    )}
                  >
                    {item.is_done && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className={clsx(
                    'text-sm flex-1',
                    item.is_done
                      ? 'line-through text-gray-400 dark:text-gray-600'
                      : 'text-gray-700 dark:text-gray-300'
                  )}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => deleteItem.mutate(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 dark:text-gray-700 hover:text-red-500 transition-all rounded"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}

              {checklist.length === 0 && !addingItem && (
                <li className="text-xs text-gray-400 dark:text-gray-600 italic text-center py-2">
                  Sin ítems — agregá el primero
                </li>
              )}

              {addingItem && (
                <li>
                  <form onSubmit={handleAddItem} className="flex gap-2 mt-2">
                    <input
                      autoFocus
                      className="input text-sm py-1.5 flex-1"
                      placeholder="Descripción del ítem..."
                      value={newItem}
                      onChange={e => setNewItem(e.target.value)}
                    />
                    <button type="submit" className="btn-primary text-xs px-3" disabled={createItem.isPending}>
                      Agregar
                    </button>
                    <button type="button" className="btn-secondary text-xs px-3" onClick={() => { setAddingItem(false); setNewItem('') }}>
                      ✕
                    </button>
                  </form>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
