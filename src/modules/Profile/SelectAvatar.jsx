import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import NextImage from '@/components/image/NextImage'
import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

import { ModalEditUserAvatar } from './ModalEditUserAvatar'

export function SelectAvatar({ dataUpdate, setDataUpdate, userInfo, isAdmin }) {
  const t = useTranslations()
  const [openEditAvatar, setOpenEditAvatar] = useState(false)
  const isHaveThenaNfts = useMemo(() => !!userInfo?.thenianNfts?.length, [userInfo?.thenianNfts?.length])
  const [customAvatar, setCustomAvatar] = useState(null)

  useEffect(() => {
    if (
      userInfo?.avatar &&
      userInfo?.thenianNfts?.every(thenianNfts => thenianNfts?.meatadata?.image !== userInfo.avatar)
    ) {
      setCustomAvatar(userInfo.avatar)
    }
  }, [userInfo?.avatar, userInfo?.thenianNfts])

  const onSelectAvatar = useCallback(
    image => {
      setDataUpdate({
        ...dataUpdate,
        avatar: image,
      })
    },
    [dataUpdate, setDataUpdate],
  )

  const onChangeCustomAvatar = useCallback(
    url => {
      setDataUpdate(prev => ({
        ...prev,
        avatar: url,
      }))
      setCustomAvatar(url)
    },
    [setDataUpdate],
  )

  return (
    <div className='flex-2 items-center justify-start space-x-4'>
      <div className='flex max-w-52 items-center gap-2 overflow-x-auto py-2 lg:max-w-4xl'>
        {customAvatar && (
          <NextImage
            alt='avatar'
            src={customAvatar}
            className={cn(
              'h-14 w-14 rounded-full lg:h-32 lg:w-32',
              dataUpdate.avatar === customAvatar ? 'border-4 border-primary-600' : '',
            )}
            onClick={() => onSelectAvatar(customAvatar)}
            width={100}
            height={100}
          />
        )}
        {isHaveThenaNfts &&
          userInfo?.thenianNfts?.map((thenianNfts, index) => (
            <NextImage
              alt='avatar'
              src={thenianNfts?.meatadata?.image?.replace('ipfs.io', 'w3s.link')}
              className={cn(
                'h-14 w-14 rounded-full lg:h-32 lg:w-32',
                dataUpdate.avatar === thenianNfts?.meatadata?.image?.replace('ipfs.io', 'w3s.link')
                  ? 'border-4 border-primary-600'
                  : '',
              )}
              width={100}
              height={100}
              onClick={() => onSelectAvatar(thenianNfts?.meatadata?.image?.replace('ipfs.io', 'w3s.link'))}
              key={thenianNfts?.id ?? index}
            />
          ))}
      </div>
      {!isHaveThenaNfts && (
        <div className='flex flex-col-reverse lg:flex-col'>
          <TextHeading className='text-3xl'>{t('No TheNFTs Found')}</TextHeading>
        </div>
      )}
      <div className='lg:flex-column mt-2 flex flex-row gap-2'>
        <Link href='https://element.market/collections/thenian' className='' rel='nofollow noopener' target='_blank'>
          <EmphasisButton className='w-32 text-nowrap'>{t('Buy TheNFT')}</EmphasisButton>
        </Link>
        {(isAdmin || userInfo?.isVerified) && (
          <EmphasisButton className='w-32 text-nowrap' onClick={() => setOpenEditAvatar(true)}>
            {t('Upload Avatar')}
          </EmphasisButton>
        )}
      </div>

      {openEditAvatar && (
        <ModalEditUserAvatar
          isOpen={openEditAvatar}
          closeModal={() => setOpenEditAvatar(false)}
          dataUpdate={dataUpdate}
          onChange={onChangeCustomAvatar}
          user={userInfo}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
