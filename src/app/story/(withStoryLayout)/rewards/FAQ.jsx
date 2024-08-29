import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'

import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { CollapseUpIcon, ExpandDownIcon } from '@/svgs'

export function FAQ() {
  const t = useTranslations()
  const faqs = [
    {
      title: 'How To Win Rewards?',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non nisi lacinia, tristique arcu a, faucibus orci. Aenean sit amet augue lacus. Proin ullamcorpe.',
    },
    {
      title: 'How To Earn Points?',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non nisi lacinia, tristique arcu a, faucibus orci. Aenean sit amet augue lacus. Proin ullamcorpe.',
    },
    {
      title: 'How To Earn Fragments?',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non nisi lacinia, tristique arcu a, faucibus orci. Aenean sit amet augue lacus. Proin ullamcorpe.',
    },
    {
      title: 'How to Claim Rewards?',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non nisi lacinia, tristique arcu a, faucibus orci. Aenean sit amet augue lacus. Proin ullamcorpe.',
    },
    {
      title: 'What is the Winner Selection Method?',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non nisi lacinia, tristique arcu a, faucibus orci. Aenean sit amet augue lacus. Proin ullamcorpe.',
    },
    {
      title: 'How Many Rewards Will Be In Total?',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non nisi lacinia, tristique arcu a, faucibus orci. Aenean sit amet augue lacus. Proin ullamcorpe.',
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
    <div className='mt-[80px] '>
      <TextHeading className='font-archia text-[40px] font-semibold leading-10'>{t('FAQs')}</TextHeading>
      <div className='mt-6 grid grid-cols-1 gap-0 rounded-xl bg-neutral-900 lg:grid-cols-3 lg:gap-[30px] lg:bg-transparent'>
        {faqs.map((faq, index) => (
          <div
            key={index}
            className='rounded-lg bg-neutral-900 p-6 pb-0 lg:pb-6'
            onClick={() => handleSetExpand(index)}
          >
            <div className='flex justify-between lg:block'>
              <TextHeading className='block font-archia text-[22px] font-semibold leading-8 tracking-tight'>
                {faq.title}
              </TextHeading>
              {expansions[index] ? (
                <CollapseUpIcon className='h-5 w-5 cursor-pointer lg:hidden' />
              ) : (
                <ExpandDownIcon className='h-5 w-5 cursor-pointer lg:hidden' />
              )}
            </div>
            <span className={cn('text-base text-neutral-300 lg:block ', expansions[index] ? 'block ' : 'hidden')}>
              {faq.answer}
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
