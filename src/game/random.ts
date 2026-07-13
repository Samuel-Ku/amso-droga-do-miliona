const UINT32_RANGE = 4_294_967_296;

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 0x6d2b79f5;
  return Math.trunc(seed) >>> 0;
}

/** Small, deterministic PRNG suitable for repeatable gameplay and QA. */
export class SeededRandom {
  private value: number;

  constructor(seed: number) {
    this.value = normalizeSeed(seed);
  }

  next(): number {
    this.value = (this.value + 0x6d2b79f5) >>> 0;
    let value = this.value;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  integer(min: number, maxInclusive: number): number {
    return Math.floor(this.range(min, maxInclusive + 1));
  }
}

export function mixSeed(seed: number, runIndex: number): number {
  let value = normalizeSeed(seed) ^ Math.imul(runIndex + 1, 0x9e3779b1);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}
