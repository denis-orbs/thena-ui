import { toast } from 'react-toastify'
import { ChainId } from 'thena-sdk-core'

import { ErrorMessage, SuccessMessage, WarnMessage } from '@/components/message'

export function successToast(title, hash = null, chainId = ChainId.BSC) {
  toast.success(<SuccessMessage title={title} hash={hash} chainId={chainId} />, {
    icon: false,
  })
}

export function errorToast(title, desc) {
  toast.error(<ErrorMessage title={title} desc={desc} />, {
    icon: false,
  })
}

export function warnToast(desc) {
  toast.error(<WarnMessage desc={desc} />, {
    icon: false,
  })
}
