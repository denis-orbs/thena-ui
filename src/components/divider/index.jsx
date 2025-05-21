import { cn } from '@/lib/utils'

function Divider({ type = 'horizontal', className }) {
  return type === 'vertical' ? (
    <div className={cn('h-full w-px bg-neutral-700', className)} />
  ) : (
    <div className={cn('h-px bg-neutral-700', className)} />
  )
}

export default Divider
