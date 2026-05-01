import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { BASEWORDS_ABI, BASEWORDS_ADDRESS } from './contracts';

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const rpcUrl =
  alchemyKey && alchemyKey !== 'demo'
    ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
    : undefined;

const serverPublicClient = createPublicClient({
  chain: base,
  transport: http(rpcUrl),
});

export interface BaseWordToken {
  words: string[];
  textColor: string;
  bgColor: string;
}

function normalizeHex(c: string | undefined): string {
  const t = (c ?? '').trim();
  if (!t) return '';
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t.toUpperCase()}`;
  return t;
}

export async function fetchBaseWordToken(
  tokenId: bigint
): Promise<BaseWordToken | null> {
  try {
    const data = await serverPublicClient.readContract({
      address: BASEWORDS_ADDRESS,
      abi: BASEWORDS_ABI,
      functionName: 'getTokenData',
      args: [tokenId],
    });
    const words = [data.word1, data.word2, data.word3].filter(
      (w): w is string => typeof w === 'string' && w.length > 0
    );
    return {
      words,
      textColor: normalizeHex(data.textColor),
      bgColor: normalizeHex(data.backgroundColor),
    };
  } catch {
    return null;
  }
}
