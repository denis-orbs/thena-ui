import { useTranslations } from 'use-intl'

import { cn } from '@/lib/utils'
import { Lock2Icon } from '@/svgs'

export function LeaderBoardChapterTabNavigator({ leaderBoardNav, currentTabIndex, setCurrentTabIndex }) {
  const t = useTranslations()

  return (
    <div className='my-5 flex w-fit flex-wrap gap-3'>
      {leaderBoardNav.map(chapterTab => (
        <div
          key={chapterTab.id}
          type='button'
          className={cn(
            'cursor-pointer rounded-xl border-[1px] border-neutral-900 bg-neutral-900 px-9 py-4 text-base font-medium leading-[35px]',
            chapterTab.index === currentTabIndex && 'col-span-2 border-primary-600 bg-primary-950',
            !chapterTab.available ? 'cursor-not-allowed opacity-60' : ' hover:border-primary-600',
          )}
          disabled={!chapterTab.available}
          onClick={() => {
            if (chapterTab.available) {
              setCurrentTabIndex(chapterTab.index)
            }
          }}
        >
          <div className='flex flex-row items-center justify-center '>
            {!chapterTab.available ? (
              <Lock2Icon className='mr-1 h-5 w-5' />
            ) : (
              <>{/* <ChapterLogoIcon className='mr-1 h-5 w-5' /> */}</>
            )}
            <span className={!chapterTab.available ? 'opacity-40' : ''}>
              {chapterTab.index !== 1 && chapterTab.index === currentTabIndex
                ? `${t('Chapter')} ${chapterTab.name}`
                : chapterTab.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
