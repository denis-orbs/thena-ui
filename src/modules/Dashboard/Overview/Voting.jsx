import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useEpochTimer } from '@/hooks/useGeneral'
import { formatAmount } from '@/lib/utils'

function Voting() {
  const { push } = useRouter()
  const t = useTranslations()
  const { epochStart, epochEnd, epoch, days } = useEpochTimer()
  return (
    <Box className='flex flex-col gap-2'>
      <TextHeading className='font-archia text-xl font-semibold'>
        {t('Voting for [value]', { value: formatAmount(19548458) })}
      </TextHeading>
      <div className='fex flex-col gap-4'>
        <Paragraph>{`${t('Epoch')} ${epoch} ${epochStart}-${epochEnd}`}</Paragraph>
        <div className='h-[240px] w-full'>pie chart</div>
      </div>
      <TextSubHeading className='font-archia text-xl font-semibold'>
        {t('Epoch End in')} <span className='text-primary-700'>{days} Days</span>
      </TextSubHeading>
      <EmphasisButton className='w-full' onClick={() => push('/dashboard/vote')}>
        {t('Vote')}
      </EmphasisButton>
    </Box>
  )
}

export default Voting
