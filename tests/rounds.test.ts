import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CORE_ADDRESS, STREAM_ID } from '../src/config';
import { roundsFromSettlement, validateCore } from '../src/rounds';

// Synthetic API fixtures are used only by tests, never bundled into the game.
const tx = `0x${'a'.repeat(64)}`;
function settlement(previous: string, through: string, count: string, work: string) {
  return { type: 'system.settlement_completed', eventVersion: 2, occurredAt: '2026-11-01T14:00:00.000Z', source: { kind: 'chain', confirmationStatus: 'safe', chainId: '11155111', contractAddress: CORE_ADDRESS, transactionHash: tx }, payload: { previousSettledThroughRound: previous, settledThroughRound: through, activeRoundCount: count, workAdded: work } };
}
const core = () => ({ schemaVersion: 1, status: 'available', identities: { core: CORE_ADDRESS }, configuration: { streamId: STREAM_ID, genesisTimestamp: '1793022600', roundDuration: '600' }, core: { settledThroughRound: '100' }, chain: { chainId: '11155111', target: 'sepolia', confirmations: '12', safeThroughBlock: '12000000' } });

test('only the pinned deployment, chain and supported available schema are accepted', () => {
  assert.equal(validateCore(core()).frontier, 100);
  assert.throws(() => validateCore({ ...core(), status: 'unavailable' }));
  assert.throws(() => validateCore({ ...core(), schemaVersion: 2 }));
  assert.throws(() => validateCore({ ...core(), chain: { ...core().chain, chainId: '1' } }));
  assert.throws(() => validateCore({ ...core(), chain: { ...core().chain, confirmations: '1' } }));
  assert.throws(() => validateCore({ ...core(), configuration: { ...core().configuration, streamId: 'different' } }));
});

test('a safe single-round settlement uses its exact work', async () => {
  const r = await roundsFromSettlement(settlement('100', '101', '1', '500'), new Map(), 101);
  assert.equal(r.length, 1);
  assert.equal(r[0].outcome, 'Zoomies');
  assert.equal(r[0].work, '500');
});

test('omitted rounds are Nap only inside a certified zero-work settlement span', async () => {
  const r = await roundsFromSettlement(settlement('100', '103', '0', '0'), new Map(), 103);
  assert.deepEqual(r.map(x => [x.id, x.outcome]), [[101, 'Nap'], [102, 'Nap'], [103, 'Nap']]);
});

test('a mixed batch uses per-round proofs rather than the aggregate total', async () => {
  const proofs = new Map([[tx, new Map([[101, '499'], [103, '1']])]]);
  const r = await roundsFromSettlement(settlement('100', '103', '2', '500'), proofs, 103);
  assert.deepEqual(r.map(x => [x.id, x.work, x.outcome]), [[101, '499', 'Jog'], [102, '0', 'Nap'], [103, '1', 'Jog']]);
});

test('unsafe, future and internally inconsistent settlements fail closed', async () => {
  const e = settlement('100', '101', '1', '499');
  await assert.rejects(roundsFromSettlement({ ...e, source: { ...e.source, confirmationStatus: 'pending' } }, new Map(), 101));
  await assert.rejects(roundsFromSettlement(e, new Map(), 100));
  await assert.rejects(roundsFromSettlement(settlement('100', '101', '0', '500'), new Map(), 101));
  await assert.rejects(roundsFromSettlement(settlement('100', '101', '1', '10001'), new Map(), 101));
});
