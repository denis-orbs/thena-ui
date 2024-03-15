import { ChainNotConfiguredError, createConnector, normalizeChainId } from '@wagmi/core'
import { getAddress, numberToHex, SwitchChainError, UserRejectedRequestError } from 'viem'

export function particleWagmiWallet(param) {
  return createConnector(config => ({
    id: 'particleWalletSDK',
    name: 'Particle Wallet',
    type: particleWagmiWallet.type,
    async connect({ chainId }) {
      try {
        const provider = await this.getProvider()
        const accounts = (await provider.connect(param)).map(x => getAddress(x))

        provider.on('accountsChanged', this.onAccountsChanged)
        provider.on('chainChanged', this.onChainChanged)
        provider.on('disconnect', this.onDisconnect.bind(this))

        // Switch to chain if provided
        let currentChainId = await this.getChainId()
        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain({ chainId }).catch(error => {
            if (error.code === UserRejectedRequestError.code) throw error
            return { id: currentChainId }
          })
          currentChainId = chain?.id ?? currentChainId
        }

        return { accounts, chainId: currentChainId }
      } catch (error) {
        if (error.code === 4011) throw new UserRejectedRequestError(error)
        throw error
      }
    },
    async disconnect() {
      const provider = await this.getProvider()

      provider.removeListener('accountsChanged', this.onAccountsChanged)
      provider.removeListener('chainChanged', this.onChainChanged)
      provider.removeListener('disconnect', this.onDisconnect.bind(this))

      await provider?.disconnect?.()
    },
    async getAccounts() {
      const provider = await this.getProvider()
      return (
        await provider.request({
          method: 'eth_accounts',
        })
      ).map(x => getAddress(x))
    },
    async getChainId() {
      const provider = await this.getProvider()
      const chainId = await provider.request({ method: 'eth_chainId' })
      return normalizeChainId(chainId)
    },
    async getProvider() {
      if (typeof window === 'undefined') {
        return
      }

      while (!window.particle?.ethereum) {
        // eslint-disable-next-line no-promise-executor-return
        await new Promise(resolve => setTimeout(() => resolve(true), 100))
      }
      return window.particle?.ethereum
    },
    async isAuthorized() {
      try {
        const provider = await this.getProvider()
        return provider.isConnected()
      } catch {
        return false
      }
    },
    async switchChain({ chainId }) {
      const chain = config.chains.find(ele => ele.id === chainId)
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError())

      const provider = await this.getProvider()
      const chainId_ = numberToHex(chain.id)

      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainId_ }],
        })
        return chain
      } catch (error) {
        // Indicates chain is not added to provider
        if (error.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: chainId_,
                  chainName: chain.name,
                  nativeCurrency: chain.nativeCurrency,
                  rpcUrls: [chain.rpcUrls.default?.http[0] ?? ''],
                  blockExplorerUrls: [chain.blockExplorers?.default.url],
                },
              ],
            })
            return chain
          } catch (err) {
            throw new UserRejectedRequestError(err)
          }
        }

        throw new SwitchChainError(error)
      }
    },
    onAccountsChanged(accounts) {
      if (accounts.length === 0) config.emitter.emit('disconnect')
      else {
        config.emitter.emit('change', {
          accounts: accounts.map(x => getAddress(x)),
        })
      }
    },
    onChainChanged(chain) {
      const chainId = normalizeChainId(chain)
      config.emitter.emit('change', { chainId })
    },
    async onDisconnect(_error) {
      config.emitter.emit('disconnect')

      const provider = await this.getProvider()
      provider.removeListener('accountsChanged', this.onAccountsChanged)
      provider.removeListener('chainChanged', this.onChainChanged)
      provider.removeListener('disconnect', this.onDisconnect.bind(this))
    },
  }))
}
