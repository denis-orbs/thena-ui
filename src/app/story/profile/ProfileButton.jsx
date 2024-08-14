import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { EmphasisButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { UploadIcon } from '@/svgs'

export function ProfileButton() {
  const t = useTranslations()

  return (
    <div className='flex items-center justify-end space-x-2'>
      <Link href='/arena/profile/edit'>
        <EmphasisButton
          className='text-xs leading-5 lg:px-4 lg:py-3 lg:text-base'
          style={{
            lineHeight: '20px',
          }}
        >
          {t('Edit Profile')}
        </EmphasisButton>
      </Link>

      <EmphasisIconButton Icon={UploadIcon} />
    </div>
  )
}
