import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import NextImage from '@/components/image/NextImage'
import { TextHeading } from '@/components/typography'
import { useUserInfo } from '@/context/userInfoContext'
import { cn } from '@/lib/utils'

export function SelectAvatar({ dataUpdate, setDataUpdate }) {
  const t = useTranslations()
  const { userInfo } = useUserInfo()

  const isHaveThenaNfts = useMemo(() => !!userInfo?.thenianNfts?.length, [userInfo?.thenianNfts?.length])

  const onSelectAvatar = useCallback(
    image => {
      setDataUpdate({
        ...dataUpdate,
        avatar: image,
      })
    },
    [dataUpdate, setDataUpdate],
  )

  return isHaveThenaNfts ? (
    <div className='flex max-w-52 flex-2 gap-2 overflow-x-auto py-2 lg:max-w-4xl'>
      {userInfo.thenianNfts.map(thenianNfts => (
        <NextImage
          alt='avatar'
          src={thenianNfts.meatadata.image}
          className={cn(
            'h-14 w-14 rounded-full lg:h-32 lg:w-32',
            dataUpdate.avatar === thenianNfts.meatadata.image ? 'border-4 border-primary-600' : '',
          )}
          width={100}
          height={100}
          onClick={() => onSelectAvatar(thenianNfts.meatadata.image)}
          key={thenianNfts.id}
        />
      ))}
    </div>
  ) : (
    <div className='flex flex-2 flex-col-reverse space-y-4 lg:flex-col lg:space-y-2'>
      <TextHeading className='text-3xl'>{t('No TheNFTs Found')}</TextHeading>
      <EmphasisButton className='w-32 text-nowrap'>{t('Buy TheNFT')}</EmphasisButton>
    </div>
  )
}
