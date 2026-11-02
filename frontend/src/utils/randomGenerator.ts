/**
 * Mulberry32 is a simple 32-bit PRNG with good statistical properties
 * and deterministic reproducibility across any platform given the same seed.
 */
export function createMulberry32(seedInput: number | string): () => number {
  let seed = typeof seedInput === 'number' ? seedInput : hashString(seedInput);
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) || 12345;
}
