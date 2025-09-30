import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { NotShowBannerV3 } from '@/constant'
import { usePositions } from '@/hooks/usePositions'
import { getFromLocalStorage } from '@/lib/helper'

import { updateHideWarningBanner, updatePositions } from './actions'

function PositionUpdater() {
  const dispatch = useDispatch()
  const { positions, removedClaimablePositions } = usePositions()
  useEffect(() => {
    dispatch(
      updatePositions({
        positions,
        removedClaimablePositions,
      }),
    )
  }, [dispatch, positions, removedClaimablePositions])

  useEffect(() => {
    const updateBanner = () => {
      const storedBool = getFromLocalStorage(NotShowBannerV3)
      dispatch(updateHideWarningBanner(Boolean(storedBool)))
    }

    updateBanner()

    window.addEventListener('local-storage-changed', updateBanner)
    return () => window.removeEventListener('local-storage-changed', updateBanner)
  }, [dispatch])

  return null
}

export default PositionUpdater
