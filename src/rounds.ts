import { parseEventLogs, type Hex } from 'viem';
import { API_URL, CORE_ADDRESS, STREAM_ID, publicClient, ROUND_RECORDED_ABI } from './config';
import { outcomeForWork, type Round } from './game';

type Obj = Record<string, unknown>;
const object = (v: unknown): Obj => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Unexpected API response.'); return v as Obj; };
const list = (v: unknown): unknown[] => { if (!Array.isArray(v)) throw new Error('Round history is unavailable.'); return v; };
const decimal = (v: unknown): string => { if (typeof v !== 'string' || !/^(0|[1-9]\d*)$/.test(v)) throw new Error('Invalid round data.'); return v; };
const integer = (v: unknown): number => { const n = Number(decimal(v)); if (!Number.isSafeInteger(n)) throw new Error('Round number is too large.'); return n; };
const hash = (v: unknown): Hex => { if (typeof v !== 'string' || !/^0x[0-9a-f]{64}$/i.test(v)) throw new Error('Settlement proof is unavailable.'); return v as Hex; };

export type Snapshot = { frontier: number; genesis: number; duration: number; rounds: Round[]; checkedAt: number; safeBlock: string; paused: boolean };

export function validateCore(value: unknown) {
  const data = object(value);
  if (data.schemaVersion !== 1 || data.status !== 'available') throw new Error('Settled rounds are unavailable. Retry in a moment.');
  const chain = object(data.chain), identities = object(data.identities), configuration = object(data.configuration), core = object(data.core);
  if (chain.chainId !== '11155111' || chain.target !== 'sepolia' || String(identities.core).toLowerCase() !== CORE_ADDRESS || configuration.streamId !== STREAM_ID || BigInt(decimal(chain.confirmations)) < 12n) throw new Error('The Squeekchain deployment changed. Garden growth is paused.');
  const duration = integer(configuration.roundDuration);
  if (!duration) throw new Error('Round duration is unavailable.');
  return { data, frontier: integer(core.settledThroughRound), genesis: integer(configuration.genesisTimestamp), duration, safeBlock: decimal(chain.safeThroughBlock), paused: core.paused === true };
}

async function apiGet(path: string, signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(15_000);
  const response = await fetch(`${API_URL}${path}`, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout, headers: { accept: 'application/json' }, cache: 'no-cache' });
  if (!response.ok) throw new Error(response.status === 429 ? 'Squeekchain is busy. Retry shortly.' : 'Unable to load settled rounds. Check your connection and retry.');
  return object(await response.json());
}

