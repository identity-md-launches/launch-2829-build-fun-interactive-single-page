import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyRounds, emptyGarden, harvest, outcomeForWork, parseGarden, plantSeed, type Round } from '../src/game';

const round = (id: number, work: string): Round => ({ id, work, outcome: outcomeForWork(work), settledAt: '2026-11-01T14:00:00.000Z' });

test('exact outcome thresholds use integer work, including large decimal strings', () => {
  assert.equal(outcomeForWork('0'), 'Nap');
  assert.equal(outcomeForWork('1'), 'Jog');
  assert.equal(outcomeForWork('499'), 'Jog');
  assert.equal(outcomeForWork('500'), 'Zoomies');
  assert.equal(outcomeForWork('999999999999999999999999'), 'Zoomies');
  assert.throws(() => outcomeForWork('-1'));
});

test('planting starts after the frontier, and duplicate polls never duplicate growth or bonus', () => {
  const planted = plantSeed(emptyGarden(), 0, 'daisy', 100);
  const grown = applyRounds(planted, [round(100, '600'), round(101, '0'), round(102, '499'), round(103, '500')]);
  assert.equal(grown.plots[0]?.growth, 10);
  assert.equal(grown.plots[0]?.lastRound, 103);
  assert.equal(grown.petals, 1);
  assert.equal(grown.rounds, 3);
  assert.deepEqual(applyRounds(grown, [round(103, '500'), round(101, '0')]), grown);
});

test('every plant has its own baseline and one Zoomies bonus is awarded per garden', () => {
  let g = plantSeed(emptyGarden(), 0, 'carrot', 100);
  g = applyRounds(g, [round(101, '100')]);
  g = plantSeed(g, 1, 'strawberry', 101);
  g = applyRounds(g, [round(100, '500'), round(101, '100'), round(102, '500')]);
  assert.equal(g.plots[0]?.growth, 9);
  assert.equal(g.plots[1]?.growth, 6);
  assert.equal(g.petals, 1);
  assert.equal(applyRounds(emptyGarden(), [round(1, '600')]).petals, 0);
});

test('missing rounds and inconsistent outcomes are rejected without changing plants', () => {
  const g = plantSeed(emptyGarden(), 0, 'daisy', 100);
  assert.throws(() => applyRounds(g, [round(102, '500')]), /history is incomplete/);
  assert.throws(() => applyRounds(g, [{ ...round(101, '0'), outcome: 'Zoomies' }]), /does not match/);
  assert.equal(g.plots[0]?.growth, 0);
});

test('harvest rewards only ready plants and cannot be collected twice', () => {
  let g = plantSeed(emptyGarden(), 0, 'daisy', 100);
  g = plantSeed(g, 1, 'carrot', 100);
  g = applyRounds(g, [round(101, '500'), round(102, '500'), round(103, '500')]);
  assert.equal(g.plots[0]?.growth, 12);
  assert.equal(g.plots[1]?.growth, 16);
  assert.equal(g.petals, 3);
  const result = harvest(g);
  assert.equal(result.count, 2);
  assert.equal(result.petals, 7);
  assert.equal(result.garden.harvests, 2);
  assert.equal(result.garden.petals, 10);
  assert.equal(harvest(result.garden).petals, 0);
  assert.equal(result.garden.plots.filter(Boolean).length, 0);
});

test('a premature harvest preserves the plant and occupied plots cannot be replanted', () => {
  const g = plantSeed(emptyGarden(), 0, 'daisy', 100);
  assert.equal(harvest(g).count, 0);
  assert.deepEqual(harvest(g).garden, g);
  assert.throws(() => plantSeed(g, 0, 'carrot', 101), /empty plot/);
  assert.throws(() => plantSeed(g, -1, 'carrot', 101));
});

test('saved progress round-trips and damaged saves are rejected', () => {
  const g = plantSeed(emptyGarden(), 0, 'strawberry', 100);
  assert.deepEqual(parseGarden(JSON.stringify(g)), g);
  assert.throws(() => parseGarden('{'));
  assert.throws(() => parseGarden(JSON.stringify({ ...g, plots: [] })));
  assert.throws(() => parseGarden(JSON.stringify({ ...g, petals: -1 })));
  assert.throws(() => parseGarden(JSON.stringify({ ...g, plots: [{ ...g.plots[0], growth: 500 }, null, null, null, null, null] })));
});
