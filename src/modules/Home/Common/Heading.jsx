import cn from '@/utils/classes'

export function Heading({ title, heading, wrapperStyles, titleExtraStyles, headingExtraSytles }) {
  return (
    <div className={cn('flex w-full flex-col', wrapperStyles)}>
      {title && (
        <p
          className={cn(
            'gradient-text w-fit text-sm leading-[22px] font-medium uppercase lg:text-lg',
            titleExtraStyles,
          )}
        >
          {title}
        </p>
      )}
      <p
        className={cn(
          'font-archia mt-1 text-[32px] leading-10 font-semibold tracking-[-0.96px] lg:text-5xl lg:leading-[56px] lg:tracking-[-1.44px]',
          headingExtraSytles,
        )}
      >
        {heading}
      </p>
    </div>
  )
}
