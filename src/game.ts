export type Outcome = 'Nap' | 'Jog' | 'Zoomies';
export type Seed = 'daisy' | 'carrot' | 'strawberry';
export type Round = { id: number; work: string; outcome: Outcome; transactionHash?: `0x${string}`; settledAt: string };
export type Plant = { seed: Seed; growth: number; lastRound: number; plantedRound: number; signature?: `0x${string}`; message?: string };
export type Garden = { version: 1; plots: (Plant | null)[]; petals: number; harvests: number; rounds: number; practiceRound: number };

export const SEEDS: Record<Seed, { name: string; label: string; target: number; reward: number; note: string }> = {
  daisy: { name: 'Daisy', label: 'Little sunshine', target: 12, reward: 3, note: 'A cheerful first bloom.' },
  carrot: { name: 'Carrot', label: 'Hamster favorite', target: 16, reward: 4, note: 'A snack worth growing.' },
  strawberry: { name: 'Strawberry', label: 'Sweet little treat', target: 20, reward: 6, note: 'A berry lovely harvest.' },
};
export const GROWTH: Record<Outcome, number> = { Nap: 1, Jog: 3, Zoomies: 6 };
export const emptyGarden = (): Garden => ({ version: 1, plots: Array(6).fill(null), petals: 0, harvests: 0, rounds: 0, practiceRound: 0 });

export function outcomeForWork(work: string | bigint): Outcome {
  const n = BigInt(work);
  if (n < 0n) throw new Error('Work must be nonnegative.');
  return n === 0n ? 'Nap' : n < 500n ? 'Jog' : 'Zoomies';
}

export function plantSeed(garden: Garden, plot: number, seed: Seed, baseline: number, proof?: Pick<Plant, 'signature' | 'message'>): Garden {
  if (!Number.isInteger(plot) || plot < 0 || plot >= 6 || garden.plots[plot]) throw new Error('Choose an empty plot.');
  if (!Number.isSafeInteger(baseline) || baseline < 0) throw new Error('Wait for a settled round.');
  return { ...garden, plots: garden.plots.map((p, i) => i === plot ? { seed, growth: 0, lastRound: baseline, plantedRound: baseline, ...proof } : p) };
}

/** Only a continuous sequence of confirmed rounds may move a plant forward. */
export function applyRounds(garden: Garden, rounds: Round[]): Garden {
  const sorted = [...new Map(rounds.map(r => [r.id, r])).values()].sort((a, b) => a.id - b.id);
  let next = garden;
  for (const r of sorted) {
    if (outcomeForWork(r.work) !== r.outcome) throw new Error('Round outcome does not match settled work.');
    const growing = next.plots.filter((p): p is Plant => !!p && p.growth < SEEDS[p.seed].target && r.id > p.lastRound);
    if (!growing.length) continue;
    if (growing.some(p => r.id !== p.lastRound + 1)) throw new Error('Round history is incomplete. Growth is paused; retry to catch up.');
    next = {
      ...next, rounds: next.rounds + 1, petals: next.petals + (r.outcome === 'Zoomies' ? 1 : 0),
      plots: next.plots.map(p => p && p.growth < SEEDS[p.seed].target && r.id > p.lastRound ? {
        ...p, growth: Math.min(SEEDS[p.seed].target, p.growth + GROWTH[r.outcome]), lastRound: r.id,
      } : p),
    };
  }
  return next;
}

export function harvest(garden: Garden, plot?: number): { garden: Garden; count: number; petals: number } {
  let count = 0, petals = 0;
  const plots = garden.plots.map((p, i) => {
    if (p && (plot === undefined || i === plot) && p.growth >= SEEDS[p.seed].target) { count++; petals += SEEDS[p.seed].reward; return null; }
    return p;
  });
  return { garden: { ...garden, plots, harvests: garden.harvests + count, petals: garden.petals + petals }, count, petals };
}

export function parseGarden(raw: string): Garden {
  const g = JSON.parse(raw) as Garden;
  if (g.version !== 1 || !Array.isArray(g.plots) || g.plots.length !== 6) throw new Error('Saved garden format is unsupported.');
  for (const k of ['petals', 'harvests', 'rounds', 'practiceRound'] as const) if (!Number.isSafeInteger(g[k]) || g[k] < 0) throw new Error('Saved garden is damaged.');
  for (const p of g.plots) if (p !== null) {
    if (!Object.hasOwn(SEEDS, p.seed) || !Number.isSafeInteger(p.growth) || p.growth < 0 || p.growth > SEEDS[p.seed].target || !Number.isSafeInteger(p.lastRound) || !Number.isSafeInteger(p.plantedRound) || p.plantedRound < 0 || p.lastRound < p.plantedRound) throw new Error('Saved plant is damaged.');
    if (p.signature && (!/^0x[0-9a-f]+$/i.test(p.signature) || typeof p.message !== 'string')) throw new Error('Saved signature is damaged.');
  }
  return g;
}
