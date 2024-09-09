import Image from 'next/image'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo, useRef } from 'react'

import { TextHeading } from '@/components/typography'
import { useFixViewport } from '@/hooks/useFixViewPort'
import { cn, formatAddress } from '@/lib/utils'
import { Verified } from '@/svgs'

import ImagePreview from './ImagePreview'

export default function ShareProfileStatsDetail({
  userInfo,
  className,
  selectedDefault,
  showAchievement,
  totalCompleted,
  selectedAchievements,
  competition,
}) {
  const parentRef = useRef(null)
  const childRef = useRef(null)

  useFixViewport(parentRef, childRef)

  const totalDefault = useMemo(() => {
    const values = Object.values(selectedDefault)
    const result = values.reduce((prev, cur) => prev + (cur ? 1 : 0), 0)
    return result
  }, [selectedDefault])

  return (
    <>
      <div className={className} ref={parentRef}>
        <div
          ref={childRef}
          className="relative h-[576px] w-[1024px] rounded-xl bg-[url('/images/arena/bg-image-share-profile.png')] bg-cover px-2 py-6 lg:p-6"
        >
          <div>
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
                {userInfo?.isVerified && <Verified className='ml-1 h-5 w-5' />}
              </div>
            </div>
            <ImagePreview
              showAchievement={showAchievement}
              selectedAchievements={selectedAchievements}
              totalDefault={totalDefault}
              selectedDefault={selectedDefault}
              userInfo={userInfo}
              totalCompleted={totalCompleted}
              competition={competition}
            />
          </div>
        </div>
      </div>
      <div
        id='share-origin'
        className="fixed left-[100vh] top-[100vh] hidden !h-[576px] !w-[1024px] bg-[url('/images/arena/bg-image-share-profile.png')] bg-cover py-6"
      >
        <div>
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
              {userInfo?.isVerified && <Verified className='ml-1 h-5 w-5 cursor-pointer' />}
            </div>
          </div>

          <ImagePreview
            showAchievement={showAchievement}
            selectedAchievements={selectedAchievements}
            totalDefault={totalDefault}
            selectedDefault={selectedDefault}
            userInfo={userInfo}
            totalCompleted={totalCompleted}
            competition={competition}
          />
        </div>
      </div>
    </>
  )
}
