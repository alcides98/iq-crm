import clsx from 'clsx'

export default function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={clsx('border-4 border-wolf-600 border-t-transparent rounded-full animate-spin', sizes[size], className)} />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <Spinner size="md" />
    </div>
  )
}
