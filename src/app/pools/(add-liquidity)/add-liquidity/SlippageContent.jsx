import React, { useMemo } from 'react'

import { SmoothCollapsible } from '@/components/collapse/CollapsibleMotion'
import Input from '@/components/input'
import Selection from '@/components/selection'

const defaultSlippageOptions = [0.1, 0.5, 1]
function SlippageContent({ show, slippage, setSlippage, ...props }) {
  const selections = useMemo(
    () =>
      defaultSlippageOptions.map(ele => ({
        label: ele,
        active: slippage === Number(ele),
        onClickHandler: () => {
          setSlippage(Number(ele))
        },
      })),
    [setSlippage, slippage],
  )
  return (
    <SmoothCollapsible {...props} show={show}>
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
    </SmoothCollapsible>
  )
}

export default SlippageContent
