import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import SlippageContent from '@/app/pools/(add-liquidity)/add-liquidity/SlippageContent'
import { PrimaryButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import Highlight from '@/components/highlight'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import Selection from '@/components/selection'
import { Paragraph } from '@/components/typography'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { InfoNeutralIcon, SettingsIcon, ZapperIcon } from '@/svgs'

import KyberZapperIncreasePane from './FusionAdd/KyberZapperIncreasePane'
import KyberZapperPane from './FusionAdd/KyberZapperPane'
import ManualAdd from './FusionAdd/ManualAdd'

export default function ManualAddPanel({
  baseCurrency,
  quoteCurrency,
  setBaseCurrency,
  setQuoteCurrency,
  mintInfo,
  currentPrice,
  strategy,
  onShowModalSuccess,
  position,
  handleBack,
}) {
  const t = useTranslations()
  const [show, setShow] = useState(false)
  const [isZapper, setIsZapper] = useState(false)
  const [slippage, setSlippage] = useState(0.5)
  const { isLgDown } = useMediaQuery()
  const [showWarningZapper, setShowWarningZapper] = useState(false)

  useEffect(() => {
    if (!strategy?.isFarming) {
      setIsZapper(false)
    }
  }, [strategy?.isFarming])

  const addSelections = useMemo(
    () => [
      {
        label: t('Pool Token Deposit'),
        active: !isZapper,
        onClickHandler: () => {
          setIsZapper(false)
        },
      },
      {
        label: (
          <div className='flex items-center justify-center gap-1'>
            <ZapperIcon className='size-4' />
            <span>{t('Zapper Deposit')}</span>
          </div>
        ),
        active: isZapper,
        onClickHandler: () => {
          setShowWarningZapper(true)
          // setIsZapper(true)
        },
      },
    ],
    [isZapper, t],
  )

  return (
    <div className='flex flex-col'>
      <Modal
        isOpen={showWarningZapper}
        closeModal={() => {
          setShowWarningZapper(false)
        }}
        width={400}
        title=''
      >
        <ModalBody>
          <div className='flex w-full flex-col items-center justify-center gap-4 px-6'>
            <Highlight className='bg-primary-600'>
              <InfoNeutralIcon className='size-5 [&>path]:stroke-neutral-100' />
            </Highlight>
            <Paragraph className='text-center text-neutral-50'>
              Zapper is not available for the moment. Please try again later.
            </Paragraph>
          </div>
        </ModalBody>
        <ModalFooter className='mt-2 flex items-center justify-center gap-2 py-4'>
          <PrimaryButton className='w-32 text-neutral-100' onClick={() => setShowWarningZapper(false)}>
            OK
          </PrimaryButton>
        </ModalFooter>
      </Modal>
      <>
        <div className={cn('flex flex-row justify-between gap-2')}>
          <Selection
            className='h-8 w-full flex-1 items-stretch lg:h-11'
            classNames={{
              items: 'md:text-sm text-xs',
            }}
            data={addSelections}
            isFull
            isTranslation={false}
            isSmall={isLgDown}
          />
          <EmphasisIconButton
            className='size-8 lg:size-11'
            classNames='size-4 stroke-neutral-400'
            Icon={SettingsIcon}
            onClick={() => setShow(prev => !prev)}
            disabled={false}
          />
        </div>
        <SlippageContent setSlippage={setSlippage} slippage={slippage} show={show} marginTop={4} />
      </>
      {isZapper && (
        <>
          {position && position?._position?.tokenId ? (
            <KyberZapperIncreasePane
              position={position}
              onShowModalSuccess={onShowModalSuccess}
              slippage={slippage}
              classNames={{ input: 'bg-neutral-950 hover:bg-neutral-900 gap-1! max-xl:py-4!' }}
            />
          ) : (
            <KyberZapperPane
              baseCurrency={baseCurrency}
              quoteCurrency={quoteCurrency}
              mintInfo={mintInfo}
              currentPrice={currentPrice}
              strategy={strategy}
              onShowModalSuccess={onShowModalSuccess}
              handleBack={handleBack}
              slippage={slippage}
              classNames={{ input: 'bg-neutral-950! hover:bg-neutral-900! gap-1! max-xl:py-4!' }}
            />
          )}
        </>
      )}

      {!isZapper && (
        <div className='mt-2'>
          <ManualAdd
            baseCurrency={baseCurrency}
            quoteCurrency={quoteCurrency}
            setBaseCurrency={setBaseCurrency}
            setQuoteCurrency={setQuoteCurrency}
            mintInfo={mintInfo}
            currentPrice={currentPrice}
            strategy={strategy}
            onShowModalSuccess={onShowModalSuccess}
            position={position}
            handleBack={handleBack}
            slippage={slippage}
            className={cn(position && 'grid grid-cols-1! gap-2!')}
            classNames={{ input: 'bg-neutral-950 hover:bg-neutral-900 gap-1! max-xl:py-4!' }}
          />
        </div>
      )}
    </div>
  )
}
