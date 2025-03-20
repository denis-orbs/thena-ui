import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import { ArrowLeftIcon } from '@/svgs'

import { TextButton } from '../buttons/Button'

function LayoutWithBackButton({ children }) {
  const t = useTranslations()
  const { back } = useRouter()

  return (
    <div className='mt-[64px] lg:mt-[92px]'>
      <div className='hidden lg:block'>
        <TextButton className='ml-10 w-fit outline-0' LeadingIcon={ArrowLeftIcon} onClick={() => back()}>
          {t('Back')}
        </TextButton>
      </div>

      <section className={cn('layout !mt-0 pb-[180px] max-lg:pt-0')}>{children}</section>
    </div>
  )
}

export default LayoutWithBackButton
