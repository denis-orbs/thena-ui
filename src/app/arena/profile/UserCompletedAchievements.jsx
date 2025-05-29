import { gql } from 'graphql-request'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import Box from '@/components/box'
import Highlight from '@/components/highlight'
import { Paragraph, TextHeading } from '@/components/typography'
import { v4Client } from '@/lib/graphql'
import { sortAchievements } from '@/lib/utils'
import AchievementBasicIcon from '@/modules/Achievements/AchievementBasicIcon'
import { InfoCircleWhite } from '@/svgs'

const V4_USER_ACHIEVEMENT_COMPLETED = gql`
  query V4_USER_ACHIEVEMENT_COMPLETED($userId: String!) {
    userAchievements(
      where: { user: { id_eq: $userId }, achievedAt_isNull: false, achievement: { isHidden_eq: false } }
      orderBy: achievement_groupIndex_ASC
    ) {
      achievement {
        id
        name
        quantityTarget
        groupIndex
        typeIndex
        type
        icon
        description
      }
      currentQuantity
      achievedAt
    }
  }
`
export const fetchAchievements = async userId => {
  try {
    const { userAchievements } = await v4Client.request(V4_USER_ACHIEVEMENT_COMPLETED, { userId })
    return userAchievements
  } catch (error) {
    return {}
  }
}

export function UserCompletedAchievements({ userId }) {
  const t = useTranslations()

  const { data: userAchievementsCompleted, isLoading } = useSWR(['userAchievementsCompleted', userId], () =>
    fetchAchievements(userId.toLowerCase()),
  )

  const sortedData = useMemo(() => {
    if (Array.isArray(userAchievementsCompleted) && userAchievementsCompleted.length) {
      return userAchievementsCompleted.sort(sortAchievements)
    }

    return []
  }, [userAchievementsCompleted])

  if (isLoading) {
    return <Loading />
  }

  return (
    <div>
      <div className='space-y-3'>
        <TextHeading className='text-xl'>
          {t('Completed Achievements', {
            count: sortedData.length,
          })}
        </TextHeading>

        {Object.keys(sortedData).length ? (
          <Box className='grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 xl:grid-cols-12'>
            {sortedData.map(item => (
              <AchievementBasicIcon item={item} key={item.achievement.id} />
            ))}
          </Box>
        ) : (
          <div className='px-6'>
            <div className='flex w-full flex-col items-center justify-center gap-4'>
              <Highlight>
                <InfoCircleWhite className='h-4 w-4' />
              </Highlight>
              <div className='flex w-72 flex-col items-center gap-3 lg:w-[416px]'>
                <h2>{t('No Achievement found')}</h2>

                <Paragraph className='mt-3 text-center'>{t('User Have Not Achievement Yet')}</Paragraph>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
