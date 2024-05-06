'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import NextImage from '@/components/image/NextImage'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import dayjs from '@/lib/arenaDayjs'
import { successToast } from '@/lib/notify'
import { cn, formatAddress, formatAmount, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { ProfileButton } from '@/modules/Profile/ProfileButton'
import { useChainSettings } from '@/state/settings/hooks'
import { CheckIcon, CopyIcon, ExternalIcon, InfoIcon, Verified } from '@/svgs'

import ThenaIdModal from './ThenaIdModal'

dayjs.extend(localizedFormat)
const tarea_regex = /^(http|https)/

export function UserInfo({ userInfo, following, followers }) {
  const t = useTranslations()
  const { account } = useWallet()
  const assets = useAssets()
  const isOwnProfile = useMemo(() => userInfo.id.toLowerCase() === account?.toLowerCase(), [account, userInfo.id])
  const { networkId } = useChainSettings()
  const { open: openConnectWallet } = useWeb3Modal()

  const [thenaModalTab, setThenaModalTab] = useState()
  const [copied, setCopied] = useState(false)

  const theAsset = assets.find(asset => asset.address.toLowerCase() === Contracts.THE[networkId].toLowerCase())
  const hasThenaId = useMemo(() => userInfo.usernameNfts.length, [userInfo.usernameNfts.length])

  const followingCount = useMemo(() => following?.length ?? '-', [following?.length])

  const followersCount = useMemo(() => followers?.length ?? '-', [followers?.length])

  const handleClickThenaButton = useCallback(
    (tab = 'get') => {
      if (!account) {
        openConnectWallet()
      }
      setThenaModalTab(tab)
    },
    [account, openConnectWallet],
  )

  const onCopy = useCallback(
    e => {
      e.stopPropagation()
      e.preventDefault()
      navigator.clipboard.writeText(userInfo.id)
      successToast(t('Copied'))
      setCopied(true)
    },
    [t, userInfo.id],
  )

  useEffect(() => {
    if (copied) {
      const timeOut = setTimeout(() => setCopied(false), 2000)

      return () => clearTimeout(timeOut)
    }
  }, [copied])

  return (
    <>
      <Box className='space-y-4'>
        <div className='flex flex-col-reverse items-end justify-between gap-4 lg:flex-row lg:items-center'>
          <div className='flex flex-1 flex-col items-start justify-between gap-4 lg:flex-row lg:items-center'>
            <div className='flex items-start gap-5 lg:items-center'>
              <Image
                alt='avatar'
                src={userInfo.avatar ?? Avatar}
                className='h-14 w-14 rounded-full lg:h-32 lg:w-32'
                width={100}
                height={100}
              />
              <div className='flex flex-col gap-3'>
                <div className='flex items-center'>
                  <TextHeading
                    className={cn(
                      'text-3xl',
                      userInfo.nameColor && !String(userInfo.nameColor).startsWith('#') ? userInfo.nameColor : '',
                    )}
                  >
                    <span
                      style={{
                        color: userInfo.nameColor
                          ? String(userInfo.nameColor).startsWith('#')
                            ? userInfo.nameColor
                            : ''
                          : '',
                      }}
                    >
                      {userInfo.username || formatAddress(userInfo.id)}
                    </span>
                  </TextHeading>
                  {userInfo.isVerified &&
                    (userInfo?.checkMarkIcon ? (
                      <Image
                        src={userInfo.checkMarkIcon}
                        width={20}
                        height={20}
                        className='h-5 w-5'
                        alt='demo-checkmark'
                      />
                    ) : (
                      <Verified className='h-5 w-5' />
                    ))}
                  <div onClick={onCopy} className='ml-1 h-5 w-5 cursor-pointer stroke-neutral-200'>
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </div>
                  {isOwnProfile && !hasThenaId && (
                    <PrimaryButton
                      className='ml-4 bg-gradient-to-r from-[#B386FF] to-[#FF86FA] p-2 text-sm text-black'
                      onClick={() => handleClickThenaButton('get')}
                    >
                      {t('Get ID')}
                    </PrimaryButton>
                  )}
                  {!isOwnProfile && (
                    <PrimaryButton
                      className='ml-4 bg-gradient-to-r from-[#B386FF] to-[#FF86FA] p-2 text-sm text-black'
                      onClick={() => handleClickThenaButton('gift')}
                    >
                      {t('Gift Thena ID')}
                    </PrimaryButton>
                  )}
                </div>
                <TextSubHeading className='text-sm'>
                  {t('Joined')} {dayjs(userInfo.firstInteractAt).tz().format('MMM DD, YYYY')} {`${t('at')} `}
                  {dayjs(userInfo.firstInteractAt).tz().format('h:ma')}
                </TextSubHeading>
                <div className='flex gap-2'>
                  {userInfo.websiteUrl && (
                    <Link
                      href={tarea_regex.test(userInfo.websiteUrl) ? userInfo.websiteUrl : `//${userInfo.websiteUrl}`}
                      rel='nofollow noopener noreferrer'
                      target='_blank'
                      prefetch={false}
                    >
                      <NeutralBadge className='flex items-center text-nowrap lg:text-xs '>
                        <ExternalIcon className='mr-2 h-4 w-4 stroke-neutral-400' />
                        {userInfo.websiteUrl}
                      </NeutralBadge>
                    </Link>
                  )}
                  {userInfo.xProfileUrl && (
                    <Link href={`https://x.com/${userInfo.xProfileUrl}`} rel='nofollow noopener' target='_blank'>
                      <NeutralBadge className='flex items-center text-nowrap lg:text-xs'>
                        <NextImage alt='svg' className='mr-2 w-fit' src='/images/footer/x.svg' />@{userInfo.xProfileUrl}
                      </NeutralBadge>
                    </Link>
                  )}
                </div>
              </div>
            </div>
            {isOwnProfile && !userInfo.usernameNfts.length && (
              <Box className='flex items-center justify-between space-x-2 border border-primary-800 bg-primary-950 p-2 pl-3 lg:p-2 lg:pl-3'>
                <InfoIcon className='h-4 w-4 stroke-primary-600' />
                <TextHeading className='text-base'>
                  {t(userInfo.thenianNfts.length ? 'Buy Additional THENA IDs' : 'Buy Your Thena NFT Subdomain')}
                </TextHeading>
                <Link
                  href='https://thena.gitbook.io/thena/arena/thena-ids'
                  rel='nofollow noopener noreferrer'
                  target='_blank'
                >
                  <OutlinedButton className='text-nowrap border-primary-600 p-2 text-primary-600 hover:bg-primary-900'>
                    {t('Learn More')}
                  </OutlinedButton>
                </Link>
              </Box>
            )}
          </div>
          <ProfileButton
            isOwnProfile={isOwnProfile}
            userInfoId={userInfo.id}
            handleClickThenaButton={handleClickThenaButton}
            username={userInfo.username}
          />
        </div>
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
          <Box className='flex flex-col gap-2 bg-neutral-800'>
            <TextHeading className='text-lg'>{userInfo.rank}</TextHeading>
            <TextSubHeading className='text-sm'>{t('Rank')}</TextSubHeading>
          </Box>
          <Box className='flex flex-col gap-2 bg-neutral-800'>
            <TextHeading className='text-lg'>
              {`${formatAmount(fromWei(userInfo.balance, theAsset?.decimal))} ${theAsset?.symbol}`}
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

        {isOwnProfile && !hasThenaId && !userInfo.biography && (
          <div className='flex flex-col'>
            <TextHeading className='text-2xl'>{t('About')}</TextHeading>
            <div className='relative h-full w-full'>
              <div className='absolute z-10 flex h-full w-full flex-col items-center justify-center gap-6 bg-[rgba(0,0,0,0.1)] backdrop-blur-sm'>
                <EmphasisButton
                  className='bg-gradient-to-r from-primary-500 to-primary-700'
                  onClick={() => handleClickThenaButton('get')}
                >
                  {t('To Edit Your About Section')}
                </EmphasisButton>
              </div>
              <div className='h-full w-full p-1'>
                <Paragraph>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi maxime accusantium at voluptatum eius
                  dolorum aspernatur quod sequi itaque ullam assumenda, dolore laboriosam. Ab sint, sapiente enim natus
                  assumenda nesciunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae doloremque
                  accusamus perferendis! Velit animi mollitia quisquam consequatur magnam accusamus, inventore ut
                  minima? Ducimus maxime vitae quidem officiis maiores ratione eum!
                </Paragraph>
              </div>
            </div>
          </div>
        )}
        {userInfo.biography && (
          <div className='flex flex-col'>
            <TextHeading className='text-2xl'>{t('About')}</TextHeading>
            <div>
              <Paragraph>
                {/* eslint-disable-next-line react/no-danger */}
                <div dangerouslySetInnerHTML={{ __html: userInfo.biography }} />
              </Paragraph>
            </div>
          </div>
        )}
      </Box>
      {thenaModalTab && (
        <ThenaIdModal
          tab={thenaModalTab}
          onClose={() => setThenaModalTab(undefined)}
          targetAddress={account?.toLowerCase() !== userInfo.id.toLowerCase() ? userInfo.id.toLowerCase() : undefined}
        />
      )}
    </>
  )
}
