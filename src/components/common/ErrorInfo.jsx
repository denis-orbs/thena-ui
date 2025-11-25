import InfoIcon from '@/icons/InfoIcon'
import cn from '@/utils/classes'

import Box from '../box'

export default function ErrorInfo({ message, type = 'error', className, showIcon = true }) {
  return (
    <Box
      className={cn(
        'border-primary-800 bg-primary-950 flex flex-row items-center gap-3 rounded-lg border',
        type === 'warn' ? 'border-warn-950 bg-warn-950' : '',
        className,
      )}
    >
      {showIcon && (
        <div className='items-center'>
          <InfoIcon className={cn('stroke-primary-600! size-5', type === 'warn' ? 'stroke-warn-600!' : '')} />
        </div>
      )}
      <div>{message}</div>
    </Box>
  )
}
