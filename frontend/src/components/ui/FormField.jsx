import clsx from 'clsx'

export function FormField({ label, error, required, children, className }) {
  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  )
}

export function SelectField({ label, error, required, className, children, ...props }) {
  return (
    <FormField label={label} error={error} required={required} className={className}>
      <select
        className={clsx('input', error && 'border-red-400 focus:ring-red-400')}
        {...props}
      >
        {children}
      </select>
    </FormField>
  )
}

export function InputField({ label, error, required, className, ...props }) {
  return (
    <FormField label={label} error={error} required={required} className={className}>
      <input
        className={clsx('input', error && 'border-red-400 focus:ring-red-400')}
        {...props}
      />
    </FormField>
  )
}

export function TextareaField({ label, error, required, className, rows = 3, ...props }) {
  return (
    <FormField label={label} error={error} required={required} className={className}>
      <textarea
        rows={rows}
        className={clsx('input resize-none', error && 'border-red-400 focus:ring-red-400')}
        {...props}
      />
    </FormField>
  )
}
