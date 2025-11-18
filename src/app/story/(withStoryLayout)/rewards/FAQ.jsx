import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'

import { TextHeading } from '@/components/typography'
import ChevronDownIcon from '@/icons/ChevronDownIcon'
import cn from '@/utils/classes'

export function FAQ() {
  const t = useTranslations()
  const faqs = [
    {
      title: 'How To Win Rewards?',
      answer: 'How To Win Rewards Description',
    },
    {
      title: 'How To Earn Points?',
      answer: 'How To Earn Points Description',
    },
    {
      title: 'How To Earn Fragments?',
      answer: 'How To Earn Fragments Description',
    },
    {
      title: 'How to Claim Rewards?',
      answer: 'How to Claim Rewards Description',
    },
    {
      title: 'How Are Winners Selected?',
      answer: 'How Are Winners Selected Description',
    },
    {
      title: 'How Many Rewards Will Be In Total?',
      answer: 'How Many Rewards Will Be In Total Description',
    },
  ]

  const [expansions, setExpansions] = useState(faqs.map(() => false))
  const handleSetExpand = useCallback(
    index => {
      expansions[index] = !expansions[index]
      setExpansions([...expansions])
    },
    [expansions],
  )

  return (
    <div className='mt-[80px]'>
      <TextHeading className='font-archia text-[40px] leading-10 font-semibold'>{t('FAQs')}</TextHeading>
      <div className='mt-6 grid grid-cols-1 gap-0 rounded-xl bg-neutral-900 lg:grid-cols-3 lg:gap-[30px] lg:bg-transparent'>
        {faqs.map((faq, index) => (
          <div
            key={index}
            className='rounded-lg bg-neutral-900 p-6 pb-0 lg:pb-6'
            onClick={() => handleSetExpand(index)}
          >
            <div className='flex justify-between lg:block'>
              <TextHeading className='font-archia block text-[22px] leading-8 font-semibold tracking-tight'>
                {t(faq.title)}
              </TextHeading>
              {expansions[index] ? (
                <ChevronDownIcon isRevert className='cursor-pointer lg:hidden' />
              ) : (
                <ChevronDownIcon className='cursor-pointer lg:hidden' />
              )}
            </div>
            <span className={cn('text-base text-neutral-300 lg:block', expansions[index] ? 'block' : 'hidden')}>
              {t(faq.answer)}
            </span>
            {index !== faqs.length - 1 ? (
              <hr className='mt-4 border-neutral-600 lg:hidden' />
            ) : (
              <div className='mt-4' />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
