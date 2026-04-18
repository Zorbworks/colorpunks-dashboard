import type { AlchemyNft } from './alchemy';

/** The original uncolored metadata CID — punks with a different image have been colored. */
const ORIGINAL_CID = 'QmZzBSaDAEwJhSUkhrcfVmZmbD1GwVLHd4GGoGGTWJWmSQ';

export type PunkType = 'male' | 'female' | 'zombie' | 'ape' | 'alien';
export type PunkTypeFilter = 'all' | PunkType;

export const PUNK_TYPE_LABELS: Record<PunkType, string> = {
  male: 'M',
  female: 'F',
  zombie: 'Z',
  ape: 'A',
  alien: 'AL',
};

export interface PunkTrait {
  traitType: string;
  value: string;
}

/** Extract the punk type (male/female/zombie/ape/alien) from metadata attributes. */
export function getPunkType(punk: AlchemyNft): PunkType | null {
  const attrs = punk.raw?.metadata?.attributes ?? [];
  const typeAttr = attrs.find(
    (a) => a.trait_type === 'punks' || a.trait_type === 'type'
  );
  if (!typeAttr) return null;
  const val = typeAttr.value.toLowerCase();
  if (['male', 'female', 'zombie', 'ape', 'alien'].includes(val)) {
    return val as PunkType;
  }
  return null;
}

/** Extract all traits (excluding the punk type) from metadata attributes. */
export function getPunkTraits(punk: AlchemyNft): PunkTrait[] {
  const attrs = punk.raw?.metadata?.attributes ?? [];
  return attrs
    .filter((a) => a.trait_type !== 'punks' && a.trait_type !== 'type')
    .map((a) => ({
      traitType: a.trait_type,
      value: a.value,
    }));
}

/** Get all unique trait types across a set of punks. */
export function getAllTraitTypes(punks: AlchemyNft[]): string[] {
  const types = new Set<string>();
  for (const punk of punks) {
    for (const attr of punk.raw?.metadata?.attributes ?? []) {
      if (attr.trait_type !== 'punks' && attr.trait_type !== 'type') {
        types.add(attr.trait_type);
      }
    }
  }
  return Array.from(types).sort();
}

/** Filter punks by type. */
export function filterPunksByType(
  punks: AlchemyNft[],
  filter: PunkTypeFilter
): AlchemyNft[] {
  if (filter === 'all') return punks;
  return punks.filter((p) => getPunkType(p) === filter);
}

export type PunkSort = 'default' | 'id-asc' | 'id-desc' | 'recent' | 'colored' | 'rare';

const TYPE_RARITY: Record<string, number> = {
  alien: 6,
  ape: 5,
  zombie: 4,
  female: 1,
  male: 1,
};

/** Simple rarity score: type rarity bonus + number of non-type traits. */
export function getRarityScore(punk: AlchemyNft): number {
  const attrs = punk.raw?.metadata?.attributes ?? [];
  const ptype = getPunkType(punk);
  const typeScore = ptype ? (TYPE_RARITY[ptype] ?? 1) : 1;
  const traitCount = attrs.filter(
    (a) => a.trait_type !== 'punks' && a.trait_type !== 'type'
  ).length;
  return typeScore + traitCount;
}

/** Check whether a punk has been colored (image differs from original CID). */
export function isColored(punk: AlchemyNft): boolean {
  const img =
    punk.image?.cachedUrl ??
    punk.image?.originalUrl ??
    punk.raw?.metadata?.image ??
    '';
  return Boolean(img) && !img.includes(ORIGINAL_CID);
}

export interface SortMaps {
  lastReceivedBlock?: Map<string, bigint>;
  lastColoredBlock?: Map<string, bigint>;
}

/** Sort punks by the given criteria. */
export function sortPunks(
  punks: AlchemyNft[],
  sort: PunkSort,
  sortData?: SortMaps
): AlchemyNft[] {
  if (sort === 'default') return punks;
  const out = punks.slice();
  switch (sort) {
    case 'id-asc':
      return out.sort((a, b) => Number(a.tokenId) - Number(b.tokenId));
    case 'id-desc':
      return out.sort((a, b) => Number(b.tokenId) - Number(a.tokenId));
    case 'recent':
      // Sort by the block of the most recent Transfer event to the owner.
      return out.sort((a, b) => {
        const ba = sortData?.lastReceivedBlock?.get(a.tokenId) ?? 0n;
        const bb = sortData?.lastReceivedBlock?.get(b.tokenId) ?? 0n;
        return Number(bb - ba);
      });
    case 'colored':
      // Colored punks first, uncolored second. Tiebreak by tokenId desc.
      return out.sort((a, b) => {
        const ca = isColored(a) ? 1 : 0;
        const cb = isColored(b) ? 1 : 0;
        if (ca !== cb) return cb - ca;
        return Number(b.tokenId) - Number(a.tokenId);
      });
    case 'rare':
      return out.sort((a, b) => getRarityScore(b) - getRarityScore(a));
    default:
      return out;
  }
}

/** Group punks by a specific trait type, returning groups sorted by trait value. */
export function groupPunksByTrait(
  punks: AlchemyNft[],
  traitType: string
): { value: string; punks: AlchemyNft[] }[] {
  const groups = new Map<string, AlchemyNft[]>();
  const noTrait: AlchemyNft[] = [];

  for (const punk of punks) {
    const attrs = punk.raw?.metadata?.attributes ?? [];
    const attr = attrs.find((a) => a.trait_type === traitType);
    if (attr) {
      const key = attr.value;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(punk);
    } else {
      noTrait.push(punk);
    }
  }

  const sorted = Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([value, punks]) => ({ value, punks }));

  if (noTrait.length > 0) {
    sorted.push({ value: 'none', punks: noTrait });
  }

  return sorted;
}
