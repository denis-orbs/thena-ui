import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo, useRef } from 'react'

import Box from '@/components/box'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useFixViewport } from '@/hooks/useFixViewPort'
import { cn, formatAddress } from '@/lib/utils'
import { CheckIcon, LogoIcon } from '@/svgs'

import { VerifyPopover } from './VerifyPopover'

function BoxShow({ value, title, className }) {
  const t = useTranslations()
  return (
    <div
      className={cn(
        'mx-auto flex h-[128px] w-[200px] flex-col gap-2 rounded-xl bg-white bg-opacity-5 px-4 py-6 lg:p-6',
        className,
      )}
    >
      <TextHeading className='text-center text-lg'>{value}</TextHeading>
      <TextSubHeading className='text-center text-sm'>{t(title)}</TextSubHeading>
    </div>
  )
}

function AchievementItem({ title, subTitle, icon, className }) {
  return (
    <div className={cn('flex h-[128px] w-[200px] flex-col gap-2 bg-transparent', className)}>
      <Image className='mx-auto mb-[-15px]' src={icon} width={80} height={88} alt='icon' />
      <TextHeading className='text-center text-lg'>{title}</TextHeading>
      <TextSubHeading className='text-center text-sm'>{subTitle}</TextSubHeading>
    </div>
  )
}

export default function ShareProfileStatsDetail({
  userInfo,
  className,
  selectedDefault,
  showAchievement,
  userAchievementsCompleted,
  selectedAchievements,
}) {
  const ref = useRef(null)
  useFixViewport([ref])

  const totalDefault = useMemo(() => {
    const values = Object.values(selectedDefault)
    const result = values.reduce((prev, cur) => prev + (cur ? 1 : 0), 0)
    return result
  }, [selectedDefault])

  console.log('totalDefault', totalDefault)

  return (
    <Box className={className}>
      <div ref={ref}>
        <div className='mx-auto mb-[50px] flex w-[198px] items-center gap-5'>
          <Image
            alt='avatar'
            src={userInfo.avatar?.replace('ipfs.io', 'w3s.link') ?? Avatar}
            className='rounded-full lg:h-32 lg:w-32'
            width={64}
            height={64}
          />
          <div className='flex flex-col gap-3'>
            <div className='flex items-center'>
              <TextHeading
                className={cn(
                  'text-xl lg:text-3xl',
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
              {userInfo.isVerified && (
                <VerifyPopover verifyImage={userInfo?.checkMarkIcon} verifiedAt={userInfo?.verifiedAt} />
              )}
              <div className='ml-2 h-5 w-5 cursor-pointer stroke-neutral-200'>
                <CheckIcon />
              </div>
            </div>
          </div>
        </div>
        <div
          className={cn(
            'mx-auto mb-8 grid justify-center gap-4',
            showAchievement && selectedAchievements.length > 0
              ? 'flex flex-1'
              : `grid-cols-${totalDefault === 2 || totalDefault === 4 ? 2 : totalDefault} ${
                  totalDefault === 2 || totalDefault === 4 ? 'sm:w-[462px]' : ''
                }`,
          )}
        >
          {selectedDefault.rank && <BoxShow value={userInfo.rank} title='Rank' />}
          {/* TODO: change data */}
          {selectedDefault.numberOfTCsWon && <BoxShow value={0} title='Trading Competitions Won' />}
          {selectedDefault.totalVolumeInTCs && (
            <BoxShow value={`$${userInfo.tradeTCVolume}`} title='Total Volume in TCs' />
          )}
          {selectedDefault.completedAchievements && (
            <BoxShow value={userAchievementsCompleted?.length} title='Completed Achievements' />
          )}
        </div>
        {showAchievement && (
          <div className='flex flex-1 justify-center gap-6'>
            {selectedAchievements &&
              selectedAchievements.map(item => (
                <AchievementItem title={item.label} subTitle={item.description} icon={item.icon} />
              ))}
          </div>
        )}
        <div className='absolute bottom-9 mt-[70px] flex w-full flex-row justify-between'>
          <di className='left-10'>
            <LogoIcon className='w-30 h-7' />
          </di>
          <div className='font-poppins gradient-text right-10 text-[16px]'>thena.fi/arena</div>
        </div>
      </div>
    </Box>
  )
}
