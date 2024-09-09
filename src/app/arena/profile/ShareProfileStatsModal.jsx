import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import Modal, { ModalBody } from '@/components/modal'
import { isSmallScreen } from '@/lib/utils'
import { fetchAchievements, fetchAchievementsCompleted } from '@/modules/Profile'
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
  const { data: userAchievements, isLoadingAchievements } = useSWR(['userAchievements', userInfo.id], () =>
    fetchAchievements(userInfo.id.toLowerCase()),
  )

  const { data: userAchievementsCompleted, isLoadingAchievementsCompleted } = useSWR(
    ['userAchievementsCompleted', userInfo.id],
    () => fetchAchievementsCompleted(userInfo.id.toLowerCase()),
  )

  const handleChecked = name => value => {
    setSelected(prev => ({ ...prev, [name]: value }))
  }

  const optionData = useMemo(
    () => items => {
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
    if (!userAchievements) {
      return []
    }

    const labels = Object.keys(userAchievements)

    const result = Object.values(userAchievements).map((item, idx) => ({
      label: labels[idx],
      options: optionData(item),
    }))
    return result
  }, [optionData, userAchievements])

  if (isLoadingAchievements || isLoadingAchievementsCompleted) return <Loading />

  return (
    <Modal
      isOpen={isOpen}
      closeModal={onClose}
      fontSizeTitle='text-xl'
      width={isSmallScreen() ? '95%' : '90%'}
      backgroundColor='transparent'
      showIconX={false}
    >
      <ModalBody className='p-2'>
        <div className='flex w-full flex-col justify-between gap-5 lg:flex-row'>
          <ShareProfileStats
            className='order-2 w-full bg-neutral-900 lg:order-1 lg:w-[25%]'
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
            className="relative order-1 block w-full bg-[url('/images/arena/bg-image-share-profile.png')] bg-cover lg:order-2 lg:w-[75%]"
            userInfo={userInfo}
            selectedDefault={selected}
            showAchievement={showAchievement}
            selectedAchievements={selectedAchievements}
            userAchievements={userAchievements}
            userAchievementsCompleted={userAchievementsCompleted}
          />
        </div>
      </ModalBody>
    </Modal>
  )
}
