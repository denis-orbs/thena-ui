import Divider from '@/components/divider'
import { cn } from '@/lib/utils'

function SpecialDivider({ className }) {
  return (
    <Divider
      className={cn(
        'h-[2px] bg-[linear-gradient(90deg,_rgba(131,_0,_126,_0.05)_0.22%,_rgba(189,_96,_186,_0.8)_52.37%,_rgba(143,_20,_138,_0.05)_96.59%)] md:hidden',
        className,
      )}
    />
  )
}

export default SpecialDivider
