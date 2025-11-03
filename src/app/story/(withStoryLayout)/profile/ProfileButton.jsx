import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { EmphasisButton } from '@/components/buttons/Button'

export function ProfileButton() {
  const t = useTranslations()

  return (
    <div className='flex justify-end lg:block'>
      <Link href='/story/edit-profile'>
        <EmphasisButton
          className='text-xs leading-5 lg:px-4 lg:py-3 lg:text-base'
          style={{
            lineHeight: '20px',
          }}
        >
          {t('Edit Profile')}
        </EmphasisButton>
      </Link>
    </div>
  )
}
