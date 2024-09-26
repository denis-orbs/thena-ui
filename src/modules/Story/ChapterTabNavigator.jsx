import { useTranslations } from 'use-intl'

import { cn } from '@/lib/utils'
import { Lock2Icon } from '@/svgs'

export function ChapterTabNavigator({ nav, currentTabIndex, setCurrentTabIndex, classOfButton }) {
  const t = useTranslations()

  return (
    <div className='flex flex-row gap-2 overflow-x-auto p-3 lg:gap-3 lg:p-0'>
      {nav.map(chapterTab => (
        <button
          key={chapterTab.id}
          type='button'
          className={cn(
            'rounded-xl border-[1px] border-neutral-900 bg-neutral-900 p-2 text-base font-medium lg:px-9 lg:py-4 lg:leading-[35px]',
            chapterTab.index === currentTabIndex && 'col-span-2 border-primary-600 bg-primary-950',
            !chapterTab.available ? 'cursor-not-allowed opacity-60 lg:px-5' : ' hover:border-primary-600',
            classOfButton,
          )}
          disabled={!chapterTab.available}
          onClick={() => {
            if (chapterTab.available) {
              setCurrentTabIndex(chapterTab.index)
            }
          }}
        >
          <div className='flex flex-row items-center'>
            {!chapterTab.available && <Lock2Icon className='mr-1 h-5 w-5' />}
            <span
              className={cn('flex whitespace-nowrap text-[14px] lg:text-[16px]', !chapterTab.available && 'opacity-40')}
            >
              {chapterTab.index === currentTabIndex && chapterTab.index > 1 ? (
                <>
                  <span className='mr-1 hidden lg:block'>{t('Chapter')}</span>
                  <span>{chapterTab.name}</span>
                </>
              ) : (
                chapterTab.name
              )}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
