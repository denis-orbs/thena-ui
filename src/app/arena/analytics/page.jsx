'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

import Box from '@/components/box'
import { TextHeading } from '@/components/typography'
import { CreatedChart } from '@/modules/ArenaAnalytics/CreatedChart'
import { EntryFeeChart } from '@/modules/ArenaAnalytics/EntryFeeChart'
import { FollowingChart } from '@/modules/ArenaAnalytics/FollowingChart'
import { MintedChart } from '@/modules/ArenaAnalytics/MintedChart'
import { MintingSpendChart } from '@/modules/ArenaAnalytics/MintingSpendChart'
import { ParticipantChart } from '@/modules/ArenaAnalytics/ParticipantChart'
import { PrizePoolChart } from '@/modules/ArenaAnalytics/PrizePoolChart'
import UserChart from '@/modules/ArenaAnalytics/UserChart'
import { VolumeChart } from '@/modules/ArenaAnalytics/VolumeChart'

function AnalyticsPage() {
  const t = useTranslations()

  return (
    <div className='mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2'>
      <Box>
        <Link href='/arena/analytics/users'>
          <TextHeading>{t('ARENA Users')}</TextHeading>
        </Link>
        <UserChart />
      </Box>
      <Box>
        <Link href='/arena/analytics/created'>
          <TextHeading>{t('TC Created')}</TextHeading>
        </Link>
        <CreatedChart />
      </Box>
      <Box>
        <Link href='/arena/analytics/prize-pools'>
          <TextHeading>{t('Prize Pool')}</TextHeading>
        </Link>
        <PrizePoolChart />
      </Box>
      <Box>
        <Link href='/arena/analytics/entry-fees'>
          <TextHeading>{t('Entry Fee')}</TextHeading>
        </Link>
        <EntryFeeChart />
      </Box>
      <Box>
        <Link href='/arena/analytics/volume'>
          <TextHeading>{t('Volume')}</TextHeading>
        </Link>
        <VolumeChart />
      </Box>
      <Box>
        <Link href='/arena/analytics/participants'>
          <TextHeading>{t('Participants')}</TextHeading>
        </Link>
        <ParticipantChart />
      </Box>
      <Box>
        <Link href='/arena/analytics/minted'>
          <TextHeading>{t('Minted')}</TextHeading>
        </Link>
        <MintedChart />
      </Box>
      <Box>
        <Link href='/arena/analytics/minting-spend'>
          <TextHeading>{t('Minting Spend')}</TextHeading>
        </Link>
        <MintingSpendChart />
      </Box>
      <Box>
        <Link href='/arena/analytics/following'>
          <TextHeading>{t('Following')}</TextHeading>
        </Link>
        <FollowingChart />
      </Box>
    </div>
  )
}

export default AnalyticsPage
