import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { ICHI_SINGLE_SIDED, NotShowBannerV3, PAIR_TYPES } from '@/constant'

export const useMigratePositionWarning = () => {
  const { hideWarningBanner, positions } = useSelector(state => state.positions)
  const migratePositions = useMemo(
    () =>
      positions.filter(pos => {
        const isV1Pool = [PAIR_TYPES.CLASSIC, PAIR_TYPES.STABLE].includes(pos.type)
        const isOldVersion = pos.version === 2
        return (
          isOldVersion &&
          pos.title !== ICHI_SINGLE_SIDED &&
          ((isV1Pool && pos.staked) || Number(pos.fiatValueOfLiquidity) > 0 || Number(pos.liquidity) > 0)
        )
      }),
    [positions],
  )

  const onHideWarningBanner = useCallback(() => {
    localStorage.setItem(NotShowBannerV3, 'true')
    window.dispatchEvent(new Event('local-storage-changed'))
  }, [])

  return {
    showBannerMigrate: !hideWarningBanner && migratePositions.length > 0,
    onHideWarningBanner,
  }
}
