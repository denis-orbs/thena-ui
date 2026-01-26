export const UniversalRouterABI = [
  {
    inputs: [
      {
        internalType: 'bytes1[]',
        name: 'commands',
        type: 'bytes1[]',
      },
      {
        internalType: 'bytes[]',
        name: 'inputs',
        type: 'bytes[]',
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
]
