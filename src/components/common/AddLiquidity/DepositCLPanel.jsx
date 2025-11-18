import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import AddLiquidityCLPane from '@/app/pools/(add-liquidity)/add-liquidity/ClPool/AddLiquidityCLPane'
import { NewTextHeading, Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import InfoIcon from '@/icons/InfoIcon'
import { NormalPoolAttributes, PoolAttributesCL } from '@/modules/Pools/PoolAttributes'
import cn from '@/utils/classes'

export function PoolAttributes({ pair, strategy, classNames }) {
  const t = useTranslations()
  const [show, setShow] = useState(false)

  return (
    <div className={cn(classNames?.wrapper)}>
      <div className={cn('flex w-full items-center gap-2', classNames?.container)}>
        <div className={cn('flex h-11 flex-1 items-center rounded-lg bg-neutral-800 px-3')}>
          <TextHeading className='text-sm! font-normal! lg:text-neutral-300'>{t('Pool Attributes')}</TextHeading>
        </div>

        <div className='flex items-center'>
          <i
            onClick={() => setShow(!show)}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-lg',
              'size-8 min-w-8 md:size-11 md:min-w-11',
              show ? 'bg-neutral-600' : 'bg-neutral-800',
            )}
          >
            <InfoIcon className='md:size-5' />
          </i>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 0, height: 0 }}
        animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='w-full overflow-hidden'
      >
        <div className='mt-2 w-full xl:mt-4'>
          {pair ? (
            <>
              {pair?.type === PAIR_TYPES.LSD ? (
                <>{strategy && pair && <PoolAttributesCL strategy={strategy} pool={pair} />}</>
              ) : (
                <>{pair && <NormalPoolAttributes pool={pair} />}</>
              )}
            </>
          ) : (
            <div className='flex h-max flex-col gap-3 rounded-md bg-neutral-800 p-4'>
              <NewTextHeading className='text-xl!'>{t('New Deposit')}</NewTextHeading>
              <Paragraph className='leading-5 font-medium'>{t('New Deposit CL description')}</Paragraph>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function DepositCLPanel({
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
  slippage,
  pair,
}) {
  return (
    <div className='z-20 grid flex-row gap-4 xl:grid-cols-[1fr_384px]'>
      <AddLiquidityCLPane
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
      />
      <div className='hidden xl:block'>
        <PoolAttributes pair={pair} strategy={strategy} />
      </div>
    </div>
  )
}
