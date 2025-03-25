import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { ArrowLeftIcon } from '@/svgs'

import { TextButton } from '../buttons/Button'

function LayoutWithBackButton({ children }) {
  const t = useTranslations()
  const { back } = useRouter()

  return (
    <div className='mt-[64px] lg:mt-[92px]'>
      <div className='hidden md:block'>
        <TextButton
          className='ml-4 w-fit outline-0 max-lg:pl-0 lg:ml-10'
          LeadingIcon={ArrowLeftIcon}
          onClick={() => back()}
        >
          {t('Back')}
        </TextButton>
      </div>

      <section className='layout-addliquidity'>{children}</section>
    </div>
  )
}

export default LayoutWithBackButton
