import Image from 'next/image'

import { TextHeading, TextSubHeading } from '@/components/typography'
import { cn, formatAmount, rewriteS3Host } from '@/lib/utils'
import { LogoFooterIcon, LogoIcon } from '@/svgs'

function BoxShow({ value, title, className }) {
  return (
    <div
      className={cn(
        'bg-opacity-5 flex h-[128px] w-[222px] flex-col justify-center gap-1 rounded-xl bg-white p-5',
        className,
      )}
    >
      <TextHeading className='text-center text-[24px] leading-[28px]'>{value}</TextHeading>
      <TextSubHeading className='text-center text-sm text-neutral-300'>{title}</TextSubHeading>
    </div>
  )
}

function AchievementItem({ achievement, title, subTitle, className }) {
  return (
    <div className={cn('flex h-[134px] w-[222px] flex-col bg-transparent', className)}>
      <Image
        className='mx-auto mt-[-15px] mb-[-10px]'
        crossOrigin='anonymous'
        src={`/s3/image/${rewriteS3Host(achievement?.icon)}`}
        width={80}
        height={85}
        alt='icon'
      />
      <TextHeading className='text-center text-[16px] leading-[28px]'>{title}</TextHeading>
      <TextSubHeading className='text-center text-sm text-neutral-300'>{subTitle}</TextSubHeading>
    </div>
  )
}

function ImagePreview({
  showAchievement,
  selectedAchievements,
  totalDefault,
  selectedDefault,
  userInfo,
  totalCompleted,
  competition,
}) {
  return (
    <>
      <div className='flex h-[300px] flex-col items-center justify-center gap-9'>
        <div
          className={cn(
            'flex justify-center gap-4',
            showAchievement && selectedAchievements.length > 0
              ? ''
              : `flex-wrap ${totalDefault === 2 || totalDefault === 4 ? 'mx-[25%] w-[462px]' : ''}`,
          )}
        >
          {selectedDefault.rank && <BoxShow value={userInfo.rank} title='Rank' />}
          {selectedDefault.numberOfTCsWon && <BoxShow value={competition} title='Trading Competitions Won' />}
          {selectedDefault.totalVolumeInTCs && (
            <BoxShow value={`$${formatAmount(userInfo.tradeTCVolume)}`} title='Total Volume in TCs' />
          )}
          {selectedDefault.completedAchievements && <BoxShow value={totalCompleted} title='Completed Achievements' />}
        </div>
        {showAchievement && (
          <div className='flex justify-center gap-4'>
            {selectedAchievements &&
              selectedAchievements.map(item => (
                <AchievementItem
                  key={item.id}
                  achievement={item}
                  title={item.label}
                  subTitle={item.description}
                  icon={item.icon}
                />
              ))}
          </div>
        )}
      </div>
      <div className='absolute bottom-0 left-0 flex w-full justify-between px-10 py-9'>
        <LogoIcon className='h-7 w-30' />
        <LogoFooterIcon className='h-6 w-[118px]' />
      </div>
    </>
  )
}
export default ImagePreview
