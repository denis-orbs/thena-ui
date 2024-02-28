import { cn } from '@/lib/utils'

export function LoadingIndicator({ color = 'primary', className, ...props }) {
  const colors = {
    primary:
      'bg-[conic-gradient(from_180deg_at_50%_50%,_#CD07D2_0deg,_#CD07D2_63.24300169944763deg,_rgba(255,_255,_255,_0.00)_360deg)]',
    secondary:
      'bg-[conic-gradient(from_180deg_at_50%_50%,_#0eb9df_0deg,_#0eb9df_63.24300169944763deg,_rgba(255,_255,_255,_0.00)_360deg)]',
  }

  const currentColor = colors[color]

  return (
    <svg className={cn('h-5 w-5', className)} viewBox='0 0 100 100' {...props}>
      <foreignObject className='origin-center animate-spin' clipPath='url(#clip)' x='0' y='0' width='100' height='100'>
        <div className={cn('h-full w-full rounded-full', currentColor)} xmlns='http://www.w3.org/1999/xhtml' />
      </foreignObject>
      {/* Clipping the conic gradient to a circle */}
      <g>
        <clipPath id='clip'>
          <path d='M 50 0 a 50 50 0 0 1 0 100 50 50 0 0 1 0 -100 v 8 a 42 42 0 0 0 0 84 42 42 0 0 0 0 -84' />
        </clipPath>
      </g>
    </svg>
  )
}
