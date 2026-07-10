import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import {
  useUsers, useCreateUser, useUpdateUser, useDeactivateUser,
  useCompanySettings, useUpdateCompanySettings,
  usePipelineStages, useUpdatePipelineStage, useCreatePipelineStage,
} from '@/hooks/useUsers'
import { PageSpinner } from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import clsx from 'clsx'

const ADMIN_ROLES = ['owner', 'admin', 'admin_usuario']

const ROLE_LABELS = {
  owner: 'Dueño',
  admin: 'Administrador',
  admin_usuario: 'Admin Usuario',
  collaborator: 'Colaborador',
  colaborador: 'Colaborador',
}

const ROLE_OPTIONS = [
  { value: 'admin_usuario', label: 'Admin Usuario' },
  { value: 'colaborador',   label: 'Colaborador' },
  { value: 'owner',         label: 'Dueño' },
  { value: 'admin',         label: 'Administrador' },
]

const COLOR_OPTIONS = [
  { value: 'blue',   label: 'Azul',        dot: 'bg-blue-500' },
  { value: 'amber',  label: 'Ámbar',       dot: 'bg-amber-500' },
  { value: 'orange', label: 'Naranja',     dot: 'bg-orange-500' },
  { value: 'purple', label: 'Morado',      dot: 'bg-purple-500' },
  { value: 'red',    label: 'Rojo',        dot: 'bg-red-500' },
  { value: 'green',  label: 'Verde',       dot: 'bg-green-500' },
  { value: 'gray',   label: 'Gris',        dot: 'bg-gray-400' },
  { value: 'teal',   label: 'Turquesa',    dot: 'bg-teal-500' },
]

