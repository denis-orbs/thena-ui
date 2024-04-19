import { useTranslations } from 'next-intl'
import React from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { PublicIcon } from '@/svgs'

export function ProfileButton({ isOwnProfile }) {
  const t = useTranslations()

  return (
    <div className='flex items-center space-x-2'>
      {isOwnProfile ? (
        <>
          <EmphasisButton className='p-2 text-xs lg:py-3 lg:text-base'>{t('Edit Profile')}</EmphasisButton>
          <EmphasisButton className='p-2 text-xs lg:py-3 lg:text-base'>{t('Send THENA ID')}</EmphasisButton>
        </>
      ) : (
        <EmphasisButton className='p-2 text-xs lg:p-3 lg:text-base'>{t('Follow')}</EmphasisButton>
      )}

      <EmphasisIconButton Icon={PublicIcon} />
    </div>
  )
}
