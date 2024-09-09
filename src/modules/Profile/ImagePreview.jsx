import Image from 'next/image'

import { TextHeading, TextSubHeading } from '@/components/typography'
import { cn, formatAmount } from '@/lib/utils'
import achievements from '@/modules/Profile/achievements.json'
import { LogoFooterIcon, LogoIcon } from '@/svgs'

function BoxShow({ value, title, className }) {
  return (
    <div
      className={cn(
        'flex h-[128px] w-[222px] flex-col justify-center gap-1 rounded-xl bg-white bg-opacity-5 p-5',
        className,
      )}
    >
      <TextHeading className='text-center text-[24px] leading-[28px]'>{value}</TextHeading>
      <TextSubHeading className='text-center text-sm text-neutral-300'>{title}</TextSubHeading>
    </div>
  )
}

function AchievementItem({ title, subTitle, className }) {
  let localIcon = ''
  achievements.map(item => {
    if (item.name === title) {
      localIcon = item.icon
    }
    return null
  })
  return (
    <div className={cn('flex h-[134px] w-[222px] flex-col bg-transparent', className)}>
      <Image className='mx-auto mb-[-10px] mt-[-15px]' src={localIcon} width={80} height={85} alt='icon' />
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
          {/* TODO: change data */}
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
                <AchievementItem title={item.label} subTitle={item.description} icon={item.icon} />
              ))}
          </div>
        )}
      </div>
      <div className='absolute bottom-0 left-0 flex w-full justify-between px-10 py-9'>
        <LogoIcon className='w-30 h-7' />
        <LogoFooterIcon className='h-6 w-[118px]' />
      </div>
    </>
  )
}
export default ImagePreview
