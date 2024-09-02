import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { Check2Icon } from '@/svgs'

import { TaskType } from '../../constant'

export function ChapterOverviewProcess({ chapter }) {
  const t = useTranslations()

  const mainTasks = useMemo(() => chapter.tasks.filter(task => task.type === TaskType.Main) ?? [], [chapter])

  const [totalTask, taskCompleted] = useMemo(
    () => [mainTasks.length ?? 0, mainTasks.filter(task => task.isCompleted)?.length ?? 0],
    [mainTasks],
  )
  const percentageTaskCompleted = useMemo(() => {
    if (totalTask) {
      return (taskCompleted / totalTask) * 100
    }
    return 0
  }, [totalTask, taskCompleted])

  return (
    <div className='border-gradient-secondary min-h-80 rounded-xl p-[1px]'>
      <div className='h-full rounded-[11px] bg-neutral-900 px-6 py-5'>
        <p className='text-center text-base font-medium leading-5 text-gray-400'>
          {taskCompleted}/{totalTask} {t('Tasks completed').toLowerCase()}
        </p>
        <div className='mt-2  inline-block h-[6px] w-full rounded-md bg-neutral-500'>
          <div
            style={{
              width: `${percentageTaskCompleted}%`,
            }}
            className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
          />
        </div>
        <hr className='my-4 border-neutral-600' />
        <div>
          <div className='flex items-center'>
            {/* <ChapterLogoIcon className='inlin h-5 w-5' /> */}
            <p className='text-gradient-primary inline-block text-base font-medium leading-5 tracking-[.03em]'>
              {t('Chapter').toUpperCase()} {chapter.index}
            </p>
          </div>
          <div className='my-4 mt-1 flex items-center '>
            {/* <Lock2Icon className='mr-1 inline-block h-[30px] w-[30px]' /> */}
            <h3 className='text-3xl font-semibold'>{Boolean(chapter.name) && t(chapter.name)}</h3>
          </div>

          {mainTasks.map(task => (
            <div className='mt-3 flex justify-between' key={task.id}>
              <span className='inline-block max-w-[calc(100%-20px)] text-gray-400'> • {t(task.name)}</span>
              {task.isCompleted && <Check2Icon className='inline-block h-5 w-5' />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
