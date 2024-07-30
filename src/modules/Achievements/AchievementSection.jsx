import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import Box from '@/components/box'
import Modal from '@/components/modal'
import { TextHeading } from '@/components/typography'

import AchievementItem from './AchievementItem'

export function AchievementSection({ data, group }) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const [itemChoose, setItemChoose] = useState(null)

  const onClick = item => {
    setOpen(true)
    setItemChoose(item)
  }

  const groupType = {
    Starting: 'Starting Achievements',
    Volume: 'Volume Achievements',
    Bribe: 'Bride Achievements',
    Completed: 'Completed Achievements',
    Liquidity: 'Liquidity Achievements',
    Referral: 'Referral Achievements',
    'Rewards Achievements': 'Rewards Achievements',
    Trading: 'Trading Achievements',
    'Trading Competition': 'Trading Competition Achievements',
    'Trading Consistency': 'Trading Consistency Achievements',
    Voting: 'Voting Achievements',
    theNFT: 'TheNFT Achievements',
  }

  return (
    <div className='space-y-3'>
      <TextHeading>
        {t(groupType[group], {
          count: data.length,
        })}
      </TextHeading>
      <Box className='grid grid-cols-2 gap-x-12 md:grid-cols-3 xl:grid-cols-5'>
        {data.map((item, i) => (
          <AchievementItem key={i} item={item} onClick={() => onClick(item)} />
        ))}
      </Box>
      {open && (
        <Modal
          isOpen={open}
          closeModal={() => {
            setOpen(false)
            setItemChoose(null)
          }}
          showHeadModal={false}
        >
          <AchievementItem showTooltip={false} item={itemChoose} />
        </Modal>
      )}
    </div>
  )
}
