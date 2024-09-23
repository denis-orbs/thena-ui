import { useTranslations } from 'next-intl'

import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { HowItWorksItem } from '@/modules/Story/HowItWorksItem'
import { BankIcon, FingerprintIcon, THETokenIcon } from '@/svgs'

const rewards = [
  {
    id: '1',
    index: 1,
    name: 'THE Tokens',
    description: 'Tokens will be distributed among 100 winners.',
    icon: THETokenIcon,
  },
  {
    id: '2',
    index: 2,
    name: '2 theNFTs',
    description: 'You can stake theNFT to earn THE tokens.',
    icon: BankIcon,
  },
  {
    id: '3',
    index: 3,
    name: '1 THENA ID',
    description: 'Use Thena ID to customise your THENA profile.',
    icon: FingerprintIcon,
  },
]

export function RewardChapter12() {
  const t = useTranslations()

  return (
    <>
      <div className='mb-4 mt-4 lg:mb-[60px] lg:mt-11'>
        <TextHeading className='font-archia text-3xl font-semibold'>
          <span>{t('Rewards in USD')}: </span>
          <span className='text-primary-600'>$16,000</span>
        </TextHeading>
      </div>

      <div className='grid grid-cols-2 lg:grid-cols-3'>
        {rewards.map((reward, index) => (
          <div
            key={reward.id}
            className={cn(
              'flex items-start justify-center',
              index === rewards.length - 1 ? 'col-span-2 lg:col-span-1' : 'col-span-1',
            )}
          >
            <HowItWorksItem
              key={reward.id}
              icon={reward.icon}
              title={reward.name}
              description={reward.description}
              className='w-auto p-0 md:w-full lg:p-6'
            />
          </div>
        ))}
      </div>

      <hr className='my-4 border-neutral-600' />
    </>
  )
}
