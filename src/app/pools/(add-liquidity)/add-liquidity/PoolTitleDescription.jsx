import { useTranslations } from 'next-intl'

import { NewTextHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'

const descriptionSections = {
  [PAIR_TYPES.STABLE]: {
    text: 'Stable Pool',
    description: 'Stable Desc new',
  },
  [PAIR_TYPES.CLASSIC]: {
    text: 'Classic',
    description: 'Classic Desc',
  },
  [PAIR_TYPES.WEIGHTED]: {
    text: 'Weighted',
    description: 'Weighted Desc',
  },
  [PAIR_TYPES.LSD]: {
    text: 'Conc Liquidity',
    description: 'Conc Desc',
  },
}

export default function PoolDescriptionSection({ pairType }) {
  const t = useTranslations()

  const { text, description } = descriptionSections[pairType] ?? descriptionSections[PAIR_TYPES.LSD]

  return (
    <div className='hidden h-max flex-col gap-2 rounded-md bg-neutral-900 p-4 lg:flex'>
      <NewTextHeading className='hidden text-xl md:block md:text-xl'>{t(text)}</NewTextHeading>
      <Paragraph className='text-sm text-neutral-400 md:text-base'>{t(description)}</Paragraph>
    </div>
  )
}
