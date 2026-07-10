import { useState } from 'react'
import clsx from 'clsx'
import { useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useDeals, useCreateDeal, useUpdateDeal, useAdvanceDeal } from '@/hooks/usePipeline'
import { useDealTasks, useCreateTask } from '@/hooks/useTasks'
import { usePipelineStages } from '@/hooks/useUsers'
import api from '@/services/api'
import DealCard from '@/components/pipeline/DealCard'
import DealForm from '@/components/pipeline/DealForm'
import AdvancePhaseForm from '@/components/pipeline/AdvancePhaseForm'
import TaskForm from '@/components/tasks/TaskForm'
import TaskDetailDrawer from '@/components/tasks/TaskDetailDrawer'
import Drawer from '@/components/ui/Drawer'
import Modal from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatGS, formatDate } from '@/utils/format'

const PHASE_HEADER = {
  blue:   'border-t-blue-400',
  amber:  'border-t-amber-400',
  orange: 'border-t-orange-400',
  purple: 'border-t-purple-400',
  red:    'border-t-red-400',
  green:  'border-t-green-400',
  gray:   'border-t-gray-400',
  teal:   'border-t-teal-400',
  pink:   'border-t-pink-400',
}

const PHASE_COUNT_BG = {
  blue:   'bg-blue-100 text-blue-700',
  amber:  'bg-amber-100 text-amber-700',
  orange: 'bg-orange-100 text-orange-700',
  purple: 'bg-purple-100 text-purple-700',
  red:    'bg-red-100 text-red-700',
  green:  'bg-green-100 text-green-700',
  gray:   'bg-gray-100 text-gray-700',
  teal:   'bg-teal-100 text-teal-700',
  pink:   'bg-pink-100 text-pink-700',
}

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function DealDetailPanel({ deal, onClose, onEdit, onAdvance, onNewTask, onSelectTask, stages }) {
  const { data: tasksData } = useDealTasks(deal.id)
  const tasks = tasksData?.results || tasksData || []

  const rows = [
    ['Servicio', deal.service_display || deal.service_type],
    ['Monto', deal.amount ? formatGS(deal.amount) : '—'],
    ...(deal.amount_original ? [['Monto original', formatGS(deal.amount_original)]] : []),
    ['Probabilidad', `${deal.probability}%`],
    ['Asignado a', deal.assigned_to_name || '—'],
    ['Próximo seguimiento', deal.next_followup ? formatDate(deal.next_followup) : '—'],
    ['Cierre estimado', deal.estimated_close_date ? formatDate(deal.estimated_close_date) : '—'],
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <p className="font-semibold text-gray-900">{deal.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">{deal.client_name}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {rows.map(([label, val]) => (
            <>
              <dt key={`dt-${label}`} className="text-gray-400">{label}</dt>
              <dd key={`dd-${label}`} className="text-gray-800 font-medium">{val}</dd>
            </>
          ))}
        </dl>

        {/* Enlace de documentación */}
        {deal.document_link && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Documentación</p>
            <a
              href={deal.document_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-wolf-600 hover:text-wolf-700 bg-wolf-50 rounded-lg px-3 py-2 truncate"
            >
              🔗 {deal.document_link}
            </a>
          </div>
        )}

        {deal.initial_need && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Necesidad</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{deal.initial_need}</p>
          </div>
        )}

        {deal.notes && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notas</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{deal.notes}</p>
          </div>
        )}

        {/* Tareas vinculadas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">
              Tareas ({tasks.length})
            </p>
            <button onClick={onNewTask} className="text-xs text-wolf-600 dark:text-wolf-400 hover:underline font-medium">
              + Nueva tarea
            </button>
          </div>

          {tasks.length > 0 && (() => {
            const total = tasks.filter(t => t.status !== 'cancelled').length
            const done  = tasks.filter(t => t.status === 'completed').length
            const pct   = total > 0 ? Math.round(done / total * 100) : 0
            return (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-surface-dark-secondary rounded-xl">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500 dark:text-gray-500">{done}/{total} completadas</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all', pct === 100 ? 'bg-green-500' : 'bg-wolf-500')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })()}

          {tasks.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-600 italic">Sin tareas vinculadas</p>
          ) : (
            <ul className="space-y-1.5">
              {tasks.map(t => (
                <li key={t.id}>
                  <button
                    onClick={() => onSelectTask && onSelectTask(t.id)}
                    className="w-full flex items-center gap-2 text-sm bg-gray-50 dark:bg-surface-dark-secondary hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl px-3 py-2 text-left transition-colors cursor-pointer"
                  >
                    <span className={`badge text-xs ${STATUS_COLORS[t.status] || ''}`}>
                      {t.status_display || t.status}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{t.name}</span>
                    {(t.checklist_total > 0) && (
                      <span className="text-xs text-gray-400 dark:text-gray-600">
                        ☑ {t.checklist_done}/{t.checklist_total}
                      </span>
                    )}
                    <span className="text-gray-300 dark:text-gray-700 text-xs">›</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 space-y-2">
        <button className="btn-secondary w-full" onClick={onEdit}>Editar negociación</button>
        {!stages?.find(s => s.slug === deal.phase)?.is_terminal && (
          <button className="btn-primary w-full" onClick={onAdvance}>Avanzar fase →</button>
        )}
      </div>
    </div>
  )
}

export default function Pipeline() {
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const { data, isLoading } = useDeals(assigneeFilter ? { assigned_to: assigneeFilter } : {})
  const { data: stagesData, isLoading: stagesLoading } = usePipelineStages()

  const PHASES = (stagesData || [])
    .filter(s => s.is_active)
    .map(s => ({ key: s.slug, label: s.name, color: s.color, prob: s.probability, is_terminal: s.is_terminal }))

  const qc = useQueryClient()
  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()
  const advanceDeal = useAdvanceDeal()
  const createTask = useCreateTask()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState(null)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [advanceTarget, setAdvanceTarget] = useState(null) // { deal, targetPhase }
  const [taskDeal, setTaskDeal] = useState(null) // deal para crear tarea vinculada
  const [selectedPipelineTaskId, setSelectedPipelineTaskId] = useState(null)

  const allDeals = data?.results || data || []

  const dealsMap = PHASES.reduce((acc, p) => {
    acc[p.key] = allDeals.filter(d => d.phase === p.key)
    return acc
  }, {})

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const deal = allDeals.find(d => String(d.id) === draggableId)
    if (!deal) return

    const targetPhase = destination.droppableId
    const requiresForm = ['diagnostico', 'propuesta', 'replanteo', 'perdida', 'ganada'].includes(targetPhase)

    if (requiresForm) {
      setAdvanceTarget({ deal, targetPhase })
    } else {
      advanceDeal.mutate({ id: deal.id, phase: targetPhase })
    }
  }

  const handleAdvanceSubmit = (formData) => {
    advanceDeal.mutate(
      { id: advanceTarget.deal.id, ...formData },
      { onSuccess: () => { setAdvanceTarget(null); setSelectedDeal(null) } }
    )
  }

  const handleCreateSubmit = (formData, pendingTask) => {
    createDeal.mutateAsync(formData)
      .then(deal => {
        setCreateOpen(false)
        if (pendingTask?.name?.trim()) {
          createTask.mutateAsync({
            name: pendingTask.name,
            notes: pendingTask.description || '',
            deal: deal.id,
            status: 'pending',
            priority: 'normal',
          }).then(task => {
            const validItems = (pendingTask.checklist || []).filter(s => s.trim())
            validItems.forEach((text, i) => {
              api.post(`/tasks/tasks/${task.id}/checklist/`, { text, order: i })
            })
            if (validItems.length) {
              setTimeout(() => {
                qc.invalidateQueries({ queryKey: ['tasks'] })
                qc.invalidateQueries({ queryKey: ['deal-tasks', deal.id] })
              }, 500)
            }
          }).catch(() => {})
        }
      })
      .catch(() => {})
  }

  const handleTaskSubmit = (formData) => {
    createTask.mutate(
      { ...formData, deal: taskDeal?.id },
      { onSuccess: () => setTaskDeal(null) }
    )
  }

  const handleEditSubmit = (formData) => {
    updateDeal.mutate({ id: editingDeal.id, ...formData }, { onSuccess: () => setEditingDeal(null) })
  }

  if (isLoading || stagesLoading) return <PageSpinner />

  return (
    <div className="flex gap-4 h-full">
      {/* Board */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{allDeals.length} negociaciones</p>
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>+ Nueva negociación</button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
            {PHASES.map(phase => {
              const deals = dealsMap[phase.key] || []
              const total = deals.reduce((s, d) => s + parseFloat(d.amount || 0), 0)

              return (
                <div
                  key={phase.key}
                  className={`flex flex-col bg-gray-50 rounded-xl border-t-4 ${PHASE_HEADER[phase.color]} min-w-[210px] w-[210px] flex-shrink-0`}
                >
                  <div className="px-3 py-2.5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-800">{phase.label}</span>
                      <span className={`badge text-xs ${PHASE_COUNT_BG[phase.color]}`}>{deals.length}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatGS(total)}</p>
                  </div>

                  <Droppable droppableId={phase.key}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-2 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                        style={{ minHeight: 80 }}
                      >
                        {deals.map((deal, idx) => (
                          <Draggable key={deal.id} draggableId={String(deal.id)} index={idx}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                onClick={() => { if (!snap.isDragging) setSelectedDeal(deal) }}
                              >
                                <DealCard
                                  deal={deal}
                                  isDragging={snap.isDragging}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {deals.length === 0 && !snapshot.isDraggingOver && (
                          <p className="text-xs text-gray-300 text-center py-4">Arrastrá aquí</p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Panel detalle lateral */}
      {selectedDeal && (
        <div className="w-[340px] flex-shrink-0 card overflow-hidden self-start sticky top-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Negociación</span>
            <button onClick={() => setSelectedDeal(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>
          <DealDetailPanel
            deal={selectedDeal}
            stages={PHASES}
            onClose={() => setSelectedDeal(null)}
            onEdit={() => { setEditingDeal(selectedDeal); setSelectedDeal(null) }}
            onAdvance={() => {
              setAdvanceTarget({ deal: selectedDeal, targetPhase: '' })
              setSelectedDeal(null)
            }}
            onNewTask={() => setTaskDeal(selectedDeal)}
            onSelectTask={(taskId) => setSelectedPipelineTaskId(taskId)}
          />
        </div>
      )}

      {/* Drawer nueva negociación */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva negociación" width="w-[540px]">
        <DealForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setCreateOpen(false)}
          loading={createDeal.isPending}
        />
      </Drawer>

      {/* Drawer editar */}
      <Drawer open={!!editingDeal} onClose={() => setEditingDeal(null)} title={`Editar: ${editingDeal?.name || ''}`} width="w-[540px]">
        {editingDeal && (
          <DealForm
            initial={editingDeal}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingDeal(null)}
            loading={updateDeal.isPending}
          />
        )}
      </Drawer>

      {/* Modal avanzar fase */}
      <Modal
        open={!!advanceTarget}
        onClose={() => setAdvanceTarget(null)}
        title="Avanzar fase"
        size="md"
      >
        {advanceTarget && (
          <AdvancePhaseForm
            deal={advanceTarget.deal}
            targetPhase={advanceTarget.targetPhase}
            stages={PHASES}
            onSubmit={handleAdvanceSubmit}
            onCancel={() => setAdvanceTarget(null)}
            loading={advanceDeal.isPending}
          />
        )}
      </Modal>

      {/* Modal nueva tarea vinculada al deal */}
      <Modal
        open={!!taskDeal}
        onClose={() => setTaskDeal(null)}
        title={taskDeal ? `Nueva tarea — ${taskDeal.name}` : 'Nueva tarea'}
        size="lg"
      >
        {taskDeal && (
          <div className="p-6">
            <TaskForm
              fixedDeal={taskDeal.id}
              onSubmit={handleTaskSubmit}
              onCancel={() => setTaskDeal(null)}
              loading={createTask.isPending}
            />
          </div>
        )}
      </Modal>

      {/* Drawer detalle de tarea desde pipeline */}
      <Drawer
        open={!!selectedPipelineTaskId}
        onClose={() => setSelectedPipelineTaskId(null)}
        title="Detalle de tarea"
        width="w-[400px]"
      >
        {selectedPipelineTaskId && (
          <TaskDetailDrawer
            taskId={selectedPipelineTaskId}
            onEdit={() => setSelectedPipelineTaskId(null)}
            onClose={() => setSelectedPipelineTaskId(null)}
          />
        )}
      </Drawer>
    </div>
  )
}
