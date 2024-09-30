import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

import { ChapterTabNavigator } from '@/modules/Story/ChapterTabNavigator'
import { BankIcon, FingerprintIcon, THETokenIcon } from '@/svgs'

import RewardChapterDetail from './RewardChapterDetail'
import RewardChapterFooter from './RewardChapterFooter'

// TODO: replace mock data
const rewards = [
  {
    id: 2,
    index: 2,
    reward: {
      rewardsInUSD: '16,000',
      items: [
        {
          id: '1',
          index: 1,
          name: 'THE Tokens',
          description: 'Tokens will be distributed among 100 winners.',
          icon: THETokenIcon,
        },
        {
          id: '2',
          index: 2,
          name: '2 theNFTs',
          description: 'You can stake theNFT to earn THE tokens.',
          icon: BankIcon,
        },
        {
          id: '3',
          index: 3,
          name: '1 THENA ID',
          description: 'Use Thena ID to customise your THENA profile.',
          icon: FingerprintIcon,
        },
      ],
    },
  },
  {
    id: 3,
    index: 3,
    reward: {
      rewardsInUSD: '7,000',
      items: [
        {
          id: '1',
          index: 1,
          name: 'Tokens',
          description: '$3k worth of tokens will be distributed among 100 winners',
          icon: THETokenIcon,
        },
        {
          id: '3',
          index: 3,
          name: '1 THENA ID',
          description: 'One winner will receive cz.thena (worth $4k)',
          icon: FingerprintIcon,
        },
      ],
    },
  },
]

export function RewardChapter({ chapters }) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(2)

  const rewardChapterNav = useMemo(() => {
    const currentTime = new Date()
    const [start12, start3, start4, start5, start6, start7, start8] = [
      chapters?.[1]?.startTimestamp,
      chapters?.[2]?.startTimestamp,
      chapters?.[3]?.startTimestamp,
      chapters?.[4]?.startTimestamp,
      chapters?.[5]?.startTimestamp,
      chapters?.[6]?.startTimestamp,
      chapters?.[7]?.startTimestamp,
    ]

    return [
      {
        id: 1,
        index: 1,
        name: 'All Chapters',
        available: false,
      },
      {
        id: 2,
        index: 2,
        name: '1 and 2',
        available: start12 && currentTime > new Date(start12),
      },
      {
        id: 3,
        index: 3,
        name: '3',
        available: start3 && currentTime > new Date(start3),
      },
      {
        id: 4,
        index: 4,
        name: '4',
        available: start4 && currentTime > new Date(start4),
      },
      {
        id: 5,
        index: 5,
        name: '5',
        available: start5 && currentTime > new Date(start5),
      },
      {
        id: 6,
        index: 6,
        name: '6',
        available: start6 && currentTime > new Date(start6),
      },
      {
        id: 7,
        index: 7,
        name: '7',
        available: start7 && currentTime > new Date(start7),
      },
      {
        id: 8,
        index: 8,
        name: '8',
        available: start8 && currentTime > new Date(start8),
      },
    ]
  }, [chapters])

  const currentChapter = useMemo(
    () => chapters.find(chapter => chapter.index === selectedChapterIndex),
    [chapters, selectedChapterIndex],
  )

  const currentRewardChapter = useMemo(
    () => rewards.find(reward => reward.index === selectedChapterIndex),
    [selectedChapterIndex],
  )

  return (
    <div className='border-gradient-secondary w-full rounded-xl bg-neutral-900 p-[1px] lg:col-span-6 '>
      <div className='rounded-xl bg-neutral-900 p-4 lg:p-8'>
        <ChapterTabNavigator
          nav={rewardChapterNav}
          currentTabIndex={selectedChapterIndex}
          setCurrentTabIndex={setSelectedChapterIndex}
          classOfButton='lg:!px-3 lg:!py-2'
        />
        <div>
          <RewardChapterDetail
            rewards={currentRewardChapter?.reward}
            rewardsTimestamp={currentChapter?.rewardsTimestamp}
          />
          {selectedChapterIndex === 1 ? (
            <RewardChapterFooter
              startTime={dayjs(chapters?.[0]?.startTimestamp ?? 0)}
              endTime={chapters?.[1]?.endTimestamp ? dayjs(chapters[1]?.endTimestamp).add(1, 'weeks') : dayjs(0)}
            />
          ) : (
            <RewardChapterFooter
              startTime={dayjs(currentChapter?.startTimestamp ?? 0)}
              endTime={currentChapter?.rewardsTimestamp ? dayjs(currentChapter?.rewardsTimestamp) : null}
              currentTabIndex={selectedChapterIndex}
            />
          )}
        </div>
      </div>
    </div>
  )
}
