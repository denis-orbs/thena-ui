export const DefiedgeStrategyABI = [
  {
    inputs: [],
    name: 'factory',
    outputs: [
      {
        internalType: 'contract IStrategyFactory',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_amount0',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_amount1',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_amount0Min',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_amount1Min',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_minShare',
        type: 'uint256',
      },
    ],
    name: 'mint',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount0',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount1',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'share',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_shares',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_amount0Min',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_amount1Min',
        type: 'uint256',
      },
    ],
    name: 'burn',
    outputs: [
      {
        internalType: 'uint256',
        name: 'collect0',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'collect1',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
