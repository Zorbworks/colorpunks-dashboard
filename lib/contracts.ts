export const COLOR_PUNKS_ADDRESS =
  '0x67c7187031819a83e86286a64d117305b1902eb2' as const;

export const BASE_COLORS_ADDRESS =
  '0x7Bc1C072742D8391817EB4Eb2317F98dc72C61dB' as const;

export const COLOR_PUNKS_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: '_tokenId', type: 'uint256' },
      { internalType: 'string', name: '_uri', type: 'string' },
    ],
    name: 'updateTokenURI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'uri', type: 'string' },
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
    ],
    name: 'TokenURIUpdated',
    type: 'event',
  },
] as const;

/** Minimal ABI for the BaseColors contract — just enough to read tokenURI. */
export const BASE_COLORS_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
