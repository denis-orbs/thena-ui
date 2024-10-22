import Image from 'next/image'

import { PrimaryButton } from '@/components/buttons/Button'

export function HowItWorksItem({ icon, title, description }) {
  return (
    <div className='flex flex-col items-center justify-start p-4 text-center font-medium md:max-w-[330px] md:flex-1 xl:p-6'>
      <div className='mb-3 rounded-xl border border-white border-opacity-5 bg-white bg-opacity-5 p-1.5'>
        <PrimaryButton className='pointer-events-none lg:size-9'>
          <Image src={icon} width={16} height={16} />
        </PrimaryButton>
      </div>
      <p className='mb-1 leading-5 text-neutral-50'>{title}</p>
      <p className='text-center text-sm text-neutral-300'>{description}</p>
    </div>
  )
}
