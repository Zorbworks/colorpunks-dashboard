/**
 * Run an async op, retrying once on failure after a short backoff.
 * Intended for transient RPC / IPFS hiccups — not a general-purpose retry.
 *
 * On failure, waits `delayMs` (default 600ms) then tries again. If the
 * retry also fails, the second error is thrown. Success on either attempt
 * returns the value.
 */
export async function retryOnce<T>(
  fn: () => Promise<T>,
  delayMs = 600
): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise((r) => setTimeout(r, delayMs));
    return fn();
  }
}
