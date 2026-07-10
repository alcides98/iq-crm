import { useState, useEffect } from 'react'
import { InputField, SelectField, TextareaField } from '@/components/ui/FormField'
import { validateRUC } from '@/utils/format'

const EMPTY_FORM = {
  client_type: 'empresa',
  status: 'prospecto',
  company_name: '',
  ruc: '',
  ci: '',
  contact_name: '',
  contact_position: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  industry: '',
  source: '',
  notes: '',
  document_link: '',
}

export default function ClientForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setForm({ ...EMPTY_FORM, ...initial })
    setErrors({})
  }, [initial?.id])

  const set = (field) => (e) => {
    const val = e.target ? e.target.value : e
    setForm(prev => ({ ...prev, [field]: val }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const errs = {}
    if (!form.company_name.trim()) errs.company_name = 'Requerido'
    if (!form.contact_name.trim()) errs.contact_name = 'Requerido'
    if (!form.phone.trim()) errs.phone = 'Requerido'
    if (!form.source) errs.source = 'Requerido'
    if (form.client_type === 'empresa' && form.ruc && !validateRUC(form.ruc)) {
      errs.ruc = 'RUC inválido — verificá el dígito verificador'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email inválido'
    }
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit(form)
  }

  const isEmpresa = form.client_type === 'empresa'

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Tipo y estado */}
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Tipo" required value={form.client_type} onChange={set('client_type')}>
          <option value="empresa">Empresa</option>
          <option value="persona">Persona Física</option>
        </SelectField>
        <SelectField label="Estado" value={form.status} onChange={set('status')}>
          <option value="prospecto">Prospecto</option>
          <option value="nuevo">Nuevo</option>
          <option value="recurrente">Recurrente</option>
          <option value="partner">Partner</option>
          <option value="inactivo">Inactivo</option>
        </SelectField>
      </div>

      {/* Nombre */}
      <InputField
        label={isEmpresa ? 'Razón social / Empresa' : 'Nombre completo'}
        required
        value={form.company_name}
        onChange={set('company_name')}
        error={errors.company_name}
        placeholder={isEmpresa ? 'Wolf Consulting Group S.A.' : 'Juan Pérez'}
      />

      {/* RUC / CI */}
      <div className="grid grid-cols-2 gap-4">
        {isEmpresa ? (
          <InputField
            label="RUC"
            value={form.ruc}
            onChange={set('ruc')}
            error={errors.ruc}
            placeholder="80123456-7"
          />
        ) : (
          <InputField
            label="Cédula de identidad"
            value={form.ci}
            onChange={set('ci')}
            error={errors.ci}
            placeholder="1234567"
          />
        )}
        <InputField
          label="Industria / Rubro"
          value={form.industry}
          onChange={set('industry')}
          placeholder="Manufactura, Retail..."
        />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contacto principal</p>
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Nombre del contacto"
            required
            value={form.contact_name}
            onChange={set('contact_name')}
            error={errors.contact_name}
            placeholder="María García"
          />
          <InputField
            label="Cargo"
            value={form.contact_position}
            onChange={set('contact_position')}
            placeholder="Gerente de RRHH"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <InputField
            label="Teléfono / WhatsApp"
            required
            value={form.phone}
            onChange={set('phone')}
            error={errors.phone}
            placeholder="0981 123 456"
          />
          <InputField
            label="Email"
            type="email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            placeholder="contacto@empresa.com"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ubicación y origen</p>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Ciudad / Departamento" value={form.city} onChange={set('city')}>
            <option value="">Sin especificar</option>
            <option value="asuncion">Asunción</option>
            <option value="central">Central</option>
            <option value="alto_parana">Alto Paraná</option>
            <option value="itapua">Itapúa</option>
            <option value="cordillera">Cordillera</option>
            <option value="caaguazu">Caaguazú</option>
            <option value="amambay">Amambay</option>
            <option value="guaira">Guairá</option>
            <option value="paraguari">Paraguarí</option>
            <option value="misiones">Misiones</option>
            <option value="neembucu">Ñeembucú</option>
            <option value="concepcion">Concepción</option>
            <option value="san_pedro">San Pedro</option>
            <option value="canindeyu">Canindeyú</option>
            <option value="presidente_hayes">Presidente Hayes</option>
            <option value="alto_paraguay">Alto Paraguay</option>
            <option value="boqueron">Boquerón</option>
          </SelectField>
          <SelectField label="Origen" required value={form.source} onChange={set('source')} error={errors.source}>
            <option value="">Seleccionar...</option>
            <option value="referido">Referido</option>
            <option value="linkedin">LinkedIn</option>
            <option value="instagram">Instagram</option>
            <option value="networking">Networking</option>
            <option value="webinar">Webinar</option>
            <option value="cliente_actual">Cliente actual</option>
            <option value="cold_call">Cold Call</option>
            <option value="evento">Evento</option>
            <option value="pagina_web">Página Web</option>
            <option value="otro">Otro</option>
          </SelectField>
        </div>
        <InputField
          label="Dirección"
          className="mt-4"
          value={form.address}
          onChange={set('address')}
          placeholder="Av. Mcal. López 1234, Asunción"
        />
      </div>

      <InputField
        label="Enlace de documentación (Google Drive u otro)"
        type="text"
        value={form.document_link}
        onChange={set('document_link')}
        placeholder="https://drive.google.com/..."
      />

      <TextareaField
        label="Notas"
        value={form.notes}
        onChange={set('notes')}
        placeholder="Información adicional relevante..."
        rows={3}
      />

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary min-w-[120px]" disabled={loading}>
          {loading ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </div>
    </form>
  )
}
