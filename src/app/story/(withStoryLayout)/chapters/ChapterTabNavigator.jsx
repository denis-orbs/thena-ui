import { useTranslations } from 'use-intl'

import { cn } from '@/lib/utils'
import { Lock2Icon } from '@/svgs'

export function ChapterTabNavigator({ chapters, selectedChapterIndex, setSelectedChapterIndex }) {
  const t = useTranslations()

  const isAvailable = chapter => {
    if (chapter.index !== 1) {
      return chapter.available
    }
    return true
  }

  return (
    <div className='grid grid-cols-6 gap-3 lg:grid-cols-10'>
      {chapters.map(chapter => (
        <div
          key={chapter.id}
          type='button'
          className={cn(
            'cursor-pointer rounded-xl border-[1px] border-neutral-900 bg-neutral-900 py-[13px] text-[15px] font-medium leading-[35px]',
            chapter.index === selectedChapterIndex && 'shadow-linear col-span-2 border-primary-600',
            !isAvailable(chapter) ? 'cursor-not-allowed opacity-60' : ' hover:border-primary-600',
          )}
          disabled={!isAvailable(chapter)}
          onClick={() => {
            if (isAvailable(chapter)) {
              setSelectedChapterIndex(chapter.index)
            }
          }}
        >
          <div className='flex flex-row items-center justify-center '>
            {!isAvailable(chapter) ? (
              <Lock2Icon className='mr-1 h-5 w-5' />
            ) : (
              <>{/* <ChapterLogoIcon className='mr-1 h-5 w-5' /> */}</>
            )}
            <span className={!isAvailable(chapter) ? 'opacity-40' : ''}>
              {chapter.index === selectedChapterIndex ? `${t('Chapter')} ${chapter.index}` : chapter.index}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
