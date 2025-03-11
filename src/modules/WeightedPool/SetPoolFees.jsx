import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import Selection from '@/components/selection'
import { Paragraph, TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { InfoNeutralIcon } from '@/svgs'

export default function SetPoolFees({ fees, setFees }) {
  const [show, setShow] = useState(false)
  const t = useTranslations()
  const poolRange = useMemo(
    () => [
      {
        label: '0,1%',
        active: fees === 0.1,
        onClickHandler: () => setFees(0.1),
      },
      {
        label: '0,3%',
        active: fees === 0.3,
        onClickHandler: () => setFees(0.3),
      },
      {
        label: '1,00%',
        active: fees === 1.0,
        onClickHandler: () => setFees(1.0),
      },
    ],
    [fees, setFees],
  )

  const isCustomFee = useMemo(() => fees !== null && fees !== 0.1 && fees !== 0.3 && fees !== 1, [fees])

  return (
    <div className='space-y-4'>
      <div className={show ? 'space-y-2' : ''}>
        <div className='flex flex-row items-center justify-between'>
          <TextHeading className='text-xl md:text-2xl lg:font-archia lg:text-3xl lg:font-semibold'>
            {t('Set Pool Fees')}
          </TextHeading>
          <EmphasisButton
            className='ml-auto block w-fit bg-neutral-600 p-2 lg:hidden'
            onClick={() => setShow(prev => !prev)}
          >
            <InfoNeutralIcon className='h-4 w-4' />
          </EmphasisButton>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className='overflow-hidden lg:hidden'
        >
          <Box className='flex flex-col gap-2 p-4'>
            <div className='flex flex-col gap-2'>
              <TextHeading className='text-lg'>{t('Pool Fees')}</TextHeading>
              <Paragraph className='text-sm text-neutral-400'>
                {t('Pool [fees] sidebar description', { fees })}
              </Paragraph>
            </div>
            <div className='flex flex-col gap-2'>
              <TextHeading className='text-lg'>{t('Thena Governance')}</TextHeading>
              <Paragraph className='text-sm text-neutral-400'>{t('Thena Governance description')}</Paragraph>
            </div>
          </Box>
        </motion.div>
      </div>
      <div className='flex flex-col gap-2'>
        <div className='flex flex-row items-center justify-between'>
          <Paragraph className='hidden lg:block'>{t('Fees')}</Paragraph>
          <Selection className='!h-11 bg-transparent' data={poolRange} isTranslation={false} />
        </div>
        <Input
          onChange={e => {
            setFees(e.target.value)
          }}
          className={cn('h-11 w-full', isCustomFee ? 'bg-neutral-700 font-medium text-neutral-200' : '')}
          placeholder='Set Custom Fee'
          suffix='%'
          classNames={{ input: 'pr-7 h-11' }}
        />
      </div>
    </div>
  )
}
