import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import { TextHeading } from '@/components/typography'

import AchievementItem from './AchievementItem'

export function Completed({ data }) {
  const t = useTranslations()

  return (
    <div className='flex flex-col gap-3'>
      <TextHeading>
        {t('Completed Achievements', {
          count: data.length,
        })}
      </TextHeading>
      <Box className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5'>
        {data.map(item => (
          <AchievementItem item={item} key={item.achievement.id} />
        ))}
      </Box>
    </div>
  )
}
