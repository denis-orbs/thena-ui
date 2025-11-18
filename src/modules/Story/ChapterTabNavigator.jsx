import Image from 'next/image'
import { useTranslations } from 'use-intl'

import cn from '@/utils/classes'

export function ChapterTabNavigator({ nav, currentTabIndex, setCurrentTabIndex, classOfButton }) {
  const t = useTranslations()

  return (
    <div className='flex flex-row gap-2 overflow-x-auto p-3 lg:gap-3 lg:p-0'>
      {nav.map(chapterTab => (
        <button
          key={chapterTab.id}
          type='button'
          className={cn(
            'rounded-xl border border-neutral-900 bg-neutral-900 p-2 text-base font-medium lg:px-9 lg:py-4 lg:leading-[35px]',
            chapterTab.index === currentTabIndex && 'border-primary-600 bg-primary-950 col-span-2',
            !chapterTab.available ? 'cursor-not-allowed opacity-60 lg:px-5' : 'hover:border-primary-600',
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
            {!chapterTab.available && <Image src='/svgs/lock-2.svg' className='mr-1 h-5 w-5' />}
            <span
              className={cn('flex text-[14px] whitespace-nowrap lg:text-[16px]', !chapterTab.available && 'opacity-40')}
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
