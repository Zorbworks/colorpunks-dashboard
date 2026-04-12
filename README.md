# ColorPunks DIY

A pure-frontend Next.js app that lets holders color their [ColorPunks](https://basescan.org/address/0x67c7187031819a83e86286a64d117305b1902eb2) with their [BaseColors](https://basescan.org/address/0x7Bc1C072742D8391817EB4Eb2317F98dc72C61dB) and save the result on Base mainnet.

No backend. No admin keys. The token owner signs `updateTokenURI` themselves.

## Stack

- Next.js 14 (App Router)
- wagmi v2 + viem + RainbowKit
- Tailwind CSS
- Alchemy NFT API (read)
- Thirdweb Storage SDK (IPFS upload)
- Base mainnet (chain id 8453)

## Setup

1. Install deps:
   ```bash
   npm install
   ```

2. Copy the env template and fill in the three keys:
   ```bash
   cp .env.local.example .env.local
   ```
   - `NEXT_PUBLIC_ALCHEMY_API_KEY` — https://dashboard.alchemy.com
   - `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` — https://thirdweb.com/dashboard
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — https://cloud.walletconnect.com

3. Run the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## How it works

1. Connect a wallet on Base.
2. The app queries Alchemy for the connected wallet's ColorPunks and BaseColors.
3. Pick a punk → it loads into an HTML `<canvas>` at 512×512, nearest-neighbor.
4. Pick a BaseColor → clicking on the canvas flood-fills that region. Outline pixels are skipped.
5. Click **Save on-chain**:
   - Canvas is scaled to 1024×1024 and uploaded to IPFS via Thirdweb Storage.
   - A new metadata JSON referencing the new image is uploaded.
   - The wallet is prompted to sign `updateTokenURI(tokenId, ipfs://...)` on the ColorPunks contract.
6. Once confirmed, OpenSea / other marketplaces will pick up the new metadata on their next refresh.

## Project structure

```
app/
  layout.tsx       — root layout + providers
  page.tsx         — main UI wiring
  providers.tsx    — wagmi + rainbowkit + react-query
  globals.css
components/
  ConnectButton.tsx
  PunkSelector.tsx
  ColorPalette.tsx
  Canvas.tsx       — canvas w/ flood fill, undo, reset
  SaveButton.tsx   — IPFS upload + on-chain tx
  Instructions.tsx
hooks/
  useUserPunks.ts
  useUserColors.ts
  useSavePunk.ts
lib/
  alchemy.ts       — NFT fetching + ipfs:// resolver
  canvas.ts        — flood fill algorithm
  ipfs.ts          — Thirdweb Storage uploads
  contracts.ts     — addresses + minimal ABI
```

## Notes

- **CORS**: Canvas pixel reads require the image host to send proper CORS headers. Alchemy's cached URLs usually do; IPFS gateways vary. If you see a CORS error, the punk image is hosted on a gateway that blocks cross-origin reads.
- **Gas**: `updateTokenURI` is cheap on Base (~$0.001–0.01).
- **Undo**: Capped at 50 steps.
- **Indexing**: Marketplaces cache metadata aggressively. Use the "refresh metadata" button on OpenSea if you don't see the new image immediately.
