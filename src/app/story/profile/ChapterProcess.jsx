import { useTranslations } from 'next-intl'

export function ChapterProcess({ chapter }) {
  const t = useTranslations()

  return (
    <div className='mt-5'>
      <p className='font-bold text-gradient'>
        {t('Chapter').toUpperCase()} {chapter.index}
      </p>
      <h3 className='font-bold'>{chapter.title}</h3>

      <div className=''>
        {chapter.tasks.map(task => (
          <div
            key={task.id}
            className='mt-3 flex flex-col items-center justify-between rounded-lg bg-neutral-800 p-3 lg:flex-row '
          >
            <p>{task.title}</p>
            {task.completed ? (
              <div className='mt-2 rounded-lg bg-neutral-700 px-5 py-2 lg:mt-0 lg:px-4 lg:py-2.5 lg:text-base'>
                {t('Completed')}
              </div>
            ) : (
              <a href='./'>
                <div className='mt-2 rounded-lg bg-fuchsia-500 px-5 py-2 lg:mt-0 lg:px-4 lg:py-2.5 lg:text-base'>
                  {t('Start task')} &gt;
                </div>
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
