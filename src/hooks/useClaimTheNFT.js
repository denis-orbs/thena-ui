import { useNftFeesClaim, useNftRoyaltyClaim } from './useTheNft'

export const useClaimTheNFT = () => {
  const { onRoyaltyClaim, pending: royaltyPending } = useNftRoyaltyClaim()
  const { onHarvest, pending } = useNftFeesClaim()

  const onClaim = async ({ isOriginal, royaltyClaimAble, feesClaimAble }, mutate = () => {}) => {
    if (isOriginal && royaltyClaimAble) {
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
