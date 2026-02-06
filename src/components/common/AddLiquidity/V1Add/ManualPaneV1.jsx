import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import { useCallback, useMemo, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { zeroAddress } from 'viem'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import SuccessModal from '@/components/modal/SuccessModal'
import { PAIR_TYPES } from '@/constant'
import { useV1Add, useV1AddAndStake } from '@/hooks/useV1Liquidity'
import useWallet from '@/hooks/useWallet'
import { warnToast } from '@/lib/notify'
import { useChainSettings, useSettings } from '@/state/settings/hooks'
import { isInvalidAmount, wrappedAddress } from '@/utils/utils'

export function ManualPaneV1({
  strategy,
  firstAsset,
  secondAsset,
  setFirstAddress,
  setSecondAddress,
  pairType,
  handleBack,
  slippage,
}) {
  const t = useTranslations()
  const { push } = useRouter()
  const [firstAmount, setFirstAmount] = useState('')
  const [secondAmount, setSecondAmount] = useState('')
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { deadline } = useSettings()
  const { onV1Add, pending } = useV1Add()
  const { onV1AddAndStake, pending: stakePending } = useV1AddAndStake()
  const [showModalSuccess, setShowModalSuccess] = useState(false)
  const [poolAddress, setPoolAddress] = useState('')
  const searchParams = useSearchParams()
  const isStake = searchParams.get('staked') === 'true' ?? false

  const isFromBNB = useMemo(
    () => ['BNB', WBNB[networkId].address.toLowerCase()].includes(firstAsset?.address),
    [networkId, firstAsset],
  )

  const isToBNB = useMemo(
    () => ['BNB', WBNB[networkId].address.toLowerCase()].includes(secondAsset?.address),
    [networkId, secondAsset],
  )

  const onFirstChange = useCallback(
    val => {
      setFirstAmount(val)
      if (strategy) {
        const isReverse = wrappedAddress(secondAsset) === strategy.token0.address
        const token0Reserve = isReverse ? strategy.token1.reserve : strategy.token0.reserve
        const token1Reserve = isReverse ? strategy.token0.reserve : strategy.token1.reserve
        setSecondAmount(
          val
            ? token1Reserve
                .times(val)
                .div(token0Reserve)
                .dp(secondAsset?.decimals || 0)
                .toString(10)
            : '',
        )
      }
    },
    [strategy, secondAsset],
  )

  const onSecondChange = useCallback(
    val => {
      setSecondAmount(val)
      if (strategy) {
        const isReverse = wrappedAddress(firstAsset) === strategy.token1.address
        const token0Reserve = isReverse ? strategy.token1.reserve : strategy.token0.reserve
        const token1Reserve = isReverse ? strategy.token0.reserve : strategy.token1.reserve
        setFirstAmount(
          val
            ? token0Reserve
                .times(val)
                .div(token1Reserve)
                .dp(firstAsset?.decimals || 0)
                .toString(10)
            : '',
        )
      }
    },
    [strategy, firstAsset],
  )

  const errorMsg = useMemo(() => {
    if (isInvalidAmount(firstAmount) || isInvalidAmount(secondAmount)) {
      return 'Invalid Amount'
    }

    if (firstAsset.balance.lt(firstAmount)) {
      return `Insufficient ${firstAsset.symbol} balance`
    }

    if (secondAsset.balance.lt(secondAmount)) {
      return `Insufficient ${secondAsset.symbol} balance`
    }

    return null
  }, [firstAmount, secondAmount, firstAsset, secondAsset])

  const onAddLiquidity = useCallback(() => {
    if (errorMsg) {
      warnToast(errorMsg, 'warn')
      return
    }

    onV1Add(
      firstAsset,
      secondAsset,
      firstAmount,
      secondAmount,
      pairType === PAIR_TYPES.STABLE,
      deadline,
      slippage,
      address => {
        setPoolAddress(address)
        setFirstAmount('')
        setSecondAmount('')
      },
    )
  }, [onV1Add, firstAsset, secondAsset, firstAmount, secondAmount, pairType, deadline, slippage, errorMsg])

  const onAddAndStake = useCallback(() => {
    if (errorMsg) {
      warnToast(errorMsg, 'warn')
      return
    }

    onV1AddAndStake(
      strategy,
      firstAsset,
      secondAsset,
      firstAmount,
      secondAmount,
      pairType === PAIR_TYPES.STABLE,
      deadline,
      slippage,
      address => {
        setPoolAddress(address)
        setFirstAmount('')
        setSecondAmount('')
      },
    )
  }, [
    firstAmount,
    secondAmount,
    errorMsg,
    onV1AddAndStake,
    strategy,
    firstAsset,
    secondAsset,
    pairType,
    deadline,
    slippage,
  ])

  return (
    <>
      <div className='flex flex-col gap-4'>
        <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
          <TokenAmountInput
            asset={firstAsset}
            setAsset={isFromBNB ? setFirstAddress : null}
            amount={firstAmount}
            onAmountChange={onFirstChange}
            showPercent={false}
            classNames={{ input: 'p-4! gap-2!' }}
          />
          <TokenAmountInput
            asset={secondAsset}
            setAsset={isToBNB ? setSecondAddress : null}
            amount={secondAmount}
            onAmountChange={onSecondChange}
            showPercent={false}
            classNames={{ input: 'p-4! gap-2!' }}
          />
        </div>
      </div>

      <div className='mt-4 flex flex-col gap-2'>
        <EmphasisButton className='block w-full lg:hidden' onClick={handleBack}>
          {t('Cancel')}
        </EmphasisButton>
        {account ? (
          <>
            {strategy && strategy.gauge.address !== zeroAddress && strategy.gauge.isAlive && strategy.version === 3 ? (
              // Has gauge => Can deposit/stake
              <PrimaryButton disabled={stakePending} onClick={() => onAddAndStake()}>
                {t('Deposit & Stake')}
              </PrimaryButton>
            ) : (
              // No gauge => Can only deposit
              <PrimaryButton disabled={pending || isStake} onClick={() => onAddLiquidity()} className='flex-1'>
                {t('Deposit')}
              </PrimaryButton>
            )}
          </>
        ) : (
          <ConnectButton className='flex-1' />
        )}
      </div>

      <SuccessModal
        isOpen={showModalSuccess && poolAddress}
        onClose={() => setShowModalSuccess(false)}
        heading={t('Deposit Successful')}
        message={t('You have successfully deposited and staked')}
        buttonAction={
          <div className='flex gap-4'>
            <EmphasisButton className='w-1/2' onClick={() => push('/pools')}>
              {t('View Pool')}
            </EmphasisButton>
            <EmphasisButton className='w-1/2' onClick={() => push('/dashboard')}>
              {t('View Dashboard')}
            </EmphasisButton>
          </div>
        }
      />
    </>
  )
}
