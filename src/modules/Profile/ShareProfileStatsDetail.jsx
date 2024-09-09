import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo, useRef } from 'react'

import Box from '@/components/box'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useFixViewport } from '@/hooks/useFixViewPort'
import { cn, formatAddress, formatAmount } from '@/lib/utils'
import { CheckIcon, LogoIcon } from '@/svgs'

import { VerifyPopover } from './VerifyPopover'

function BoxShow({ value, title, className }) {
  const t = useTranslations()
  return (
    <div
      className={cn(
        'flex h-[128px] w-[222px] flex-col justify-center gap-1 rounded-xl bg-white bg-opacity-5 p-5',
        className,
      )}
    >
      <TextHeading className='text-center text-[24px] leading-[28px]'>{value}</TextHeading>
      <TextSubHeading className='text-center text-sm text-neutral-300'>{t(title)}</TextSubHeading>
    </div>
  )
}

function AchievementItem({ title, subTitle, icon, className }) {
  return (
    <div className={cn('flex h-[134px] w-[222px] flex-col bg-transparent', className)}>
      <Image className='mx-auto mb-[-10px] mt-[-15px]' src={icon} width={80} height={85} alt='icon' />
      <TextHeading className='text-center text-[16px] leading-[28px]'>{title}</TextHeading>
      <TextSubHeading className='text-center text-sm text-neutral-300'>{subTitle}</TextSubHeading>
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
        <div className='mx-auto mb-10 mt-1 flex items-center justify-center'>
          <Image
            alt='avatar'
            src={userInfo.avatar?.replace('ipfs.io', 'w3s.link') ?? Avatar}
            className={`${userInfo.avatar ? 'rounded-full' : ''}`}
            width={64}
            height={64}
          />
          <div className='ml-3 flex items-center'>
            <TextHeading
              className={cn(
                'font-archia text-[26px] leading-[36px]',
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
            <div className='ml-1.5 h-5 w-5 stroke-neutral-200'>
              <CheckIcon />
            </div>
          </div>
        </div>
        <div className='flex h-[300px] flex-col items-center justify-center gap-9'>
          <div
            className={cn(
              'flex justify-center gap-4',
              showAchievement && selectedAchievements.length > 0
                ? ''
                : `flex-wrap ${totalDefault === 2 || totalDefault === 4 ? 'mx-[25%]' : ''}`,
            )}
          >
            {selectedDefault.rank && <BoxShow value={userInfo.rank} title='Rank' />}
            {/* TODO: change data */}
            {selectedDefault.numberOfTCsWon && <BoxShow value={0} title='Trading Competitions Won' />}
            {selectedDefault.totalVolumeInTCs && (
              <BoxShow value={`$${formatAmount(userInfo.tradeTCVolume)}`} title='Total Volume in TCs' />
            )}
            {selectedDefault.completedAchievements && (
              <BoxShow value={userAchievementsCompleted?.length} title='Completed Achievements' />
            )}
          </div>
          {showAchievement && (
            <div className='flex justify-center gap-4'>
              {selectedAchievements &&
                selectedAchievements.map(item => (
                  <AchievementItem title={item.label} subTitle={item.description} icon={item.icon} />
                ))}
            </div>
          )}
        </div>
        <div className='absolute bottom-0 left-0 flex w-full justify-between px-10 py-9'>
          <LogoIcon className='w-30 h-7' />
          <div className='font-poppins gradient-text text-[16px]'>thena.fi/arena</div>
        </div>
      </div>
    </Box>
  )
}
