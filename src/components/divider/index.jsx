import { cn } from '@/lib/utils'

function Divider({ type = 'horizontal', className }) {
  return type === 'vertical' ? (
    <div className={cn('size-full', className)}>
      <div className='h-full w-px bg-neutral-700' />
    </div>
  ) : (
    <div className={cn('size-full', className)}>
      <div className='h-px bg-neutral-700' />
    </div>
  )
}

export default Divider
