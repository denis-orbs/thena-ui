import { toast } from 'react-toastify'
import { ChainId } from 'thena-sdk-core'

import { ErrorMessage, SuccessMessage, WarnMessage } from '@/components/message'

export function successToast(title, hash = null, chainId = ChainId.BSC, icon = null, translate = true) {
  const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth < 1024
  const position = isMobileOrTablet ? 'top-right' : 'bottom-left'
  toast.success(<SuccessMessage title={title} hash={hash} chainId={chainId} icon={icon} translate={translate} />, {
    icon: false,
    position,
  })
}

export function errorToast(title, desc, icon = null, translate = true, options = {}) {
  const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth < 1024
  const position = isMobileOrTablet ? 'top-right' : 'bottom-left'
  toast.error(<ErrorMessage title={title} desc={desc} icon={icon} translate={translate} />, {
    icon: false,
    position,
    ...options,
  })
}

export function warnToast(desc, params = undefined, options = {}) {
  const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth < 1024
  const position = isMobileOrTablet ? 'top-right' : 'bottom-left'
  toast.error(<WarnMessage desc={desc} params={params} />, {
    icon: false,
    position,
    ...options,
  })
}
