import { useTranslations } from 'use-intl'

import Loading from '@/app/loading'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useFetchChaptersAndTasks } from '@/modules/Story'

import { RewardChapter } from './chapters/RewardChapter'
import { FAQ } from './FAQ'
import { RewardFragments } from './RewardFragments'

export function Rewards({ address }) {
  const t = useTranslations()

  const { campaignChapters: chapters, isLoading: isLoadingChapterTasks } = useFetchChaptersAndTasks(address)

  if (isLoadingChapterTasks) {
    return <Loading />
  }
  return (
    <div>
      <div className='mt-[10px]'>
        <TextHeading className='font-archia block text-3xl font-semibold'>{t('Rewards')}</TextHeading>
        <TextSubHeading className='mt-2 block text-base text-neutral-300'>{t('Reward description')}</TextSubHeading>
      </div>
      <div className='mt-6'>
        <div className='grid grid-cols-1 gap-[30px] lg:grid-cols-10'>
          <RewardChapter chapters={chapters} />
          <RewardFragments />
        </div>
      </div>

      <FAQ />
    </div>
  )
}
