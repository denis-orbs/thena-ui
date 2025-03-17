import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon } from '@/svgs'

import { TextButton } from '../buttons/Button'

function LayoutWithBackButton({ children }) {
  const t = useTranslations()
  const { back } = useRouter()
  const { isViewUp } = useMediaQuery('up', 1920)

  return (
    <div className='mt-[64px] lg:mt-[92px]'>
      <div className='hidden lg:block'>
        <TextButton className='ml-10 w-fit outline-0' LeadingIcon={ArrowLeftIcon} onClick={() => back()}>
          {t('Back')}
        </TextButton>
      </div>

      <section className={cn('layout !mt-0 pb-[180px] max-lg:pt-0', isViewUp && '!mt-[92px]')}>{children}</section>
    </div>
  )
}

export default LayoutWithBackButton
