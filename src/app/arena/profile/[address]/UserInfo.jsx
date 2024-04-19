'use client'

import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { formatAddress, formatAmount, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { ProfileButton } from '@/modules/Profile/ProfileButton'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoIcon } from '@/svgs'

dayjs.extend(localizedFormat)

export function UserInfo({ userInfo, following, followers }) {
  const t = useTranslations()
  const { account } = useWallet()
  const assets = useAssets()
  const isOwnProfile = useMemo(() => userInfo?.id.toLowerCase() === account?.toLowerCase(), [account, userInfo.id])
  const { networkId } = useChainSettings()
  const theAsset = assets.find(asset => asset.address.toLowerCase() === Contracts.THE[networkId].toLowerCase())

  const followingCount = useMemo(() => following?.length ?? '-', [following?.length])

  const followersCount = useMemo(() => followers?.length ?? '-', [followers?.length])

  return (
    <Box className='space-y-4'>
      <div className='flex flex-col-reverse items-end justify-between gap-4 lg:flex-row lg:items-center'>
        <div className='flex flex-1 flex-col items-start justify-between gap-4 lg:flex-row lg:items-center'>
          <div className='flex items-start gap-5 lg:items-center'>
            <Image
              alt='avatar'
              src={Avatar}
              className='h-14 w-14 rounded-full lg:h-32 lg:w-32'
              width={100}
              height={100}
            />
            <div className='flex flex-col gap-3'>
              <div className='flex items-center'>
                <TextHeading className='text-3xl'>{formatAddress(userInfo.id)}</TextHeading>
                <PrimaryButton className='ml-4 p-2 text-sm text-black'>
                  {t(isOwnProfile ? 'Get ID' : 'Gift Thena ID')}
                </PrimaryButton>
              </div>
              <TextSubHeading className='text-sm'>
                {t('Joined')} {dayjs(userInfo.firstInteractAt).format('lll')}
              </TextSubHeading>
              <div className='flex gap-2'>
                <NeutralBadge className='text-nowrap capitalize lg:text-xs'>website.com</NeutralBadge>
                <NeutralBadge className='text-nowrap capitalize lg:text-xs'>@twitterhandle</NeutralBadge>
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <Box className='flex items-center justify-between space-x-2 border border-primary-800 bg-primary-950 p-2 pl-3 lg:p-2 lg:pl-3'>
              <InfoIcon className='h-4 w-4 stroke-primary-600' />
              <TextHeading className='text-base'>{t('Buy Your Thena NFT Subdomain')}</TextHeading>
              <OutlinedButton className='text-nowrap border-primary-600 p-2 text-primary-600 hover:bg-primary-900'>
                {t('Learn More')}
              </OutlinedButton>
            </Box>
          )}
        </div>
        <ProfileButton isOwnProfile={isOwnProfile} userInfoId={userInfo.id} />
      </div>
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <Box className='flex flex-col gap-2 bg-neutral-800'>
          <TextHeading className='text-lg'>{userInfo.rank}</TextHeading>
          <TextSubHeading className='text-sm'>{t('Rank')}</TextSubHeading>
        </Box>
        <Box className='flex flex-col gap-2 bg-neutral-800'>
          <TextHeading className='text-lg'>
            {`${formatAmount(fromWei(userInfo.balance, theAsset.decimal))} ${theAsset.symbol}`}
          </TextHeading>
          <TextSubHeading className='text-sm'>{t('Balance')}</TextSubHeading>
        </Box>
        <Box className='flex flex-col gap-2 bg-neutral-800'>
          <TextHeading className='text-lg'>{followersCount}</TextHeading>
          <TextSubHeading className='text-sm'>{t('Followers')}</TextSubHeading>
        </Box>
        <Box className='flex flex-col gap-2 bg-neutral-800'>
          <TextHeading className='text-lg'>{followingCount}</TextHeading>
          <TextSubHeading className='text-sm'>{t('Following')}</TextSubHeading>
        </Box>
      </div>
      <div className='flex flex-col'>
        <TextHeading className='text-2xl'>{t('About')}</TextHeading>
        <div className='relative h-full w-full'>
          <div className='absolute z-10 flex h-full w-full flex-col items-center justify-center gap-6 bg-[rgba(0,0,0,0.1)] backdrop-blur-sm'>
            <EmphasisButton>{t('Unlock This Feature With THENA ID')}</EmphasisButton>
          </div>
          <div className='h-full w-full p-1'>
            <Paragraph>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi maxime accusantium at voluptatum eius
              dolorum aspernatur quod sequi itaque ullam assumenda, dolore laboriosam. Ab sint, sapiente enim natus
              assumenda nesciunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae doloremque
              accusamus perferendis! Velit animi mollitia quisquam consequatur magnam accusamus, inventore ut minima?
              Ducimus maxime vitae quidem officiis maiores ratione eum!
            </Paragraph>
          </div>
        </div>
      </div>
    </Box>
  )
}
