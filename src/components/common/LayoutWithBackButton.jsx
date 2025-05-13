import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import { ArrowLeftIcon } from '@/svgs'

import { TextButton } from '../buttons/Button'

function LayoutWithBackButton({ children, className, backUrl }) {
  const t = useTranslations()
  const { back, push } = useRouter()

  return (
    <div className='mt-[64px] lg:mt-[92px]'>
      <div className='hidden lg:block'>
        <TextButton
          className='ml-4 w-fit outline-0 max-lg:pl-0 lg:ml-10'
          LeadingIcon={ArrowLeftIcon}
          onClick={() => {
            if (backUrl) {
              push(backUrl)
            } else {
              back()
            }
          }}
        >
          {t('Back')}
        </TextButton>
      </div>

      <section className={cn('layout-add-liquidity', className)}>{children}</section>
    </div>
  )
}

export default LayoutWithBackButton
