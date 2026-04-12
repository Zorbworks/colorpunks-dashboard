import type { AlchemyNft } from './alchemy';

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
