import { createThirdwebClient, type ThirdwebClient } from 'thirdweb';
import { upload } from 'thirdweb/storage';
import type { AlchemyNft } from './alchemy';

// Lazy-initialise: instantiating a Thirdweb client with an empty clientId
// throws immediately, which would crash the whole app at SSR time if the env
// var isn't set. We defer construction to the first real upload call.
let _client: ThirdwebClient | null = null;
function getClient(): ThirdwebClient {
  if (_client) return _client;
  const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      'Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID in .env.local — cannot upload to IPFS.'
    );
  }
  _client = createThirdwebClient({ clientId });
  return _client;
}

/**
 * Scale the working canvas to 1024x1024, upload it, then upload metadata JSON
 * that references it. Returns the metadata ipfs:// URI that should be written
 * to the NFT's tokenURI.
 */
export async function uploadColoredPunk(
  canvas: HTMLCanvasElement,
  punk: AlchemyNft
): Promise<string> {
  const client = getClient();

  // Scale up to 1024x1024 with nearest-neighbor so pixels stay crisp.
  const scaled = document.createElement('canvas');
  scaled.width = 1024;
  scaled.height = 1024;
  const ctx = scaled.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, 1024, 1024);

  const blob: Blob = await new Promise((resolve, reject) => {
    scaled.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png'
    );
  });

  const imageUri = await upload({
    client,
    files: [
      new File([blob], `punk-${punk.tokenId}.png`, { type: 'image/png' }),
    ],
  });

  const metadata = {
    name: punk.name || punk.raw?.metadata?.name || `ColorPunk #${punk.tokenId}`,
    description:
      punk.description ||
      punk.raw?.metadata?.description ||
      'A ColorPunk, colored by its owner with BaseColors.',
    image: imageUri,
    attributes: punk.raw?.metadata?.attributes ?? [],
  };

  const metadataUri = await upload({
    client,
    files: [
      new File([JSON.stringify(metadata)], `punk-${punk.tokenId}.json`, {
        type: 'application/json',
      }),
    ],
  });

  return metadataUri;
}
