import { useState } from 'react'
import clsx from 'clsx'
import Modal from '@/components/ui/Modal'
import Drawer from '@/components/ui/Drawer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { PageSpinner } from '@/components/ui/Spinner'
import TaskForm from '@/components/tasks/TaskForm'
import TaskDetailDrawer from '@/components/tasks/TaskDetailDrawer'
import ProjectCard from '@/components/tasks/ProjectCard'
import { useTasks, useProjects, useCreateTask, useUpdateTask, useDeleteTask, useCreateChecklistItems } from '@/hooks/useTasks'
import { useUsers } from '@/hooks/useUsers'
import { useDeals } from '@/hooks/usePipeline'
import { formatDate } from '@/utils/format'

const STATUS_COLORS = {
  pending:     'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  waiting:     'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  completed:   'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  cancelled:   'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

const PRIORITY_DOT = { normal: '', high: '🟡', urgent: '🔴' }

function KPIBadge({ label, value, color = 'gray', onClick, active }) {
  const colors = {
    gray:   'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    green:  'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    red:    'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  }
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-2xl px-4 py-3 text-left transition-all border',
        colors[color],
        active
          ? 'ring-2 ring-wolf-500 border-transparent'
          : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
      )}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
    </button>
  )
}

export default function Tasks() {
  const [tab, setTab] = useState('tasks')
  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [dealFilter, setDealFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [fixedProject, setFixedProject] = useState(null)
  const [fixedDeal, setFixedDeal] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Filtros por columna (client-side)
  const [colFilters, setColFilters] = useState({ name: '', deal: '', assigned_to: '', due_date: '', status: '' })

  const filters = {}
  if (statusFilter) filters.status = statusFilter
  if (assigneeFilter) filters.assigned_to = assigneeFilter
  if (dealFilter) filters.deal = dealFilter

  const { data: tasksData, isLoading: loadingTasks } = useTasks(filters)
  const { data: projectsData, isLoading: loadingProjects } = useProjects()
  const { data: usersRaw = [] } = useUsers()
  const { data: dealsData } = useDeals()

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const createChecklistItems = useCreateChecklistItems()

  const tasks = tasksData?.results || tasksData || []
  const projects = projectsData?.results || projectsData || []
  const users = Array.isArray(usersRaw) ? usersRaw : (usersRaw?.results || [])
  const deals = dealsData?.results || dealsData || []

  const today = new Date().toISOString().split('T')[0]

  // KPIs
  const total       = tasks.length
  const pending     = tasks.filter(t => t.status === 'pending').length
  const inProgress  = tasks.filter(t => t.status === 'in_progress').length
  const completed   = tasks.filter(t => t.status === 'completed').length
  const overdue     = tasks.filter(t => t.due_date && t.due_date < today && !['completed','cancelled'].includes(t.status)).length

  const openCreate = (project = null, deal = null) => {
    setEditingTask(null)
    setFixedProject(project?.id ?? null)
    setFixedDeal(deal?.id ?? null)
    setModalOpen(true)
  }

  const openEdit = (task) => {
    setEditingTask(task)
    setFixedProject(null)
    setFixedDeal(null)
    setModalOpen(true)
    setSelectedTaskId(null)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingTask(null)
    setFixedProject(null)
    setFixedDeal(null)
  }

  const handleSubmit = (data, pendingChecklist) => {
    if (fixedProject) data.project = fixedProject
    if (fixedDeal) data.deal = fixedDeal
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, ...data }, { onSuccess: closeModal })
    } else {
      createTask.mutate(data, {
        onSuccess: (task) => {
          closeModal()
          const validItems = (pendingChecklist || []).filter(s => s && s.trim())
          if (validItems.length) {
            createChecklistItems.mutate({ taskId: task.id, items: validItems })
          }
        },
      })
    }
  }

  const applyKpiFilter = (status) => {
    setStatusFilter(prev => prev === status ? '' : status)
  }

  const applyOverdueFilter = () => {
    setStatusFilter(prev => prev === '__overdue__' ? '' : '__overdue__')
  }

  const displayedTasks = statusFilter === '__overdue__'
    ? tasks.filter(t => t.due_date && t.due_date < today && !['completed','cancelled'].includes(t.status))
    : tasks

  // Filtros de columna aplicados encima
  const filteredTasks = displayedTasks
    .filter(t => !colFilters.name || t.name.toLowerCase().includes(colFilters.name.toLowerCase()))
    .filter(t => !colFilters.status || t.status === colFilters.status)
    .filter(t => !colFilters.assigned_to || String(t.assigned_to) === colFilters.assigned_to)
    .filter(t => !colFilters.deal || String(t.deal) === colFilters.deal)
    .filter(t => !colFilters.due_date || t.due_date === colFilters.due_date)

  const setCol = (field) => (e) => setColFilters(f => ({ ...f, [field]: e.target.value }))

  // Progreso calculado desde checklist si existe, sino progress_percent
  const getProgress = (task) =>
    task.checklist_total > 0
      ? Math.round((task.checklist_done / task.checklist_total) * 100)
      : (task.progress_percent || 0)

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KPIBadge label="Total"        value={total}      color="gray"  onClick={() => { setStatusFilter(''); setAssigneeFilter(''); setDealFilter('') }} active={!statusFilter && !assigneeFilter && !dealFilter} />
        <KPIBadge label="Pendientes"   value={pending}    color="blue"  onClick={() => applyKpiFilter('pending')}     active={statusFilter === 'pending'} />
        <KPIBadge label="En proceso"   value={inProgress} color="amber" onClick={() => applyKpiFilter('in_progress')} active={statusFilter === 'in_progress'} />
        <KPIBadge label="Finalizadas"  value={completed}  color="green" onClick={() => applyKpiFilter('completed')}   active={statusFilter === 'completed'} />
        <KPIBadge label="Vencidas"     value={overdue}    color="red"   onClick={applyOverdueFilter}                  active={statusFilter === '__overdue__'} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary">
          {[
            { key: 'tasks',    label: 'Tareas' },
            { key: 'projects', label: 'Proyectos' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors',
                tab === t.key
                  ? 'bg-wolf-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <button className="btn-primary" onClick={() => openCreate()}>+ Nueva tarea</button>
        </div>
      </div>

      {/* Tab Tareas */}
      {tab === 'tasks' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              {/* Encabezados */}
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-4 py-3 font-medium text-gray-400 dark:text-gray-600 text-xs uppercase tracking-wide">Tarea</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 dark:text-gray-600 text-xs uppercase tracking-wide">Vinculada a</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 dark:text-gray-600 text-xs uppercase tracking-wide">Asignado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 dark:text-gray-600 text-xs uppercase tracking-wide">Vencimiento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 dark:text-gray-600 text-xs uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 dark:text-gray-600 text-xs uppercase tracking-wide">Progreso</th>
                <th className="px-4 py-3" />
              </tr>
              {/* Filtros por columna */}
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-white/2">
                <th className="px-3 py-2">
                  <input
                    className="input py-1 text-xs w-full"
                    placeholder="Buscar tarea..."
                    value={colFilters.name}
                    onChange={setCol('name')}
                  />
                </th>
                <th className="px-3 py-2">
                  <select className="input py-1 text-xs w-full" value={colFilters.deal} onChange={setCol('deal')}>
                    <option value="">Todas</option>
                    {deals.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                  </select>
                </th>
                <th className="px-3 py-2">
                  <select className="input py-1 text-xs w-full" value={colFilters.assigned_to} onChange={setCol('assigned_to')}>
                    <option value="">Todos</option>
                    {users.map(u => <option key={u.id} value={String(u.id)}>{u.full_name}</option>)}
                  </select>
                </th>
                <th className="px-3 py-2">
                  <input
                    type="date"
                    className="input py-1 text-xs w-full"
                    value={colFilters.due_date}
                    onChange={setCol('due_date')}
                  />
                </th>
                <th className="px-3 py-2">
                  <select className="input py-1 text-xs w-full" value={colFilters.status} onChange={setCol('status')}>
                    <option value="">Todos</option>
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Proceso</option>
                    <option value="waiting">En Espera</option>
                    <option value="completed">Finalizado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </th>
                <th className="px-3 py-2" />
                <th className="px-3 py-2">
                  {Object.values(colFilters).some(v => v) && (
                    <button
                      onClick={() => setColFilters({ name: '', deal: '', assigned_to: '', due_date: '', status: '' })}
                      className="text-xs text-red-400 hover:text-red-600 whitespace-nowrap"
                      title="Limpiar filtros"
                    >
                      ✕ Limpiar
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingTasks ? (
                <tr><td colSpan={7} className="py-12 text-center"><PageSpinner /></td></tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-gray-600 text-sm">
                    {statusFilter || Object.values(colFilters).some(v => v) ? 'Sin tareas con ese filtro' : 'Sin tareas — creá la primera'}
                  </td>
                </tr>
              ) : filteredTasks.map(task => {
                const isOverdue = task.due_date && task.due_date < today && !['completed','cancelled'].includes(task.status)
                const isSelected = selectedTaskId === task.id
                const progress = getProgress(task)
                return (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
                    className={clsx(
                      'border-b border-gray-50 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-white/3 cursor-pointer transition-colors',
                      isOverdue && 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30',
                      isSelected && 'bg-wolf-50 dark:bg-wolf-900/10'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {PRIORITY_DOT[task.priority] && <span className="text-xs">{PRIORITY_DOT[task.priority]}</span>}
                        <span className="font-medium text-gray-900 dark:text-gray-100">{task.name}</span>
                        <span className={clsx(
                          'text-xs px-1.5 py-0.5 rounded-md font-medium',
                          task.checklist_total > 0
                            ? task.checklist_done === task.checklist_total
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                        )}>
                          ☑ {task.checklist_done}/{task.checklist_total}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {task.deal_name
                        ? <span className="text-wolf-600 dark:text-wolf-400 font-medium">{task.deal_name}</span>
                        : <span className="text-gray-400 dark:text-gray-600">{task.project_name || '—'}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{task.assigned_to_name || '—'}</td>
                    <td className={clsx('px-4 py-3 text-xs', isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-500')}>
                      {formatDate(task.due_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${STATUS_COLORS[task.status] || ''}`}>
                        {task.status_display || task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-28">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'h-full rounded-full transition-all duration-300',
                              progress === 100 ? 'bg-green-500' : 'bg-wolf-500'
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-600 w-7 text-right">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 text-wolf-400 dark:text-wolf-600 hover:text-wolf-700 dark:hover:text-wolf-300 rounded-lg transition-colors bg-wolf-50 dark:bg-wolf-900/20"
                          onClick={() => setSelectedTaskId(task.id)}
                          title="Ver detalle y checklist"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button className="p-1.5 text-gray-300 dark:text-gray-700 hover:text-wolf-600 dark:hover:text-wolf-400 rounded-lg transition-colors" onClick={() => openEdit(task)} title="Editar">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="p-1.5 text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors" onClick={() => setDeleteTarget(task)} title="Eliminar">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredTasks.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-50 dark:border-gray-900 text-xs text-gray-400 dark:text-gray-600">
              {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''}
              {filteredTasks.length !== displayedTasks.length && ` (de ${displayedTasks.length} totales)`}
            </div>
          )}
        </div>
      )}

      {/* Tab Proyectos */}
      {tab === 'projects' && (
        <>
          {loadingProjects ? <PageSpinner /> : projects.length === 0 ? (
            <div className="card p-12 text-center text-gray-400 dark:text-gray-600">
              <p>Sin proyectos — se crean automáticamente al ganar una negociación</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {projects.map(p => (
                <ProjectCard key={p.id} project={p} onNewTask={openCreate} onEditTask={openEdit} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Drawer detalle tarea */}
      <Drawer
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        title="Detalle y checklist"
        width="w-[420px]"
      >
        {selectedTaskId && (
          <TaskDetailDrawer
            taskId={selectedTaskId}
            onEdit={() => {
              const t = tasks.find(x => x.id === selectedTaskId)
              if (t) openEdit(t)
            }}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </Drawer>

      {/* Modal crear/editar */}
      <Modal open={modalOpen} onClose={closeModal} title={editingTask ? `Editar: ${editingTask.name}` : 'Nueva tarea'} size="lg">
        <div className="p-6">
          <TaskForm
            initial={editingTask || {}}
            fixedProject={fixedProject}
            fixedDeal={fixedDeal}
            onSubmit={handleSubmit}
            onCancel={closeModal}
            loading={createTask.isPending || updateTask.isPending}
          />
        </div>
      </Modal>

      {/* Confirmar eliminación */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTask.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
        title="Eliminar tarea"
        message={`¿Eliminás la tarea "${deleteTarget?.name}"?`}
        confirmLabel="Eliminar"
        danger
      />
    </div>
  )
}
