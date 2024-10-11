import Image from 'next/image'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo, useRef } from 'react'

import { TextHeading } from '@/components/typography'
import { useFixViewport } from '@/hooks/useFixViewPort'
import { useSpaceIdBNB } from '@/hooks/useSpaceIdBNB'
import { cn, formatAddress, rewriteS3Host } from '@/lib/utils'
import { Verified } from '@/svgs'

import ImagePreview from './ImagePreview'
import { VerifyPopover } from './VerifyPopover'

export default function ShareProfileStatsDetail({
  userInfo,
  className,
  selectedDefault,
  showAchievement,
  totalCompleted,
  selectedAchievements,
  competition,
}) {
  const { spaceIdName } = useSpaceIdBNB(userInfo.id)

  const parentRef = useRef(null)
  const childRef = useRef(null)

  useFixViewport(parentRef, childRef)

  const totalDefault = useMemo(() => {
    const values = Object.values(selectedDefault)
    const result = values.reduce((prev, cur) => prev + (cur ? 1 : 0), 0)
    return result
  }, [selectedDefault])

  return (
    <div className={className}>
      <div ref={parentRef}>
        <div
          ref={childRef}
          className="relative h-[576px] w-[1024px] origin-top-left rounded-xl bg-[url('/images/arena/bg-image-share-profile.png')] bg-cover px-2 py-6 lg:p-6"
        >
          <div>
            <div className='mx-auto mb-10 mt-1 flex items-center justify-center'>
              <Image
                alt='avatar'
                crossOrigin='anonymous'
                src={
                  userInfo.avatar?.replace('ipfs.io', 'w3s.link').includes('https://w3s.link/')
                    ? userInfo.ipfsAvatar
                      ? `/s3/image/${rewriteS3Host(userInfo.ipfsAvatar)}`
                      : Avatar
                    : userInfo.avatar
                      ? `/s3/image/${rewriteS3Host(userInfo.avatar)}`
                      : Avatar
                }
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
                    {userInfo.username || spaceIdName || formatAddress(userInfo.id)}
                  </span>
                </TextHeading>
                {userInfo?.isVerified && (
                  <VerifyPopover verifyImage={userInfo?.checkMarkIcon} verifiedAt={userInfo?.verifiedAt} />
                )}
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
              crossOrigin='anonymous'
              src={
                userInfo.avatar?.replace('ipfs.io', 'w3s.link').includes('https://w3s.link/')
                  ? userInfo.ipfsAvatar
                    ? `/s3/image/${rewriteS3Host(userInfo.ipfsAvatar)}`
                    : Avatar
                  : userInfo.avatar
                    ? `/s3/image/${rewriteS3Host(userInfo.avatar)}`
                    : Avatar
              }
              className={`${userInfo.avatar ? 'rounded-full' : ''}`}
              width={64}
              height={64}
            />
            <div className='ml-3 flex items-center'>
              <TextHeading
                className={cn(
                  'pb-5 font-archia text-[26px] leading-[36px]',
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
                  {userInfo.username || spaceIdName || formatAddress(userInfo.id)}
                </span>
              </TextHeading>
              {userInfo?.isVerified && (
                <>
                  {userInfo?.checkMarkIcon ? (
                    <Image
                      src={`/s3/icon-checkmark/${rewriteS3Host(userInfo?.checkMarkIcon)}`}
                      width={20}
                      height={20}
                      className='ml-1 h-5 w-5 cursor-pointer'
                      alt='demo-checkmark'
                    />
                  ) : (
                    <Verified className='ml-1 h-5 w-8 cursor-pointer' />
                  )}
                </>
              )}
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
  )
}
