import cn from '@/utils/classes'

import BackButton from '../buttons/BackButton'

function LayoutWithBackButton({ children, className, backUrl, hiddenBackButton }) {
  return (
    <div className={cn('mt-[72px] mb-2 flex flex-col lg:mt-[100px]', hiddenBackButton && 'lg:mt-[92px]')}>
      {!hiddenBackButton && (
        <div className='ml-4 hidden max-xl:pl-0 xl:ml-10 xl:block'>
          <BackButton href={backUrl} />
        </div>
      )}

      <section className={cn('layout-add-liquidity', className)}>{children}</section>
    </div>
  )
}

export default LayoutWithBackButton
