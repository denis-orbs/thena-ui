import { cn } from '@/lib/utils'
import { Lock2Icon } from '@/svgs'

export function RewardChapterTabNavigator({ chapters, selectedChapterIndex, setSelectedChapterIndex }) {
  return (
    <div className='flex gap-2 [&>div]:w-full [&>div]:lg:w-[188px]'>
      {chapters.map((chapter, index) => (
        <div
          key={chapter.id}
          type='button'
          className={cn(
            'cursor-pointer rounded-xl border-[1px] border-neutral-900 bg-neutral-900 px-4 py-[13px] text-sm font-medium leading-[35px] lg:px-7 lg:text-base',
            index === selectedChapterIndex - 1 ? 'col-span-2 border-primary-600 bg-primary-950' : 'border-neutral-700',
            !chapter.available ? 'cursor-not-allowed' : ' hover:border-primary-600',
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
            <span className={!chapter.available ? 'opacity-40' : ''}>{chapter.name}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
