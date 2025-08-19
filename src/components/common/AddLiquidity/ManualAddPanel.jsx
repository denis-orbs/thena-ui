import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import { EmphasisIconButton } from '@/components/buttons/IconButton'
import Input from '@/components/input'
import Selection from '@/components/selection'
import { cn } from '@/lib/utils'
import { SettingsIcon, ZapperIcon } from '@/svgs'

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
            <ZapperIcon className='size-5' />
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
    <div className='flex flex-col'>
      <>
        <div className={cn('flex flex-row justify-between gap-2', position && 'justify-end')}>
          {!mintInfo?.noLiquidity && !position && (
            <Selection
              className='w-full flex-1 items-stretch md:h-11'
              classNames={{
                items: 'md:text-sm text-xs',
              }}
              data={addSelections}
              isFull
              isTranslation={false}
            />
          )}
          <EmphasisIconButton
            className='size-11'
            classNames='size-4 stroke-neutral-400'
            Icon={SettingsIcon}
            onClick={() => setShow(prev => !prev)}
            disabled={false}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={show ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
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
      </>

      {/* {position && (
        <ManualPositionInfo
          baseCurrency={baseCurrency}
          quoteCurrency={quoteCurrency}
          position={position}
          isFullRange={isFullRange}
        />
      )} */}

      {isZapper ? (
        <KyberZapperPane
          baseCurrency={baseCurrency}
          quoteCurrency={quoteCurrency}
          mintInfo={mintInfo}
          currentPrice={currentPrice}
          strategy={strategy}
          onShowModalSuccess={onShowModalSuccess}
          handleBack={handleBack}
        />
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
