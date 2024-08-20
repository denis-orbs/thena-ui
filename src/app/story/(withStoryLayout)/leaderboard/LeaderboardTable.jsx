import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import Table from '@/components/table'
import { FirstPrizeIcon, SecondPrizeIcon, ThirdPrizeIcon } from '@/svgs'

// const userInfo = {
//   id: '0xb095069bdeb6be079206cb0a7cca2786d79cba7c',
//   avatar: null,
//   rank: 124,
//   firstInteractAt: '2024-08-08',
// }

const sortOptions = [
  {
    label: '#',
    value: 'rank',
    width: 'lg:w-[10%]',
    isDesc: true,
    justify: 'text-center lg:flex-col',
  },
  {
    label: 'User',
    value: 'username',
    width: 'lg:w-[50%]',
    isDesc: true,
  },
  {
    label: 'Point',
    value: 'point',
    width: 'lg:w-[40%]',
    isDesc: true,
  },
]

const data = [
  {
    rank: 124,
    username: 'Your name',
    point: '45',
    id: '0xb095069bdeb6be079206cb0a7cca2786d79cba7c',
  },
  {
    rank: 1,
    username: 'User name',
    point: '899',
    id: '0xb095069bdeb6be079206cb0a7cca2786d79cba7d',
  },
  {
    rank: 2,
    username: 'User name',
    point: '799',
    id: '0xb095069bdeb6be079206cb0a7cca2786d79cba7e',
  },
  {
    rank: 3,
    username: 'User name',
    point: '699',
    id: '0xb095069bdeb6be079206cb0a7cca2786d79cba7f',
  },
  {
    rank: 4,
    username: 'User name',
    point: '599',
    id: '0xb095069bdeb6be079206cb0a7cca2786d79cba7g',
  },
  {
    rank: 5,
    username: 'User name',
    point: '499',
    id: '0xb095069bdeb6be079206cb0a7cca2786d79cba7h',
  },
  {
    rank: 6,
    username: 'User name',
    point: '399',
    id: '0xb095069bdeb6be079206cb0a7cca2786d79cbss',
  },
  {
    rank: 7,
    username: 'User name',
    point: '299',
    id: '0xb095069bdeb6be079206cb0a7cca2786d79cba4r',
  },
  {
    rank: 8,
    username: 'User name',
    point: '199',
    id: '0xb095069bdeb6be079206cb0a7cca2786d79cdd7c',
  },
  {
    rank: 9,
    username: 'User name',
    point: '99',
    id: '0xb095069bdeb6be079206cb0a7cca2786d7xxba7c',
  },
]

export default function LeaderboardTable() {
  const t = useTranslations()
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[1])

  const customData = data.map(item => {
    if (item.rank === 1) {
      return {
        ...item,
        rank: <FirstPrizeIcon className='size-7' />,
      }
    }
    if (item.rank === 2) {
      return {
        ...item,
        rank: <SecondPrizeIcon className='size-7' />,
      }
    }
    if (item.rank === 3) {
      return {
        ...item,
        rank: <ThirdPrizeIcon className='size-7' />,
      }
    }
    return item
  })
  return (
    <div className='mb-[60.15px] rounded-xl bg-neutral-900'>
      <p className='pl-6 pt-8 text-[20px] font-medium text-neutral-50'>{t('Leaderboard')}</p>
      <Table
        data={customData}
        className='bg-neutral-900'
        sortOptions={sortOptions}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        sort={sort}
        setSort={setSort}
        tableBasic
        totalItems={90}
        hightLightIndex={0}
        bgHightLight='bg-neutral-800'
      />
    </div>
  )
}
