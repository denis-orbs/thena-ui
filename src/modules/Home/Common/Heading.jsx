import { cn } from '@/lib/utils'

export function Heading({ title, heading, wrapperStyles, titleExtraStyles, headingExtraSytles }) {
  return (
    <div className={cn('flex w-full flex-col', wrapperStyles)}>
      {title && (
        <p
          className={cn(
            'gradient-text w-fit text-sm font-medium uppercase leading-[22px] lg:text-lg',
            titleExtraStyles,
          )}
        >
          {title}
        </p>
      )}
      <p
        className={cn(
          'mt-1 font-archia text-[32px] font-semibold leading-10 tracking-[-0.96px] lg:text-5xl lg:leading-[56px] lg:tracking-[-1.44px]',
          headingExtraSytles,
        )}
      >
        {heading}
      </p>
    </div>
  )
}
