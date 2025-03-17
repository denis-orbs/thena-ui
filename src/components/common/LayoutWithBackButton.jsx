import { useRouter } from 'next/navigation'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon } from '@/svgs'

import { TextButton } from '../buttons/Button'

function LayoutWithBackButton({ children }) {
  const { back } = useRouter()
  const { isViewUp } = useMediaQuery('up', 1920)

  return (
    <div className='mt-[64px] lg:mt-[92px]'>
      <div className='hidden lg:block'>
        <TextButton className='ml-10 outline-0' onClick={() => back()}>
          <ArrowLeftIcon className='size-5 stroke-neutral-400' />
          <span>Back</span>
        </TextButton>
      </div>

      <section className={cn('layout !mt-0 pb-[180px] max-lg:pt-0', isViewUp && '!mt-[92px]')}>{children}</section>
    </div>
  )
}

export default LayoutWithBackButton
