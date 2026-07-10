import { useState } from 'react'
import Drawer from '@/components/ui/Drawer'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { PageSpinner } from '@/components/ui/Spinner'
import ClientForm from '@/components/clients/ClientForm'
import ContactForm from '@/components/clients/ContactForm'
import {
  useClients, useClient, useClientDeals, useClientContacts,
  useCreateClient, useUpdateClient, useDeleteClient, useCreateContact,
} from '@/hooks/useClients'
import { formatDate, formatGS, PHASE_CONFIG } from '@/utils/format'

const STATUS_COLORS = {
  prospecto: 'bg-gray-100 text-gray-600',
  nuevo: 'bg-blue-100 text-blue-700',
  recurrente: 'bg-green-100 text-green-700',
  partner: 'bg-purple-100 text-purple-700',
  inactivo: 'bg-red-100 text-red-700',
}

function ClientDetail({ clientId, onEdit, onClose }) {
  const { data: client, isLoading } = useClient(clientId)
  const { data: dealsData } = useClientDeals(clientId)
  const { data: contactsData } = useClientContacts(clientId)
  const [showContactForm, setShowContactForm] = useState(false)
  const createContact = useCreateContact()

  const deals = dealsData?.results || dealsData || []
  const contacts = contactsData?.results || contactsData || []

  if (isLoading) return <div className="p-6"><PageSpinner /></div>
  if (!client) return null

  return (
    <div className="flex flex-col h-full">
      {/* Header del cliente */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 text-lg leading-tight">{client.company_name}</h4>
            <p className="text-sm text-gray-500 mt-0.5">{client.contact_name} · {client.phone}</p>
          </div>
          <div className="flex gap-2">
            <span className={`badge ${STATUS_COLORS[client.status] || 'bg-gray-100 text-gray-600'}`}>
              {client.status}
            </span>
            <button className="btn-secondary text-xs py-1 px-3" onClick={onEdit}>Editar</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Info general */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Información</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {client.ruc && <><span className="text-gray-400">RUC</span><span className="text-gray-800">{client.ruc}</span></>}
            {client.ci && <><span className="text-gray-400">CI</span><span className="text-gray-800">{client.ci}</span></>}
            {client.email && <><span className="text-gray-400">Email</span><span className="text-gray-800 truncate">{client.email}</span></>}
            {client.city && <><span className="text-gray-400">Ciudad</span><span className="text-gray-800 capitalize">{client.city.replace('_', ' ')}</span></>}
            {client.industry && <><span className="text-gray-400">Rubro</span><span className="text-gray-800">{client.industry}</span></>}
            <span className="text-gray-400">Origen</span><span className="text-gray-800 capitalize">{client.source?.replace('_', ' ')}</span>
          </div>
          {client.document_link && (
            <div className="mt-2">
              <a
                href={client.document_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-wolf-600 hover:text-wolf-700 bg-wolf-50 rounded-lg px-3 py-2 truncate"
              >
                🔗 {client.document_link}
              </a>
            </div>
          )}
          {client.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-3">{client.notes}</p>}
        </section>

        {/* Negociaciones */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Negociaciones ({deals.length})
          </p>
          {deals.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Sin negociaciones</p>
          ) : (
            <div className="space-y-2">
              {deals.map(deal => {
                const phase = PHASE_CONFIG[deal.phase]
                return (
                  <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{deal.name}</p>
                      <p className="text-xs text-gray-400">{phase?.label} · {formatDate(deal.created_at?.split('T')[0])}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{formatGS(deal.amount)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Contactos adicionales */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Contactos adicionales ({contacts.length})
            </p>
            <button
              className="text-xs text-wolf-600 hover:underline"
              onClick={() => setShowContactForm(true)}
            >
              + Agregar
            </button>
          </div>

          {showContactForm && (
            <div className="border border-gray-200 rounded-xl mb-3">
              <ContactForm
                loading={createContact.isPending}
                onSubmit={(data) => createContact.mutate(
                  { clientId: clientId, ...data },
                  { onSuccess: () => setShowContactForm(false) }
                )}
                onCancel={() => setShowContactForm(false)}
              />
            </div>
          )}

          {contacts.length === 0 && !showContactForm ? (
            <p className="text-sm text-gray-400 italic">Sin contactos adicionales</p>
          ) : (
            <div className="space-y-2">
              {contacts.map(c => (
                <div key={c.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  {c.position && <p className="text-xs text-gray-500">{c.position}</p>}
                  <div className="flex gap-3 mt-1">
                    {c.phone && <span className="text-xs text-gray-500">{c.phone}</span>}
                    {c.email && <span className="text-xs text-gray-500">{c.email}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default function Clients() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading } = useClients({ search, status: statusFilter })
  const { data: editingClient, isLoading: loadingEdit } = useClient(editingId)
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const clients = data?.results || data || []

  const openCreate = () => { setEditingId(null); setFormOpen(true) }
  const openEdit = (client) => { setEditingId(client.id); setFormOpen(true) }
  const closeForm = () => { setFormOpen(false); setEditingId(null) }

  const handleSubmit = (formData) => {
    if (editingId) {
      updateClient.mutate({ id: editingId, ...formData }, { onSuccess: closeForm })
    } else {
      createClient.mutate(formData, { onSuccess: closeForm })
    }
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Lista principal */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            className="input max-w-xs"
            placeholder="Buscar por nombre, contacto, RUC..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="input w-40"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="prospecto">Prospecto</option>
            <option value="nuevo">Nuevo</option>
            <option value="recurrente">Recurrente</option>
            <option value="partner">Partner</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <div className="ml-auto">
            <button className="btn-primary" onClick={openCreate}>+ Nuevo cliente</button>
          </div>
        </div>

        {/* Tabla */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Empresa / Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contacto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ciudad</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Origen</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Enlace</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="py-12 text-center"><PageSpinner /></td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">
                  {search || statusFilter ? 'Sin resultados para ese filtro' : 'Aún no hay clientes — creá el primero'}
                </td></tr>
              ) : clients.map(client => (
                <tr
                  key={client.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${selectedId === client.id ? 'bg-wolf-50' : ''}`}
                  onClick={() => setSelectedId(selectedId === client.id ? null : client.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{client.company_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{client.client_type}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{client.contact_name}</td>
                  <td className="px-4 py-3 text-gray-600">{client.phone}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{client.city?.replace('_', ' ') || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{client.source?.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_COLORS[client.status] || 'bg-gray-100'}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    {client.document_link ? (
                      <a
                        href={client.document_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-7 h-7 text-wolf-500 hover:text-wolf-700 hover:bg-wolf-50 rounded transition-colors"
                        title={client.document_link}
                      >
                        🔗
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        className="p-1.5 text-gray-400 hover:text-wolf-600 hover:bg-wolf-50 rounded transition-colors"
                        title="Editar"
                        onClick={() => openEdit(client)}
                      >✏️</button>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                        onClick={() => setDeleteTarget(client)}
                      >🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
              {clients.length} cliente{clients.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Panel detalle lateral */}
      {selectedId && (
        <div className="w-[380px] flex-shrink-0 card overflow-hidden self-start sticky top-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Detalle</span>
            <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>
          <ClientDetail
            clientId={selectedId}
            onEdit={() => openEdit({ id: selectedId })}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}

      {/* Drawer formulario crear/editar */}
      <Drawer
        open={formOpen}
        onClose={closeForm}
        title={editingId ? `Editar: ${editingClient?.company_name || '...'}` : 'Nuevo cliente'}
      >
        {editingId && loadingEdit ? (
          <div className="p-10 flex justify-center"><PageSpinner /></div>
        ) : (
          <ClientForm
            key={editingId || 'create'}
            initial={editingClient || {}}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            loading={createClient.isPending || updateClient.isPending}
          />
        )}
      </Drawer>

      {/* Confirmar eliminación */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteClient.mutate(deleteTarget?.id)}
        title="Eliminar cliente"
        message={`¿Confirmás que querés eliminar a "${deleteTarget?.company_name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
      />
    </div>
  )
}
