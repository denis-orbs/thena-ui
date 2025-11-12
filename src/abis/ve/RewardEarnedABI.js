export const RewardEarnedABI = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint8', name: 'version', type: 'uint8' }],
    name: 'Initialized',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'address', name: '_votingIncentives', type: 'address' },
      { internalType: 'address', name: '_token', type: 'address' },
      { internalType: 'address', name: '_user', type: 'address' },
    ],
    name: 'earned',
    outputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  { inputs: [], name: 'initialize', outputs: [], stateMutability: 'nonpayable', type: 'function' },
]
