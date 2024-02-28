export const addToken = async asset => {
  const provider = window.stargate?.wallet?.ethereum?.signer?.provider?.provider ?? window.ethereum
  if (provider) {
    try {
      // wasAdded is a boolean. Like any RPC method, an error can be thrown.
      const wasAdded = await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC-20 tokens, but eventually more!
          options: {
            address: asset.address, // The address of the token.
            symbol: asset.symbol, // A ticker symbol or shorthand, up to 5 characters.
            decimals: asset.decimals, // The number of decimals in the token.
            image: asset.logoURI, // A string URL of the token logo.
          },
        },
      })

      if (wasAdded) {
        console.log('Token Added!')
      } else {
        console.log('Your loss!')
      }
    } catch (error) {
      console.log(error)
    }
  }
}
