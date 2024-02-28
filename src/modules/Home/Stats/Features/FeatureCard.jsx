import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

export const FeatureCard = forwardRef(({ className, children }, ref) => (
  <div
    className={cn(
      'relative rounded-2xl p-4 md:rounded-3xl md:p-6',
      'before:absolute before:inset-0 before:rounded-[inherit] before:p-[1px]',
      'before:bg-[linear-gradient(129.41deg,_rgba(220,_1,_212,_0.45)_0%,_rgba(220,_1,_212,_0)_38.31%)]',
      'before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,_linear-gradient(#fff_0_0)]',
      'before:[-webkit-mask-composite:xor]',
      'before:[mask-composite:exclude]',
      'after:absolute after:inset-0 after:rounded-[inherit] after:p-[1px]',
      'after:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,_linear-gradient(#fff_0_0)]',
      'after:[-webkit-mask-composite:xor]',
      'after:[mask-composite:exclude]',
      className,
    )}
    ref={ref}
  >
    {children}
  </div>
))

FeatureCard.displayName = 'FeatureCard'
