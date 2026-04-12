import type { AlchemyNft, UserColor } from './alchemy';

/**
 * 24x24 SVG "punk" template. Keeps black outlines so the flood-fill has
 * clear region boundaries. All fillable areas start as #CCCCCC (grey) so
 * you can see what you're painting on a clean slate.
 */
function svgPunk(opts: {
  bg?: string;
  accessory?: 'hat' | 'band' | 'cap' | 'none';
}) {
  const bg = opts.bg ?? '#CCCCCC';
  const acc = opts.accessory ?? 'hat';

  const accessoryShape =
    acc === 'hat'
      ? `
      <rect x="5" y="2" width="14" height="1" fill="#000"/>
      <rect x="4" y="3" width="16" height="1" fill="#000"/>
      <rect x="5" y="4" width="14" height="2" fill="#CCCCCC"/>
      <rect x="4" y="6" width="16" height="1" fill="#000"/>
    `
      : acc === 'band'
      ? `
      <rect x="6" y="4" width="12" height="1" fill="#000"/>
      <rect x="6" y="5" width="12" height="1" fill="#CCCCCC"/>
      <rect x="6" y="6" width="12" height="1" fill="#000"/>
    `
      : acc === 'cap'
      ? `
      <rect x="6" y="3" width="12" height="1" fill="#000"/>
      <rect x="6" y="4" width="12" height="2" fill="#CCCCCC"/>
      <rect x="6" y="6" width="12" height="1" fill="#000"/>
      <rect x="14" y="5" width="6" height="1" fill="#000"/>
      <rect x="14" y="6" width="6" height="1" fill="#CCCCCC"/>
      <rect x="14" y="7" width="6" height="1" fill="#000"/>
    `
      : '';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" shape-rendering="crispEdges">
      <!-- background -->
      <rect width="24" height="24" fill="${bg}"/>

      <!-- accessory at top -->
      ${accessoryShape}

      <!-- face fill -->
      <rect x="7" y="7" width="10" height="11" fill="#CCCCCC"/>

      <!-- face outline -->
      <rect x="7" y="7"  width="10" height="1" fill="#000"/>
      <rect x="6" y="8"  width="1"  height="10" fill="#000"/>
      <rect x="17" y="8" width="1"  height="10" fill="#000"/>
      <rect x="7" y="18" width="10" height="1" fill="#000"/>

      <!-- eyes -->
      <rect x="9"  y="10" width="2" height="2" fill="#000"/>
      <rect x="13" y="10" width="2" height="2" fill="#000"/>

      <!-- nose -->
      <rect x="11" y="13" width="2" height="1" fill="#000"/>

      <!-- mouth -->
      <rect x="10" y="15" width="4" height="1" fill="#000"/>

      <!-- shirt -->
      <rect x="4" y="19" width="16" height="5" fill="#CCCCCC"/>
      <rect x="4" y="19" width="16" height="1" fill="#000"/>
      <rect x="3" y="20" width="1"  height="4" fill="#000"/>
      <rect x="20" y="20" width="1" height="4" fill="#000"/>

      <!-- collar detail -->
      <rect x="11" y="19" width="2" height="2" fill="#000"/>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

function makePunk(
  tokenId: string,
  name: string,
  opts: Parameters<typeof svgPunk>[0]
): AlchemyNft {
  const uri = svgPunk(opts);
  return {
    tokenId,
    name,
    description: 'Mock punk for the demo — not an on-chain token.',
    image: { cachedUrl: uri, originalUrl: uri },
    raw: {
      metadata: {
        name,
        description: 'Mock punk',
        image: uri,
        attributes: [
          { trait_type: 'Accessory', value: opts.accessory ?? 'none' },
        ],
      },
    },
  };
}

export const MOCK_PUNKS: AlchemyNft[] = [
  makePunk('1', 'ColorPunk #1', { accessory: 'hat' }),
  makePunk('42', 'ColorPunk #42', { accessory: 'band' }),
  makePunk('137', 'ColorPunk #137', { accessory: 'cap' }),
  makePunk('256', 'ColorPunk #256', { accessory: 'none' }),
  makePunk('512', 'ColorPunk #512', { accessory: 'hat' }),
  makePunk('1024', 'ColorPunk #1024', { accessory: 'cap' }),
];

function mockColor(
  tokenId: string,
  color: string,
  name?: string
): UserColor {
  return {
    tokenId,
    color,
    name: name ?? color,
    isNamed: Boolean(name),
    image: null,
  };
}

export const MOCK_COLORS: UserColor[] = [
  mockColor('c1', '#FF5733', 'Sunset Red'),
  mockColor('c2', '#FFC300', 'Mustard'),
  mockColor('c3', '#DAF7A6', 'Mint'),
  mockColor('c4', '#33FF57', 'Neon Lime'),
  mockColor('c5', '#33FFF5', 'Cyan Pop'),
  mockColor('c6', '#3380FF'),
  mockColor('c7', '#8E44AD', 'Grape'),
  mockColor('c8', '#FF33A8'),
  mockColor('c9', '#E5B887', 'Skin Tone'),
  mockColor('c10', '#5C3317', 'Walnut'),
  mockColor('c11', '#FFFFFF', 'Paper'),
  mockColor('c12', '#1C1C1C'),
  mockColor('c13', '#0052FF', 'Base Blue'),
  mockColor('c14', '#FFD700', 'Gold'),
  mockColor('c15', '#C0C0C0'),
  mockColor('c16', '#8B0000', 'Blood'),
];
