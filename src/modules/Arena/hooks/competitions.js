import { gql } from 'graphql-request'
import { useCallback } from 'react'
import FileResizer from 'react-image-file-resizer'

import { ThenaAuthToken } from '@/constant'
import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'

export const resizeFile = file =>
  new Promise(resolve => {
    FileResizer.imageFileResizer(file, 800, 600, 'WEBP', 100, 0, uri => resolve(uri))
  }).then(res => {
    const arr = res.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[arr.length - 1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], file.name, { type: mime })
  })

const V4_UPDATE_TC_BANNER = gql`
  mutation V4_UPDATE_TC_BANNER($bannerUrl: String, $tcId: String!) {
    updateBanner(bannerUrl: $bannerUrl, tcId: $tcId) {
      id
      bannerUrl
    }
  }
`
export const useUpdateTCBanner = () => {
  const { signWallet } = useSignWallet()

  const updateTCBannerFn = useCallback(async ({ bannerUrl, tcId }) => {
    const res = await v4Client.request(
      V4_UPDATE_TC_BANNER,
      { bannerUrl, tcId },
      {
        authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
      },
    )

    if (res?.response?.errors) {
      throw new Error(res?.response?.errors?.[0]?.message)
    }

    return res?.updateBanner
  }, [])

  const updateTCBanner = useCallback(
    async (params, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(updateTCBannerFn, signWallet, params, callOnSuccess, callOnReject),
    [updateTCBannerFn, signWallet],
  )

  return { updateTCBanner }
}

const V4_UPDATE_TC_IS_HIDDEN = gql`
  mutation V4_UPDATE_TC_IS_HIDDEN($isHidden: Boolean!, $tcId: String!) {
    hideTradingCompetition(input: { isHidden: $isHidden }, tcId: $tcId) {
      id
    }
  }
`
export const useUpdateTCIsHidden = () => {
  const { signWallet } = useSignWallet()

  const updateIsHiddenFn = useCallback(async ({ isHidden, tcId }) => {
    const { data: res } = await v4Client.request(
      V4_UPDATE_TC_IS_HIDDEN,
      {
        isHidden,
        tcId,
      },
      {
        authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
      },
    )
    return res
  }, [])

  const updateTCIsHidden = useCallback(
    async (params, callOnSuccess, callOnReject) => {
      await actionWithAuthentication(updateIsHiddenFn, signWallet, params, callOnSuccess, callOnReject)
    },
    [signWallet, updateIsHiddenFn],
  )

  return { updateTCIsHidden }
}
