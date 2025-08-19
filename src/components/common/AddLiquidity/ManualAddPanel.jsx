import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import { EmphasisIconButton } from '@/components/buttons/IconButton'
import Input from '@/components/input'
import Selection from '@/components/selection'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { SettingsIcon, ZapperIcon } from '@/svgs'

import KyberZapperIncreasePane from './FusionAdd/KyberZapperIncreasePane'
import KyberZapperPane from './FusionAdd/KyberZapperPane'
import ManualAdd from './FusionAdd/ManualAdd'

const defaultSlippageOptions = [0.1, 0.5, 1]
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
          setIsZapper(true)
        },
      },
    ],
    [isZapper, t],
  )

  const selections = useMemo(
    () =>
      defaultSlippageOptions.map(ele => ({
        label: ele,
        active: slippage === Number(ele),
        onClickHandler: () => {
          setSlippage(Number(ele))
        },
      })),
    [slippage],
  )

  return (
    <div className='flex flex-col gap-2'>
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
        <AnimatePresence>
          {show && (
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
      </>

      {isZapper ? (
        <>
          {position ? (
            <KyberZapperIncreasePane position={position} onShowModalSuccess={onShowModalSuccess} slippage={slippage} />
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
            />
          )}
        </>
      ) : (
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
          className={cn(position && 'grid grid-cols-1!')}
        />
      )}
    </div>
  )
}
