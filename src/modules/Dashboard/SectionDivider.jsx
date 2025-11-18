import Divider from '@/components/divider'
import cn from '@/utils/classes'

function SectionDivider({ className }) {
  return (
    <Divider
      className={cn(
        'h-[2px] bg-[linear-gradient(90deg,rgba(131,0,126,0.05)_0.22%,rgba(189,96,186,0.8)_52.37%,rgba(143,20,138,0.05)_96.59%)] md:hidden',
        className,
      )}
    />
  )
}

export default SectionDivider