/** Expand only safe settlements; aggregate work is never treated as a per-round result. */
export async function roundsFromSettlement(value: unknown, recorded: Map<string, Map<number, string>>, frontier: number): Promise<Round[]> {
  const e = object(value), source = object(e.source), payload = object(e.payload);
  if (e.type !== 'system.settlement_completed' || e.eventVersion !== 2 || source.kind !== 'chain' || source.confirmationStatus !== 'safe' || source.chainId !== '11155111' || String(source.contractAddress).toLowerCase() !== CORE_ADDRESS) throw new Error('Unconfirmed or unsupported settlement.');
  const previous = integer(payload.previousSettledThroughRound), through = integer(payload.settledThroughRound), activeCount = integer(payload.activeRoundCount), workAdded = decimal(payload.workAdded), tx = hash(source.transactionHash);
  if (through <= previous || through > frontier || through - previous > 100_000 || activeCount > through - previous || typeof e.occurredAt !== 'string' || !Number.isFinite(Date.parse(e.occurredAt))) throw new Error('Invalid settlement range.');
  let work = recorded.get(tx) ?? new Map<number, string>();
  if (through - previous === 1) work = BigInt(workAdded) > 0n ? new Map([[through, workAdded]]) : new Map();
  else if (activeCount > 0 && [...work.keys()].filter(r => r > previous && r <= through).length !== activeCount) {
    // A batched settlement needs individual RoundRecorded proofs. The API only reports its total.
    const receipt = await publicClient.getTransactionReceipt({ hash: tx });
    if (receipt.status !== 'success' || receipt.blockHash.toLowerCase() !== hash(source.blockHash).toLowerCase() || receipt.blockNumber !== BigInt(decimal(source.blockNumber))) throw new Error('Settlement receipt does not match the confirmed API result.');
    const logs = parseEventLogs({ abi: ROUND_RECORDED_ABI, logs: receipt.logs.filter(l => l.address.toLowerCase() === CORE_ADDRESS), strict: true });
    work = new Map(logs.map(l => [Number(l.args.roundId), l.args.work.toString()]));
  }
  const active = [...work].filter(([id]) => id > previous && id <= through);
  if (active.length !== activeCount || active.reduce((n, [, w]) => n + BigInt(w), 0n) !== BigInt(workAdded) || active.some(([, w]) => BigInt(w) <= 0n || BigInt(w) > 10000n)) throw new Error('Individual round proofs are incomplete. Growth is paused.');
  return Array.from({ length: through - previous }, (_, i) => {
    const id = previous + i + 1, w = work.get(id) ?? '0';
    return { id, work: w, outcome: outcomeForWork(w), transactionHash: tx, settledAt: e.occurredAt as string };
  });
}

export async function fetchSnapshot(since?: number, signal?: AbortSignal): Promise<Snapshot> {
  const core = validateCore(await apiGet('/v1/core', signal));
  const wanted = Math.min(since ?? core.frontier, Math.max(0, core.frontier - 8));
  const recorded = new Map<string, Map<number, string>>();
  for (const raw of list(core.data.events)) {
    const e = object(raw);
    if (e.eventName !== 'RoundRecorded' || String(e.contractAddress).toLowerCase() !== CORE_ADDRESS) continue;
    const args = Object.fromEntries(list(e.arguments).map(a => { const v = object(a); return [String(v.name), v.value]; }));
    const tx = hash(e.transactionHash), map = recorded.get(tx) ?? new Map<number, string>();
    map.set(integer(args.roundId), decimal(args.work)); recorded.set(tx, map);
  }
  const rounds = new Map<number, Round>();
  let cursor: string | null = null, reached = wanted >= core.frontier;
  for (let page = 0; page < 24; page++) {
    const data = await apiGet(`/v1/events?category=protocol&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, signal);
    if (data.schemaVersion !== 3 || data.status !== 'available' || object(data.chain).chainId !== '11155111' || String(object(data.identities).core).toLowerCase() !== CORE_ADDRESS) throw new Error('Confirmed round history is unavailable. Retry shortly.');
    for (const raw of list(data.events)) {
      const e = object(raw);
      if (e.type !== 'system.settlement_completed') continue;
      const p = object(e.payload), through = integer(p.settledThroughRound), previous = integer(p.previousSettledThroughRound);
      if (through > core.frontier) continue; // Two API snapshots can be one block apart.
      if (through <= wanted) { reached = true; continue; }
      for (const r of await roundsFromSettlement(raw, recorded, core.frontier)) if (r.id > wanted) rounds.set(r.id, r);
      if (previous <= wanted) reached = true;
    }
    if (reached) break;
    cursor = typeof data.nextCursor === 'string' ? data.nextCursor : null;
    if (!cursor) break;
  }
  const sorted = [...rounds.values()].sort((a, b) => a.id - b.id);
  if (wanted < core.frontier && (sorted.length !== core.frontier - wanted || sorted.some((r, i) => r.id !== wanted + i + 1))) throw new Error('Round history is incomplete. Growth is paused; retry to catch up.');
  return { frontier: core.frontier, genesis: core.genesis, duration: core.duration, rounds: sorted, checkedAt: Date.now(), safeBlock: core.safeBlock, paused: core.paused };
}
