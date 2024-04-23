import { toast } from 'react-toastify'
import { ChainId } from 'thena-sdk-core'

import { ErrorMessage, SuccessMessage, WarnMessage } from '@/components/message'

export function successToast(title, hash = null, chainId = ChainId.BSC, icon = null) {
  toast.success(<SuccessMessage title={title} hash={hash} chainId={chainId} icon={icon} />, {
    icon: false,
  })
}

export function errorToast(title, desc, icon = null) {
  toast.error(<ErrorMessage title={title} desc={desc} icon={icon} />, {
    icon: false,
  })
}

export function warnToast(desc, params = undefined) {
  toast.error(<WarnMessage desc={desc} params={params} />, {
    icon: false,
  })
}
