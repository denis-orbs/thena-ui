import { cloneDeep } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import BalanceInput from '@/components/input/BalanceInput'
import CustomTokenInput from '@/components/input/CustomTokenInput'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { TextSubHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useDepositToTC, useTradeData } from '@/hooks/useTcSpotContract'
import { warnToast } from '@/lib/notify'
import { fromWei, toWei } from '@/lib/utils'

function DepositModal({ isOpen, closeModal = () => {}, competition = {} }) {
  const t = useTranslations()
  const _assets = useAssets()

  const assets = useMemo(() => {
    const clone = cloneDeep(_assets)
    clone.push({
      name: 'MockUSD',
      symbol: 'MUSD',
      decimals: 18,
      address: '0xced4ac14bb1077b995b954c48a87b25ebb4828e5',
    })
    return clone
  }, [_assets])
  const { deposit, pending } = useDepositToTC()

  const [amount, setAmount] = useState('')
  const [token, setToken] = useState()
  const [filteredAssets, setFilteredAssets] = useState([])

  const { reload } = useTradeData(competition?.tcAddress, competition?.competitionRules?.winningToken?.address)

  useEffect(() => {
    if (competition?.competitionRules?.winningToken?.symbol === 'WBNB' && assets.length) {
      const filteredTokens = assets.filter(item => ['WBNB', 'BNB'].includes(item?.symbol))
      setFilteredAssets(filteredTokens)
    }
  }, [assets, competition?.competitionRules?.winningToken?.symbol])

  useEffect(() => {
    if (competition?.competitionRules?.winningToken) {
      setToken(prev => {
        if (!prev) {
          return competition.competitionRules.winningToken
        }
        return prev
      })
    }
  }, [competition?.competitionRules?.winningToken])

  const handleDeposit = useCallback(async () => {
    if (fromWei(toWei(amount, token?.decimals), token?.decimals).gt(token?.balance)) {
      warnToast('Insufficient [Asset] Balance', { symbol: token?.symbol })
      return false
    }

    const isSuccess = await deposit({
      amount: toWei(amount),
      token,
      tcAddress: competition?.tcAddress,
      winningToken: competition?.competitionRules?.winningToken,
    })

    if (isSuccess) {
      await reload()
      closeModal()
    }
  }, [reload, amount, closeModal, competition?.competitionRules?.winningToken, competition?.tcAddress, deposit, token])

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} title='Deposit' onAfterClose={() => setAmount('')}>
      <ModalBody>
        <TextSubHeading>{t('Description Modal Deposit')}</TextSubHeading>
        {competition?.competitionRules?.winningToken?.symbol === 'WBNB' ? (
          <CustomTokenInput
            asset={token}
            setAsset={setToken}
            amount={amount}
            setAmount={setAmount}
            assets={filteredAssets}
          />
        ) : (
          <BalanceInput
            autoFocus
            asset={competition?.competitionRules?.winningToken}
            amount={amount}
            onAmountChange={setAmount}
          />
        )}
      </ModalBody>
      <ModalFooter>
        <PrimaryButton disabled={!amount} isLoading={pending} className='w-full' onClick={handleDeposit}>
          {token?.symbol === competition?.competitionRules?.winningToken?.symbol
            ? t('Deposit')
            : `${t('Wrap')} ${t('And')} ${t('Deposit')}`}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default DepositModal
