'use client'

import BigNumber from 'bignumber.js'
import { AnimatePresence, motion } from 'framer-motion'
import { SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import Input from '@/components/input'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import Selection from '@/components/selection'
import { ichiVaultAbi } from '@/constant/abi/fusion'
import { useAssets } from '@/context/assetsContext'
import { useIchiManage, useIchiManageV3 } from '@/hooks/fusion/useIchi'
import useWallet from '@/hooks/useWallet'
import { callMulti } from '@/lib/contractActions'
import { warnToast } from '@/lib/notify'
import { cn, isInvalidAmount } from '@/lib/utils'
import PoolTitle from '@/modules/PoolTitle'

export const fetchIchiInfo = async (chainId, strategy) => {
  const values = await callMulti([
    {
      address: strategy.address,
      abi: ichiVaultAbi,
      functionName: 'baseLower',
      args: [],
      chainId,
    },
    {
      address: strategy.address,
      abi: ichiVaultAbi,
      functionName: 'baseUpper',
      args: [],
      chainId,
    },
    {
      address: strategy.address,
      abi: ichiVaultAbi,
      functionName: 'currentTick',
      args: [],
      chainId,
    },
  ])
  const lowerValue = 1.0001 ** Number(values[0] - values[2])
  const upperValue = 1.0001 ** Number(values[1] - values[2])
  return {
    type: strategy.title,
    title: strategy.title,
    address: strategy.address,
    min: lowerValue,
    max: upperValue,
  }
}

export default function IchiAdd({
  strategy,
  isAdd,
  isModal,
  onShowModalSuccess,
  handleBack,
  isSmall = false,
  classNames,
}) {
  const [amount, setAmount] = useState('')

  const { onIchiAddAndStake: addIchiPoolV2, pending: pendingV2 } = useIchiManage()
  const { addIchiPool: addIchiPoolV3, pending: pendingV3 } = useIchiManageV3()
  const { account } = useWallet()
  const assets = useAssets()
  const [slippage, setSlippage] = useState(0.5)
  const bnbBalance = assets.find(ele => ele.address === 'BNB').balance
  const depositToken = assets.find(ele => ele.address.toLowerCase() === strategy?.allowed?.address)
  const t = useTranslations()
  const [slippageDropdown, setSlippageDropdown] = useState(false)

  const isDouble = useMemo(() => depositToken?.symbol === 'WBNB', [depositToken])

  const balance = useMemo(() => {
    if (isDouble) {
      return depositToken?.balance.plus(bnbBalance)
    }
    return depositToken?.balance
  }, [depositToken, isDouble, bnbBalance])

  const amountToWrap = useMemo(() => {
    let final
    if (depositToken?.balance.lt(amount)) {
      final = new BigNumber(amount).minus(depositToken.balance)
    }
    return final
  }, [amount, depositToken])

  const onAddLiquidityAndStake = useCallback(() => {
    if (isInvalidAmount(amount)) {
      warnToast('Invalid Amount')
      return
    }

    if (balance.lt(amount)) {
      warnToast('Insufficient Balance')
      return
    }

    if (strategy?.version === 2) {
      addIchiPoolV2({ vault: strategy, amount, amountToWrap, slippage }, onShowModalSuccess)
    } else {
      addIchiPoolV3({ vault: strategy, amount, amountToWrap, slippage }, onShowModalSuccess)
    }
  }, [amount, balance, strategy, addIchiPoolV2, amountToWrap, slippage, onShowModalSuccess, addIchiPoolV3])

  const selections = useMemo(
    () =>
      [0.1, 0.5, 1].map(ele => ({
        label: ele,
        active: slippage === Number(ele),
        onClickHandler: () => {
          setSlippage(Number(ele))
        },
      })),
    [slippage],
  )

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-4', isModal && 'p-3 lg:px-6')}>
        {isAdd && strategy && <PoolTitle strategy={strategy} />}

        <div className='flex w-full flex-col items-end justify-end gap-2'>
          <EmphasisIconButton
            className='size-8 lg:size-11'
            classNames='size-4 stroke-neutral-400'
            Icon={SettingsIcon}
            onClick={() => setSlippageDropdown(prev => !prev)}
            disabled={false}
          />
          <AnimatePresence>
            {slippageDropdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className='w-full overflow-hidden p-1'
              >
                <div className='flex min-w-[200px] justify-end gap-3'>
                  <Selection data={selections} className='bg-transparent text-neutral-200!' />
                  <Input
                    classNames={{
                      input: 'w-[70px] h-9',
                    }}
                    val={slippage}
                    onChange={e => setSlippage(Number(e.target.value) || 0)}
                    suffix='%'
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <TokenAmountInput
          asset={depositToken}
          maxBalance={isDouble ? balance : null}
          amount={amount}
          onAmountChange={setAmount}
          showPercent={false}
          isSmall={isSmall}
          classNames={classNames}
        />
      </div>

      <div className={cn('mt-auto flex w-full flex-col items-center gap-2 lg:flex-row', isModal && 'px-3 lg:px-6')}>
        <EmphasisButton className='block w-full xl:hidden' onClick={handleBack}>
          {t('Cancel')}
        </EmphasisButton>
        {account ? (
          <PrimaryButton
            disabled={pendingV2 || pendingV3}
            onClick={() => {
              onAddLiquidityAndStake()
            }}
            className='w-full'
          >
            {t('Deposit')}
          </PrimaryButton>
        ) : (
          <ConnectButton className='w-full' />
        )}
      </div>
    </>
  )
}
