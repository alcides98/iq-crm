import clsx from 'clsx'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-lg p-6 w-full max-w-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={clsx('flex-1 py-2 rounded-xl text-sm font-semibold transition-colors', danger
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-wolf-600 hover:bg-wolf-700 text-white'
            )}
          >
            {confirmLabel}
          </button>
          <button onClick={onClose} className="flex-1 btn-secondary">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
