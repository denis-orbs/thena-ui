import { PrimaryIconButton } from '@/components/buttons/IconButton'

export function HowItWorksItem({ icon, title, description }) {
  return (
    <div className='flex flex-col items-center justify-start p-6 text-center font-medium md:max-w-[330px]'>
      <div className='mb-3 rounded-xl border border-white border-opacity-5 bg-white bg-opacity-5 p-1.5'>
        <PrimaryIconButton Icon={icon} className='pointer-events-none lg:size-9' />
      </div>
      <p className='mb-1 leading-5 text-neutral-50'>{title}</p>
      <p className='text-center text-sm text-neutral-300'>{description}</p>
    </div>
  )
}
