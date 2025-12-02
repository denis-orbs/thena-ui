'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import Box from '@/components/box'
import { TextHeading } from '@/components/typography'

// Dynamically import heavy chart components to reduce initial bundle size
const CreatedChart = dynamic(
  () => import('@/modules/ArenaAnalytics/CreatedChart').then(mod => ({ default: mod.CreatedChart })),
  { ssr: false },
)
const EntryFeeChart = dynamic(
  () => import('@/modules/ArenaAnalytics/EntryFeeChart').then(mod => ({ default: mod.EntryFeeChart })),
  { ssr: false },
)
const FollowingChart = dynamic(
  () => import('@/modules/ArenaAnalytics/FollowingChart').then(mod => ({ default: mod.FollowingChart })),
  { ssr: false },
)
const MintedChart = dynamic(
  () => import('@/modules/ArenaAnalytics/MintedChart').then(mod => ({ default: mod.MintedChart })),
  { ssr: false },
)
const MintingSpendChart = dynamic(
  () => import('@/modules/ArenaAnalytics/MintingSpendChart').then(mod => ({ default: mod.MintingSpendChart })),
  { ssr: false },
)
const ParticipantChart = dynamic(
  () => import('@/modules/ArenaAnalytics/ParticipantChart').then(mod => ({ default: mod.ParticipantChart })),
  { ssr: false },
)
const PrizePoolChart = dynamic(
  () => import('@/modules/ArenaAnalytics/PrizePoolChart').then(mod => ({ default: mod.PrizePoolChart })),
  { ssr: false },
)
const UserChart = dynamic(() => import('@/modules/ArenaAnalytics/UserChart'), { ssr: false })
const VolumeChart = dynamic(
  () => import('@/modules/ArenaAnalytics/VolumeChart').then(mod => ({ default: mod.VolumeChart })),
  { ssr: false },
)

function AnalyticsPage() {
  const t = useTranslations()

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
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
