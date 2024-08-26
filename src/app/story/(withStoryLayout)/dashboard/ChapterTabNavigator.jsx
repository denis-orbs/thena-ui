import { useTranslations } from 'use-intl'

import { cn } from '@/lib/utils'
import { Lock2Icon } from '@/svgs'

export function ChapterTabNavigator({ chapters, selectedChapterIndex, setSelectedChapterIndex }) {
  const t = useTranslations()
  return (
    <div className='grid grid-cols-2 gap-[14px] lg:grid-cols-4'>
      {chapters.map((chapter, index) => (
        <div
          key={chapter.id}
          type='button'
          className={cn(
            'cursor-pointer rounded-xl border-[1px] border-neutral-900 bg-neutral-900 py-[13px] text-[15px] font-medium leading-[35px]',
            index === selectedChapterIndex - 1 && 'border-primary-600',
            !chapter.available ? 'cursor-not-allowed' : 'hover:border-primary-600',
          )}
          disabled={!chapter.available}
          onClick={() => {
            if (chapter.available) {
              setSelectedChapterIndex(index + 1)
            }
          }}
        >
          <div className='flex flex-row items-center justify-center '>
            {!chapter.available ? (
              <Lock2Icon className='mr-1 h-5 w-5' />
            ) : (
              <>{/* <ChapterLogoIcon className='mr-1 h-5 w-5' /> */}</>
            )}
            <span className={!chapter.available ? 'opacity-40' : ''}>{`${t('Chapter')} ${index + 1}`}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
