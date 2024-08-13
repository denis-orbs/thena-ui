import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { EmphasisButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { PublicIcon } from '@/svgs'

export function ProfileButton() {
  const t = useTranslations()

  return (
    <div className='flex items-center justify-end space-x-2'>
      <Link href='/arena/profile/edit'>
        <EmphasisButton className='p-2 text-xs lg:py-3 lg:text-base'>{t('Edit Profile')}</EmphasisButton>
      </Link>

      <EmphasisIconButton Icon={PublicIcon} />
    </div>
  )
}
