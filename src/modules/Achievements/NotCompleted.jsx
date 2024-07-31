import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import { TextHeading } from '@/components/typography'

import NotAchievementItem from './NotAchievementItem'

export function NotCompleted({ achievements }) {
  const t = useTranslations()

  return (
    <div className='space-y-3'>
      <TextHeading>
        {t('Not Completed Achievements', {
          count: achievements.length,
        })}
      </TextHeading>
      <Box className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5'>
        {achievements.map(achievement => (
          <NotAchievementItem achievement={achievement} key={achievement.id} />
        ))}
      </Box>
    </div>
  )
}
