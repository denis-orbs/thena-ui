import { useTranslations } from 'use-intl'

import { cn } from '@/lib/utils'
import { Lock2Icon } from '@/svgs'

export function LeaderBoardChapterTabNavigator({ leaderBoardNav, currentTabIndex, setCurrentTabIndex }) {
  const t = useTranslations()

  return (
    <div className='my-5 flex flex-row gap-3 overflow-x-auto p-3 lg:p-0'>
      {leaderBoardNav.map(chapterTab => (
        <div
          key={chapterTab.id}
          type='button'
          className={cn(
            'cursor-pointer rounded-xl border-[1px] border-neutral-900 bg-neutral-900 px-2 py-2 text-base font-medium lg:px-9 lg:py-4 lg:leading-[35px]',
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
          <div className='flex w-fit flex-row items-center justify-center'>
            {!chapterTab.available ? (
              <Lock2Icon className='mr-1 h-5 w-5' />
            ) : (
              <>{/* <ChapterLogoIcon className='mr-1 h-5 w-5' /> */}</>
            )}
            {/* ${t('Chapter')} ${chapterTab.name} */}
            <span
              className={cn(
                'w-fit text-[14px] lg:text-[16px]',
                !chapterTab.available ? 'opacity-40' : '',
                chapterTab.index === 1 ? 'min-w-[83px]' : chapterTab.index === 2 ? 'min-w-[66px]' : '',
              )}
            >
              {chapterTab.index > 2 && chapterTab.index === currentTabIndex ? (
                <>
                  <span className='hidden lg:block'>{t('Chapter')}</span>
                  {chapterTab.name}
                </>
              ) : (
                chapterTab.name
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
