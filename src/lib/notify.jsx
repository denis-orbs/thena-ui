import { toast } from 'react-toastify'
import { ChainId } from 'thena-sdk-core'

import { ErrorMessage, SuccessMessage, WarnMessage } from '@/components/message'

export function successToast(title, hash = null, chainId = ChainId.BSC, icon = null, translate = true) {
  toast.success(<SuccessMessage title={title} hash={hash} chainId={chainId} icon={icon} translate={translate} />, {
    icon: false,
  })
}

export function errorToast(title, desc, icon = null, translate = true, options = {}) {
  toast.error(<ErrorMessage title={title} desc={desc} icon={icon} translate={translate} />, {
    ...options,
    icon: false,
  })
}

export function warnToast(desc, params = undefined) {
  toast.error(<WarnMessage desc={desc} params={params} />, {
    icon: false,
  })
}