/* ─── User Form ─── */
function UserForm({ initial = {}, onSubmit, onCancel, loading, isNew }) {
  const [form, setForm] = useState({
    first_name: initial.first_name || '',
    last_name:  initial.last_name  || '',
    email:      initial.email      || '',
    role:       initial.role       || 'colaborador',
    password:   '',
  })

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    const data = { ...form }
    if (!isNew) delete data.password
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={form.first_name} onChange={set('first_name')} required />
        </div>
        <div>
          <label className="label">Apellido</label>
          <input className="input" value={form.last_name} onChange={set('last_name')} required />
        </div>
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" value={form.email} onChange={set('email')} required disabled={!isNew} />
      </div>
      <div>
        <label className="label">Rol</label>
        <select className="input" value={form.role} onChange={set('role')}>
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      {isNew && (
        <div>
          <label className="label">Contraseña</label>
          <input className="input" type="password" value={form.password} onChange={set('password')} required minLength={8} placeholder="Mínimo 8 caracteres" />
        </div>
      )}
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Guardando...' : (isNew ? 'Crear usuario' : 'Guardar cambios')}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}

/* ─── Tab: Profile ─── */
function TabProfile() {
  const user = useAuthStore(s => s.user)
  return (
    <div className="space-y-4 max-w-md">
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Mi perfil</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={user?.first_name || ''} readOnly />
          </div>
          <div>
            <label className="label">Apellido</label>
            <input className="input" value={user?.last_name || ''} readOnly />
          </div>
          <div className="col-span-2">
            <label className="label">Email</label>
            <input className="input" value={user?.email || ''} readOnly />
          </div>
          <div>
            <label className="label">Rol</label>
            <input className="input" value={ROLE_LABELS[user?.role] || user?.role || ''} readOnly />
          </div>
        </div>
      </div>
      <div className="card p-5">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">IQ-CRM v1.0</p>
        <p className="text-sm text-gray-400 dark:text-gray-600">Desarrollado por IQ Data</p>
      </div>
    </div>
  )
}

/* ─── Tab: Users ─── */
function TabUsers() {
  const { data: users = [], isLoading } = useUsers()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deactivate = useDeactivateUser()

  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)

  const currentUser = useAuthStore(s => s.user)

  const handleCreate = (data) => createUser.mutate(data, { onSuccess: () => setShowForm(false) })
  const handleUpdate = (data) => updateUser.mutate({ id: editingUser.id, ...data }, { onSuccess: () => setEditingUser(null) })

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-500">{users.length} usuario{users.length !== 1 ? 's' : ''}</p>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingUser(null) }}>
          + Nuevo usuario
        </button>
      </div>

      {(showForm && !editingUser) && (
        <div className="card p-5">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Nuevo usuario</h4>
          <UserForm isNew onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={createUser.isPending} />
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wide">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wide">Rol</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-50 dark:border-gray-900">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-wolf-100 dark:bg-wolf-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-wolf-700 dark:text-wolf-300 text-xs font-semibold">
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{u.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'badge text-xs',
                    u.is_active
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  )}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.id !== currentUser?.id && (
                    <div className="flex gap-1">
                      <button className="p-1.5 text-gray-300 dark:text-gray-700 hover:text-wolf-600 dark:hover:text-wolf-400 rounded-lg transition-colors" onClick={() => { setEditingUser(u); setShowForm(false) }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      {u.is_active && (
                        <button className="p-1.5 text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors" onClick={() => setDeactivateTarget(u)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="card p-5">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Editar: {editingUser.full_name}</h4>
          <UserForm initial={editingUser} onSubmit={handleUpdate} onCancel={() => setEditingUser(null)} loading={updateUser.isPending} />
        </div>
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => deactivate.mutate(deactivateTarget.id, { onSuccess: () => setDeactivateTarget(null) })}
        title="Desactivar usuario"
        message={`¿Desactivás a "${deactivateTarget?.full_name}"? El usuario no podrá ingresar al sistema.`}
        confirmLabel="Desactivar"
        danger
      />
    </div>
  )
}

/* ─── Tab: Company ─── */
function TabCompany() {
  const { data: settings, isLoading } = useCompanySettings()
  const update = useUpdateCompanySettings()
  const [form, setForm] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  const current = form ?? settings ?? {}
  const set = f => e => setForm(p => ({ ...(p ?? settings ?? {}), [f]: e.target.value }))

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSave = () => {
    const dataToSave = form ?? settings
    if (!dataToSave && !logoFile) return

    if (logoFile) {
      const fd = new FormData()
      Object.entries(dataToSave || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && k !== 'logo' && k !== 'logo_file_url' && k !== 'id' && k !== 'created_at' && k !== 'updated_at') {
          fd.append(k, v)
        }
      })
      fd.append('logo', logoFile)
      update.mutate(fd, { onSuccess: () => { setForm(null); setLogoFile(null) } })
    } else {
      const { logo, logo_file_url, id, created_at, updated_at, ...cleanForm } = (dataToSave || {})
      update.mutate(cleanForm, { onSuccess: () => setForm(null) })
    }
  }

  const currentLogoSrc = logoPreview || settings?.logo_file_url || null

  if (isLoading) return <PageSpinner />

  return (
    <div className="max-w-lg">
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Datos de la empresa</h3>

        {/* Logo upload */}
        <div>
          <label className="label">Logo de la empresa</label>
          <div className="flex items-center gap-4 mt-1">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-surface-dark-secondary flex-shrink-0">
              {currentLogoSrc ? (
                <img src={currentLogoSrc} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 dark:text-gray-700">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="block cursor-pointer">
                <span className="btn-secondary text-sm inline-block">Subir imagen</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              {currentLogoSrc && (
                <button
                  className="text-xs text-red-500 hover:underline block"
                  onClick={() => { setLogoFile(null); setLogoPreview(null); setForm(p => ({ ...(p ?? settings ?? {}), logo: null })) }}
                >
                  Quitar logo
                </button>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-600">PNG, JPG, SVG — máx. 2 MB</p>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Nombre de la empresa</label>
          <input className="input" value={current.name || ''} onChange={set('name')} />
        </div>
        <div>
          <label className="label">Slogan / Descripción corta</label>
          <input className="input" value={current.tagline || ''} onChange={set('tagline')} placeholder="Consultoría estratégica..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">RUC</label>
            <input className="input" value={current.ruc || ''} onChange={set('ruc')} placeholder="80123456-7" />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input className="input" value={current.phone || ''} onChange={set('phone')} placeholder="0981 123 456" />
          </div>
        </div>
        <div>
          <label className="label">Email de contacto</label>
          <input className="input" type="email" value={current.email || ''} onChange={set('email')} />
        </div>
        <div>
          <label className="label">Sitio web</label>
          <input className="input" type="text" value={current.website || ''} onChange={set('website')} placeholder="https://miempresa.com" />
        </div>
        <div>
          <label className="label">Dirección</label>
          <input className="input" value={current.address || ''} onChange={set('address')} />
        </div>
        <div className="pt-1">
          <button
            className="btn-primary"
            disabled={update.isPending || isLoading}
            onClick={handleSave}
          >
            {update.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Tab: Pipeline ─── */
function TabPipeline() {
  const { data: stagesRaw, isLoading } = usePipelineStages()
  const updateStage = useUpdatePipelineStage()
  const createStage = useCreatePipelineStage()
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', slug: '', color: 'blue', probability: 10, order: 0 })

  const stages = Array.isArray(stagesRaw) ? stagesRaw : []

  const startEdit = (stage) => {
    setEditingId(stage.id)
    setEditForm({ name: stage.name, color: stage.color, probability: stage.probability, is_active: stage.is_active })
  }

  const saveEdit = (id) => {
    updateStage.mutate({ id, ...editForm }, { onSuccess: () => setEditingId(null) })
  }

  const handleCreate = (e) => {
    e.preventDefault()
    createStage.mutate({ ...newForm, order: stages.length + 1 }, {
      onSuccess: () => { setShowNew(false); setNewForm({ name: '', slug: '', color: 'blue', probability: 10, order: 0 }) }
    })
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-4 max-w-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-500">Etapas del pipeline — arrastrá para reordenar</p>
        <button className="btn-primary" onClick={() => setShowNew(true)}>+ Nueva etapa</button>
      </div>

      {showNew && (
        <div className="card p-5">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Nueva etapa</h4>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nombre</label>
                <input className="input" value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Slug (código único)</label>
                <input className="input" value={newForm.slug} onChange={e => setNewForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s/g, '_') }))} required placeholder="ej: calificacion" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Color</label>
                <select className="input" value={newForm.color} onChange={e => setNewForm(p => ({ ...p, color: e.target.value }))}>
                  {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Probabilidad (%)</label>
                <input className="input" type="number" min="0" max="100" value={newForm.probability} onChange={e => setNewForm(p => ({ ...p, probability: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary" disabled={createStage.isPending}>Crear etapa</button>
              <button type="button" className="btn-secondary" onClick={() => setShowNew(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {stages.map(stage => {
          const colorDot = COLOR_OPTIONS.find(c => c.value === stage.color)?.dot || 'bg-gray-400'
          const isEditing = editingId === stage.id
          return (
            <div key={stage.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-900 last:border-0">
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${colorDot}`} />

              {isEditing ? (
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <input
                    className="input text-sm py-1 w-36"
                    value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  />
                  <select
                    className="input text-sm py-1 w-28"
                    value={editForm.color}
                    onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))}
                  >
                    {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input
                    className="input text-sm py-1 w-20"
                    type="number" min="0" max="100"
                    value={editForm.probability}
                    onChange={e => setEditForm(p => ({ ...p, probability: parseInt(e.target.value) }))}
                  />
                  <button className="btn-primary text-xs px-3 py-1" onClick={() => saveEdit(stage.id)} disabled={updateStage.isPending}>Guardar</button>
                  <button className="btn-secondary text-xs px-3 py-1" onClick={() => setEditingId(null)}>Cancelar</button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{stage.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-600 ml-2">· {stage.probability}% · #{stage.slug}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'badge text-xs',
                      stage.is_active
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    )}>
                      {stage.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                    {stage.is_terminal && (
                      <span className={clsx('badge text-xs', stage.is_won ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400')}>
                        {stage.is_won ? 'Ganada' : 'Terminal'}
                      </span>
                    )}
                    <button className="p-1.5 text-gray-300 dark:text-gray-700 hover:text-wolf-600 dark:hover:text-wolf-400 rounded-lg transition-colors" onClick={() => startEdit(stage)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      className="p-1.5 text-gray-300 dark:text-gray-700 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg transition-colors"
                      onClick={() => updateStage.mutate({ id: stage.id, is_active: !stage.is_active })}
                      title={stage.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {stage.is_active
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Main Settings ─── */
export default function Settings() {
  const user = useAuthStore(s => s.user)
  const isAdmin = ADMIN_ROLES.includes(user?.role)

  const tabs = [
    { key: 'profile',  label: 'Mi perfil' },
    ...(isAdmin ? [
      { key: 'users',    label: 'Usuarios' },
      { key: 'company',  label: 'Empresa' },
      { key: 'pipeline', label: 'Pipeline' },
    ] : []),
  ]

  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-100 dark:border-gray-900 pb-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px',
              activeTab === t.key
                ? 'text-wolf-700 dark:text-wolf-300 border-wolf-600'
                : 'text-gray-500 dark:text-gray-500 border-transparent hover:text-gray-800 dark:hover:text-gray-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile'  && <TabProfile />}
      {activeTab === 'users'    && <TabUsers />}
      {activeTab === 'company'  && <TabCompany />}
      {activeTab === 'pipeline' && <TabPipeline />}
    </div>
  )
}
