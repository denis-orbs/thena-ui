import { groupBy } from 'lodash'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import Modal, { ModalBody } from '@/components/modal'
import { getWithScreen } from '@/lib/utils'
import { fetchAchievementsCompleted, fetchTradingCompetitionWon } from '@/modules/Profile'
import ShareProfileStats from '@/modules/Profile/ShareProfileStats'
import ShareProfileStatsDetail from '@/modules/Profile/ShareProfileStatsDetail'

const defaultOption = {
  rank: true,
  numberOfTCsWon: true,
  totalVolumeInTCs: true,
  completedAchievements: true,
}

export default function ShareProfileStatsModal({ isOpen = false, onClose, userInfo }) {
  const [selected, setSelected] = useState(defaultOption)
  const [showAchievement, setShowAchievement] = useState(false)
  const [selectedAchievements, setSelectedAchievement] = useState([])

  const { data, isLoadingAchievementsCompleted } = useSWR(['userAchievement', userInfo.id], () =>
    fetchAchievementsCompleted(userInfo.id.toLowerCase()),
  )

  const userAchievementsCompleted = groupBy(data, 'achievement.type')

  const { data: competition, isLoadingCompetition } = useSWR(['competitionwon', userInfo.id], () =>
    fetchTradingCompetitionWon(userInfo.id.toLowerCase()),
  )

  const handleChecked = name => value => {
    setSelected(prev => ({ ...prev, [name]: value }))
  }

  const optionData = useMemo(
    () => items => {
      if (!items) {
        return []
      }
      const result = items.map(item => ({
        value: item?.achievement?.id,
        label: item?.achievement?.name,
        ...item?.achievement,
      }))

      return result
    },
    [],
  )

  const achievementsData = useMemo(() => {
    if (!userAchievementsCompleted) {
      return []
    }

    const labels = Object.keys(userAchievementsCompleted)

    const result = Object.values(userAchievementsCompleted).map((item, idx) => ({
      label: labels[idx],
      options: optionData(item),
    }))
    return result
  }, [optionData, userAchievementsCompleted])

  const widthScreen = getWithScreen()

  if (isLoadingAchievementsCompleted || isLoadingCompetition) return <Loading />

  return (
    <Modal
      isOpen={isOpen}
      closeModal={onClose}
      fontSizeTitle='text-lg'
      width={widthScreen >= 1536 ? '1440px' : '95%'}
      backgroundColor='transparent'
      showIconX={false}
      maxWidth={1440}
    >
      <ModalBody className=''>
        <div className='flex w-full flex-col gap-3 xl:flex-row 2xl:gap-5'>
          <ShareProfileStats
            className='order-2 max-h-[576px] bg-neutral-900 lg:min-w-[280px] xl:order-1 2xl:w-[396px]'
            userInfo={userInfo}
            selectedDefault={selected}
            setSelectedDefault={handleChecked}
            toggleAchievement={showAchievement}
            setToggleAchievement={setShowAchievement}
            achievements={achievementsData}
            setSelectedAchievement={setSelectedAchievement}
            selectedAchievements={selectedAchievements}
            onClose={onClose}
          />
          <ShareProfileStatsDetail
            className='order-1 items-center xl:order-2'
            userInfo={userInfo}
            selectedDefault={selected}
            showAchievement={showAchievement}
            selectedAchievements={selectedAchievements}
            competition={competition?.win}
            totalCompleted={data?.length}
          />
        </div>
      </ModalBody>
    </Modal>
  )
}
