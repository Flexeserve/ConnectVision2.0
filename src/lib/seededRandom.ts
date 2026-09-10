const hashSeed = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return h >>> 0;
};

export const createSeededRandom = (seed: string) => {
  let state = hashSeed(seed) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

export const seededInt = (seed: string, min: number, max: number) => {
  const rand = createSeededRandom(seed);
  return Math.round(min + rand() * (max - min));
};

export const seededFloat = (
  seed: string,
  min: number,
  max: number,
  decimals = 1,
) => {
  const rand = createSeededRandom(seed);
  const value = min + rand() * (max - min);
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const seededPick = <T,>(rand: () => number, items: T[]): T =>
  items[Math.floor(rand() * items.length) % items.length];

// Stable, seeded display name for a store id. Ids at region/root scope are
// synthetic, so each one picks a name from the current scope's pool.
export const storeName = (id: string, pool: string[]): string =>
  pool.length
    ? seededPick(createSeededRandom(`${id}:store-name`), pool)
    : id;
