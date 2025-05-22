import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { NotShowBannerV3 } from '@/constant'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon } from '@/svgs'

import { TextButton } from '../buttons/Button'

function LayoutWithBackButton({ children, className, backUrl, hiddenBackButton }) {
  const t = useTranslations()
  const { back, push } = useRouter()

  const [showBannerMigrate, setShowBannerMigrate] = useState(false)

  useEffect(() => {
    const updateBanner = () => {
      const shouldShow = !localStorage.getItem(NotShowBannerV3) && new Date() >= new Date('2025-05-22')
      setShowBannerMigrate(shouldShow)
    }

    updateBanner()

    window.addEventListener('local-storage-changed', updateBanner)
    return () => window.removeEventListener('local-storage-changed', updateBanner)
  }, [])

  return (
    <div
      className={cn(
        'flex flex-col',
        showBannerMigrate && 'max-md:mt-8',
        !showBannerMigrate && 'mt-[64px] lg:mt-[92px]',
      )}
    >
      {!hiddenBackButton && (
        <div className='hidden 2xl:block'>
          <TextButton
            className='ml-4 w-fit outline-0 max-2xl:pl-0 2xl:ml-10'
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
      )}

      <section className={cn('layout-add-liquidity', className)}>{children}</section>
    </div>
  )
}

export default LayoutWithBackButton
