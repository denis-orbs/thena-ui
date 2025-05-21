import { useNftFeesClaim, useNftRoyaltyClaim } from './useTheNft'

export const useClaimTheNFT = () => {
  const { onRoyaltyClaim, pending: royaltyPending } = useNftRoyaltyClaim()
  const { onHarvest, pending } = useNftFeesClaim()

  const onClaim = async ({ isOriginal, royaltyClaimable, feesClaimAble }, mutate = () => {}) => {
    if (isOriginal && royaltyClaimable) {
      await onRoyaltyClaim(() => mutate())
    }

    if (feesClaimAble) {
      await onHarvest()
    }
  }

  return {
    onClaim,
    pending: royaltyPending || pending,
  }
}
