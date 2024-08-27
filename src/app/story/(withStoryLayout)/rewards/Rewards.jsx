import { useTranslations } from 'use-intl'

import Loading from '@/app/loading'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useFetchChaptersAndTasks } from '@/modules/Story'

import { FAQ } from './FAQ'
import { RewardChapter } from './RewardChapter'
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
        <TextHeading className='block font-archia text-3xl font-semibold leading-9'>{t('Rewards')}</TextHeading>
        <TextSubHeading>{t('Reward description')}</TextSubHeading>
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
