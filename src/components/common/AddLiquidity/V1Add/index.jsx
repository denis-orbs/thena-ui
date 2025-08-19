'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { SettingsIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import Input from '@/components/input'
import SuccessModal from '@/components/modal/SuccessModal'
import Selection from '@/components/selection'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { ZapperIcon } from '@/svgs'

import { ManualPaneV1 } from './ManualPaneV1'
import { CommonZapperPane } from '../components/CommonZapperPane'

const defaultSlippageOptions = [0.1, 0.5, 1]
export default function V1Add({
  pool,
  pairType,
  firstAsset,
  secondAsset,
  setFirstAddress,
  setSecondAddress,
  handleBack,
}) {
  const [isZapper, setIsZapper] = useState(false)
  const [showModalSuccess, setShowModalSuccess] = useState(false)
  const { push } = useRouter()
  const t = useTranslations()
  const [show, setShow] = useState(false)
  const { isLgDown } = useMediaQuery()

  const [slippage, setSlippage] = useState(0.5)

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
    <div className={cn('inline-flex w-full flex-col gap-2 md:gap-4')}>
      {Boolean(pool) && (
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
      )}
      {isZapper ? (
        <CommonZapperPane
          asset0={firstAsset}
          asset1={secondAsset}
          strategy={pool}
          onShowModalSuccess={() => setShowModalSuccess(true)}
          handleBack={handleBack}
          slippage={slippage}
          isSmall={isLgDown}
        />
      ) : (
        <ManualPaneV1
          strategy={pool}
          pairType={pairType}
          firstAsset={firstAsset}
          secondAsset={secondAsset}
          setFirstAddress={setFirstAddress}
          setSecondAddress={setSecondAddress}
          handleBack={handleBack}
          slippage={slippage}
          isSmall={isLgDown}
        />
      )}

      <SuccessModal
        isOpen={showModalSuccess}
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
    </div>
  )
}
