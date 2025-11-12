export const PluginFactoryABI = [
  {
    inputs: [
      { internalType: 'uint160', name: 'sqrtX96price', type: 'uint160' },
      { internalType: 'address', name: 'token0', type: 'address' },
      { internalType: 'address', name: 'token1', type: 'address' },
    ],
    name: 'createCustomPoolAndInitialize',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
