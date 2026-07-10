import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import clsx from 'clsx'
import { useProjectTasks } from '@/hooks/useTasks'
import { formatDate } from '@/utils/format'
import api from '@/services/api'

const STATUS_COLORS = {
  active:    'bg-green-100 text-green-700',
  paused:    'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS = {
  active: 'Activo', paused: 'Pausado', completed: 'Completado', cancelled: 'Cancelado',
}

const TASK_STATUS_COLORS = {
  pending:     'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting:     'bg-amber-100 text-amber-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-700',
}

function ChecklistInline({ items, projectId, taskId }) {
  const qc = useQueryClient()
  const toggle = useMutation({
    mutationFn: ({ id, is_done }) =>
      api.patch(`/tasks/checklist/${id}/`, { is_done }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-tasks', projectId] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['task', taskId] })
      qc.invalidateQueries({ queryKey: ['checklist', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  return (
    <ul className="ml-7 mb-2 space-y-1 border-l-2 border-gray-100 pl-3">
      {items.map(item => (
        <li key={item.id} className="flex items-center gap-2 group">
          <button
            onClick={(e) => { e.stopPropagation(); toggle.mutate({ id: item.id, is_done: !item.is_done }) }}
            disabled={toggle.isPending}
            className={clsx(
              'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
              item.is_done
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-wolf-400'
            )}
          >
            {item.is_done && (
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className={clsx(
            'text-xs py-0.5',
            item.is_done ? 'line-through text-gray-400' : 'text-gray-700'
          )}>
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  )
}

function TaskRow({ task, onEdit, projectId }) {
  const [showChecklist, setShowChecklist] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = task.due_date && task.due_date < today && !['completed', 'cancelled'].includes(task.status)
  const checklistItems = task.checklist_items || []
  const checklistTotal = checklistItems.length
  const checklistDone = checklistItems.filter(i => i.is_done).length
  const allDone = checklistTotal > 0 && checklistDone === checklistTotal

  return (
    <div className={clsx('rounded-lg text-sm transition-colors', isOverdue ? 'bg-red-50' : 'hover:bg-gray-50 dark:hover:bg-white/3')}>
      <div className="flex items-center gap-2 p-2.5">
        {/* Expand/collapse checklist arrow */}
        {checklistTotal > 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); setShowChecklist(s => !s) }}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 w-4 text-center text-xs leading-none"
            title={showChecklist ? 'Ocultar checklist' : 'Ver checklist'}
          >
            {showChecklist ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className={clsx('font-medium truncate', isOverdue ? 'text-red-700' : 'text-gray-900 dark:text-gray-100')}>
            {task.name}
          </p>
          {task.assigned_to_name && (
            <p className="text-xs text-gray-400 dark:text-gray-600">{task.assigned_to_name}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {checklistTotal > 0 && (
            <span className={clsx(
              'text-xs px-1.5 py-0.5 rounded font-medium',
              allDone
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            )}>
              ☑ {checklistDone}/{checklistTotal}
            </span>
          )}
          {task.due_date && (
            <span className={clsx('text-xs', isOverdue ? 'text-red-600 font-medium' : 'text-gray-400 dark:text-gray-600')}>
              {formatDate(task.due_date)}
            </span>
          )}
          <span className={`badge text-xs ${TASK_STATUS_COLORS[task.status] || ''}`}>
            {task.status_display || task.status}
          </span>
          <button
            className="p-1 text-gray-400 hover:text-wolf-600 dark:hover:text-wolf-400 rounded transition-colors"
            onClick={(e) => { e.stopPropagation(); onEdit(task) }}
            title="Editar tarea"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </div>

      {showChecklist && checklistTotal > 0 && (
        <ChecklistInline items={checklistItems} projectId={projectId} taskId={task.id} />
      )}
    </div>
  )
}

export default function ProjectCard({ project, onNewTask, onEditTask }) {
  const [expanded, setExpanded] = useState(false)
  const { data: taskData, isLoading } = useProjectTasks(expanded ? project.id : null)
  const tasks = taskData?.results || taskData || []

  const progress = project.progress ?? 0
  const doneCount = project.tasks_done ?? 0
  const totalCount = project.tasks_count ?? 0

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-white/3 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">{project.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {project.client_name || '—'}
              {project.responsible_name && ` · ${project.responsible_name}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`badge text-xs ${STATUS_COLORS[project.status] || ''}`}>
              {STATUS_LABELS[project.status] || project.status}
            </span>
            <span className="text-gray-400 dark:text-gray-600 text-sm">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-full h-2">
            <div
              className={clsx(
                'h-2 rounded-full transition-all',
                progress === 100 ? 'bg-green-500' : 'bg-wolf-600'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{progress}%</span>
          <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0">{doneCount}/{totalCount} tareas</span>
        </div>

        {(project.start_date || project.end_date) && (
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
            {project.start_date && `Inicio: ${formatDate(project.start_date)}`}
            {project.start_date && project.end_date && ' · '}
            {project.end_date && `Fin: ${formatDate(project.end_date)}`}
          </p>
        )}
      </div>

      {/* Lista de tareas (expandido) */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          <div className="px-4 py-2 flex items-center justify-between bg-gray-50 dark:bg-surface-dark-secondary">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">Tareas</span>
            <button
              className="text-xs text-wolf-600 dark:text-wolf-400 hover:underline font-medium"
              onClick={(e) => { e.stopPropagation(); onNewTask(project) }}
            >
              + Nueva tarea
            </button>
          </div>
          <div className="px-3 py-2 space-y-0.5 max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-4">Cargando...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-4 italic">Sin tareas en este proyecto</p>
            ) : (
              tasks.map(task => (
                <TaskRow key={task.id} task={task} onEdit={onEditTask} projectId={project.id} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
