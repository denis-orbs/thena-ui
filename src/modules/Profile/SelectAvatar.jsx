import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import NextImage from '@/components/image/NextImage'
import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

import { ModalEditUserAvatar } from './ModalEditUserAvatar'
import { useThenianNftsOwnedAndStaked } from '../Arena/hooks/profile'

export function SelectAvatar({ dataUpdate, setDataUpdate, userInfo, isAdmin }) {
  const t = useTranslations()
  const { getThenianNftsOwnedAndStaked, userNFTs } = useThenianNftsOwnedAndStaked()
  const [openEditAvatar, setOpenEditAvatar] = useState(false)
  const [avatar, setAvatar] = useState(dataUpdate.avatar)

  useEffect(() => {
    const getNfts = async () => {
      await getThenianNftsOwnedAndStaked()
    }
    getNfts()
  }, [getThenianNftsOwnedAndStaked])

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
      setAvatar(url)
    },
    [setDataUpdate],
  )

  const isUseNFTAvatar = useMemo(() => userNFTs?.find(nft => nft?.meatadata?.image === avatar), [userNFTs, avatar])

  return (
    <div className='flex-2 items-center justify-start space-x-4'>
      <div className='flex max-w-52 items-center gap-2 overflow-x-auto py-2 lg:max-w-4xl'>
        {!avatar && (
          <NextImage
            alt='avatar'
            src={Avatar}
            className={cn(
              'h-14 w-14 rounded-full lg:h-32 lg:w-32',
              dataUpdate.avatar === null ? 'border-4 border-primary-600' : '',
            )}
            onClick={() => onSelectAvatar(null)}
            width={100}
            height={100}
          />
        )}
        {avatar && !isUseNFTAvatar && (
          <NextImage
            alt='avatar'
            src={avatar}
            className={cn(
              'h-14 w-14 rounded-full lg:h-32 lg:w-32',
              dataUpdate.avatar === avatar ? 'border-4 border-primary-600' : '',
            )}
            onClick={() => onSelectAvatar(avatar)}
            width={100}
            height={100}
          />
        )}
        {Boolean(userNFTs.length) &&
          userNFTs?.map((thenianNfts, index) => (
            <NextImage
              alt='avatar'
              src={thenianNfts?.meatadata?.image}
              className={cn(
                'h-14 w-14 rounded-full lg:h-32 lg:w-32',
                dataUpdate.avatar === thenianNfts?.meatadata?.image ? 'border-4 border-primary-600' : '',
              )}
              width={100}
              height={100}
              onClick={() => onSelectAvatar(thenianNfts?.meatadata?.image?.replace('ipfs.io', 'w3s.link'))}
              key={thenianNfts?.id ?? index}
            />
          ))}
      </div>
      {!userNFTs.length && (
        <div className='flex flex-col-reverse lg:flex-col'>
          <TextHeading className='text-3xl'>{t('No TheNFTs Found')}</TextHeading>
        </div>
      )}
      <div className='lg:flex-column mt-2 flex flex-row gap-2'>
        <Link href='https://element.market/collections/thenian' className='' rel='nofollow noopener' target='_blank'>
          <EmphasisButton className='w-32 text-nowrap'>{t('Buy theNFT')}</EmphasisButton>
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
        />
      )}
    </div>
  )
}
