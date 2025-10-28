import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'

import { cn } from '@/lib/utils'
import { useMigratePositionWarning } from '@/state/positions/hooks'
import { ArrowLeftIcon } from '@/svgs'

import { TextButton } from '../buttons/Button'

function LayoutWithBackButton({ children, className, backUrl, hiddenBackButton }) {
  const t = useTranslations()
  const { back, push } = useRouter()
  const { showBannerMigrate } = useMigratePositionWarning()

  return (
    <div
      className={cn(
        'flex flex-col',
        showBannerMigrate && 'mt-2 max-md:mt-[72px]',
        !showBannerMigrate && 'mt-[72px] mb-2 lg:mt-[100px]',
        hiddenBackButton && 'lg:mt-[92px]',
      )}
    >
      {!hiddenBackButton && (
        <div className='hidden xl:block'>
          <TextButton
            className='ml-4 w-fit outline-0 max-xl:pl-0 xl:ml-10'
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
