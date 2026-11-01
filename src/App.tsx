import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnection, useSignMessage, useSwitchChain } from 'wagmi';
import { verifyMessage, type Hex } from 'viem';
import { sepolia } from 'viem/chains';
import { GardenScene, Hamster, Icon, PlantArt } from './Art';
import { Modal } from './Modal';
import { WalletButton, WalletSheet } from './Wallet';
import { applyRounds, GROWTH, harvest, plantSeed, SEEDS, type Outcome, type Round, type Seed } from './game';
import { API_URL, config, CORE_ADDRESS, EXPLORER_URL, LIVESTREAM_URL, publicClient } from './config';
import { fetchSnapshot, type Snapshot } from './rounds';
import { useGarden } from './useGarden';

type Mode = 'live' | 'practice';
const OUTCOME_ICON = { Nap: 'moon', Jog: 'leaf', Zoomies: 'bolt' } as const;
const PRACTICE_SEQUENCE: { outcome: Outcome; work: string }[] = [{ outcome: 'Jog', work: '120' }, { outcome: 'Nap', work: '0' }, { outcome: 'Zoomies', work: '650' }];
const format = (n: number) => n.toLocaleString('en-US');

export function App() {
  const { address } = useConnection();
  const [mode, setMode] = useState<Mode>('live');
  const [walletOpen, setWalletOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [message, setMessage] = useState('');
  const openWallet = useCallback(() => { setHelpOpen(false); setWalletOpen(true); }, []);
  return <>
    <a href="#garden" className="skip-link">Skip to garden</a>
    <header className="site-header">
      <a className="brand" href="#garden" aria-label="Squeek Garden home"><span className="brand-mark"><Hamster /></span><span>Squeek<span className="brand-light"> Garden</span><span className="brand-period">.</span></span></a>
      <nav className="header-nav" aria-label="Main"><a href="#garden" className="nav-current" aria-current="page">The garden</a><button onClick={() => setHelpOpen(true)}>How it grows <Icon name="external" size={14} /></button></nav>
      <div className="header-actions"><button className="icon-button help-mobile" aria-label="How it grows" onClick={() => setHelpOpen(true)}><Icon name="help" /></button><WalletButton onOpen={openWallet} /></div>
    </header>
    <main id="garden" className="page" tabIndex={-1}>
      <div className="intro"><div><h1>Grow at hamster speed<span>.</span></h1><p>A cozy little garden powered by real Squeekchain rounds.</p></div><span className="network-label"><span className="network-dot" /> Squeekchain <span className="network-secondary">/ Sepolia</span></span></div>
      <Game key={`${mode}:${address ?? 'guest'}`} mode={mode} onMode={setMode} onWallet={openWallet} onHelp={() => setHelpOpen(true)} announce={setMessage} />
      <footer className="site-footer"><span><Icon name="sprout" size={16} /> Small paws. A little more green.</span><div><span>Made for Squeekchain</span><a href="https://docs.squeekchain.com/developers/api/" target="_blank" rel="noreferrer">Data & docs <Icon name="external" size={13} /></a><button onClick={() => setHelpOpen(true)}>Garden guide</button></div></footer>
    </main>
    <div className="sr-only" role="status" aria-live="polite">{message}</div>
    {walletOpen && <WalletSheet onClose={() => setWalletOpen(false)} />}
    {helpOpen && <Modal title="A little guide to growing" onClose={() => setHelpOpen(false)} wide>
      <div className="guide-intro"><Hamster /><p>One real hamster. Six little plots. A garden that grows whenever a Squeekchain round settles.</p></div>
      <ol className="guide-steps"><li><strong>Plant something happy.</strong><span>Connect a Sepolia wallet, pick a seed, and sign a free planting message. All seeds are free.</span></li><li><strong>Let the hamster do its thing.</strong><span>Every confirmed round adds growth: Nap +1, Jog +3, Zoomies +6. A Zoomies round also adds 1 petal if you have a growing plant.</span></li><li><strong>Bring in the harvest.</strong><span>Harvest fully grown plants for petals, then plant again. Petals are game points with no monetary value.</span></li></ol>
      <div className="guide-note"><Icon name="help" /><p>Live rounds last 10 minutes and settle after verification. This garden only uses settled results, 12 confirmations behind Sepolia. It never grows from live wheel readings.</p></div>
      <p className="fine-print">Garden progress and signatures are saved in this browser, separately for each wallet. They do not sync between devices. Practice is a separate local garden with simulated rounds.</p>
      <button className="button primary full" onClick={() => setHelpOpen(false)}>Back to the garden <Icon name="arrow" size={18} /></button>
    </Modal>}
  </>;
}

function Game({ mode, onMode, onWallet, onHelp, announce }: { mode: Mode; onMode: (m: Mode) => void; onWallet: () => void; onHelp: () => void; announce: (m: string) => void }) {
  const { address, isConnected, chainId } = useConnection();
  const { mutateAsync: signMessage, isPending: signing } = useSignMessage();
  const { mutateAsync: switchChain, isPending: switching } = useSwitchChain();
  const practice = mode === 'practice';
  const key = `squeek-garden:v1:${practice ? 'practice' : `${CORE_ADDRESS}:${address?.toLowerCase() ?? 'guest'}`}`;
  const { garden, update, latest, storageWarning } = useGarden(key);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [fetchError, setFetchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const [seed, setSeed] = useState<Seed>('daisy');
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [detailPlot, setDetailPlot] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [proofPending, setProofPending] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState<Round[]>([]);
  const inflight = useRef(false), alive = useRef(true);
  const refresh = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true; setLoading(true);
    try {
      const growing = latest.current.plots.filter(p => p && p.growth < SEEDS[p.seed].target);
      const since = growing.length ? Math.min(...growing.map(p => p!.lastRound)) : undefined;
      const data = await fetchSnapshot(since);
      if (!alive.current) return;
      if (!practice && growing.length) update(g => applyRounds(g, data.rounds));
      setSnapshot(data); setFetchError('');
    } catch (e) { if (alive.current) setFetchError(e instanceof Error ? e.message : 'Unable to load settled rounds. Retry shortly.'); }
    finally { inflight.current = false; if (alive.current) setLoading(false); }
  }, [latest, practice, update]);
  useEffect(() => {
    alive.current = true;
    void refresh();
    const interval = setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 45_000);
    const tick = setInterval(() => setClock(Date.now()), 15_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { alive.current = false; clearInterval(interval); clearInterval(tick); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh]);
  const notify = (text: string) => { setFeedback(text); announce(text); };
  const lastRound = practice ? practiceHistory.at(-1) : snapshot?.rounds.at(-1);
  const outcome = lastRound?.outcome;
  const readyCount = garden.plots.filter(p => p && p.growth >= SEEDS[p.seed].target).length;
  const planted = garden.plots.filter(Boolean).length;
  const firstEmpty = garden.plots.findIndex(p => !p);
  const currentRound = snapshot ? Math.max(1, Math.floor((clock / 1000 - snapshot.genesis) / snapshot.duration) + 1) : null;
  const stale = !!snapshot && clock - snapshot.checkedAt > 120_000;
  const liveStatus = fetchError || stale ? 'Connection paused' : snapshot?.paused ? 'Settlement paused' : snapshot ? 'Following settled rounds' : 'Finding settled rounds…';
  const history = practice ? [...practiceHistory].reverse().slice(0, 6) : [...snapshot?.rounds ?? []].reverse().slice(0, 6);
  const busy = signing || proofPending;
  const wrongChain = isConnected && chainId !== sepolia.id;

  function choosePlot(i: number) {
    setActionError('');
    if (garden.plots[i]) { setDetailPlot(i); return; }
    setSelectedPlot(i);
  }

  async function plant() {
    if (selectedPlot === null || busy) return;
    setActionError('');
    if (!practice && !isConnected) { setSelectedPlot(null); onWallet(); return; }
    if (!practice && wrongChain) {
      try { await switchChain({ chainId: sepolia.id }); } catch { setActionError('Network switch was declined. Try switching to Sepolia again.'); }
      return;
    }
    if (!practice && (!snapshot || fetchError || stale)) { setActionError('Wait for confirmed rounds, then retry.'); void refresh(); return; }
    const plot = selectedPlot, chosen = seed, baseline = practice ? latest.current.practiceRound : snapshot!.frontier;
    let proof: { signature: Hex; message: string } | undefined;
    try {
      if (!practice && address) {
        const signer = address;
        const message = `Squeek Garden\nPlant ${SEEDS[chosen].name} in plot ${plot + 1}.\nSite: ${location.origin}${location.pathname}\nWallet: ${signer}\nChain: Ethereum Sepolia (11155111)\nSqueekCore: ${CORE_ADDRESS}\nStart after settled round: ${baseline}\nTime: ${new Date().toISOString()}\nNonce: ${crypto.randomUUID()}\n\nThis free message saves a plant in this browser. It does not send a transaction, approve tokens, or move funds.`;
        const signature = await signMessage({ message });
        if (!alive.current) return;
        setProofPending(true);
        const locallyValid = await verifyMessage({ address: signer, message, signature }).catch(() => false);
        const valid = locallyValid || await publicClient.verifyMessage({ address: signer, message, signature });
        if (!valid) throw new Error('Signature could not be verified. Try signing again.');
        const state = config.state, connection = state.current && state.connections.get(state.current);
        if (!alive.current || !connection || connection.accounts[0].toLowerCase() !== signer.toLowerCase() || connection.chainId !== sepolia.id) throw new Error('Your wallet changed. Reopen planting and try again.');
        proof = { signature, message };
      }
      if (!alive.current) return;
      update(g => plantSeed(g, plot, chosen, baseline, proof));
      setSelectedPlot(null);
      notify(`${SEEDS[chosen].name} planted in plot ${plot + 1}. ${practice ? 'Play a practice round to grow it.' : 'The next settled round will help it grow.'}`);
    } catch (e) {
      if (alive.current) setActionError(e instanceof Error && /Choose|Signature|wallet changed/.test(e.message) ? e.message : 'Planting was not signed. Open your wallet and try again.');
    } finally { if (alive.current) setProofPending(false); }
  }

  function collect(plot?: number) {
    let count = 0, petals = 0;
    update(g => { const result = harvest(g, plot); count = result.count; petals = result.petals; return result.garden; });
    setDetailPlot(null);
    notify(count ? `${count === 1 ? 'A lovely harvest' : `${count} plants harvested`}! +${petals} petals in your basket.` : 'Your plants need a little more growth before harvest.');
  }

  function playRound() {
    let round: Round | undefined;
    update(g => {
      const r = PRACTICE_SEQUENCE[g.practiceRound % PRACTICE_SEQUENCE.length];
      round = { id: g.practiceRound + 1, ...r, settledAt: new Date().toISOString() };
      return { ...applyRounds(g, [round]), practiceRound: round.id };
    });
    if (round) { const r = round as Round; setPracticeHistory(h => [...h, r].slice(-6)); notify(`Practice ${r.outcome}: +${GROWTH[r.outcome]} growth${r.outcome === 'Zoomies' && garden.plots.some(p => p && p.growth < SEEDS[p.seed].target) ? ' and 1 bonus petal' : ''}.`); }
  }

  return <>
    <section className="live-bar" aria-label="Squeekchain status">
      <div className="live-indicator"><span className={`status-dot ${fetchError || stale ? 'status-paused' : ''}`} /><span>{liveStatus}</span></div>
      <div className="live-data"><span>Current round <strong>{currentRound ? `#${format(currentRound)}` : '—'}</strong></span><span className="bar-divider" /><span>Last settled <strong>{snapshot ? `#${format(snapshot.frontier)}` : '—'}</strong></span><span className="live-outcome">{!practice && outcome && <><Icon name={OUTCOME_ICON[outcome]} size={16} /> {outcome}</>}</span></div>
      <a className="stream-link" href={LIVESTREAM_URL} target="_blank" rel="noreferrer"><span className="play-icon" /> Official livestream <Icon name="external" size={13} /></a>
    </section>
    <div className="workspace">
      <section className="garden-panel" aria-label={practice ? 'Practice garden' : 'Live garden'}>
        <div className="garden-toolbar"><div className="mode-switch" aria-label="Garden mode"><button aria-pressed={!practice} className={!practice ? 'active' : ''} onClick={() => onMode('live')}>Live garden</button><button aria-pressed={practice} className={practice ? 'active' : ''} onClick={() => onMode('practice')}>Practice</button></div><span className="plot-count"><Icon name="sprout" size={16} /> {planted} / 6 plots</span></div>
        <div className="garden-caption"><span>{practice ? 'Your practice patch' : 'Your little patch of happy'}</span><span>{practice ? 'Simulated rounds' : 'Settled rounds. Real growth.'}</span></div>
        <GardenScene plots={garden.plots} outcome={outcome} onPlot={choosePlot} />
        <div className="garden-action"><div className="garden-hint"><Icon name={outcome ? OUTCOME_ICON[outcome] : 'sun'} size={20} /><div><strong>{planted === 0 ? 'Every garden starts with a seed.' : readyCount ? 'Something lovely is ready.' : outcome === 'Nap' ? 'A little rest is growing, too.' : outcome === 'Zoomies' ? 'Tiny paws. Big growing energy.' : 'Good things are growing.'}</strong><span>{practice ? 'Plant a seed, then play a practice round.' : 'Pick a seed and choose an empty plot.'}</span></div></div><button className="button primary plant-main" disabled={firstEmpty < 0} onClick={() => choosePlot(firstEmpty)}><Icon name="sprout" size={19} />{firstEmpty < 0 ? 'All plots planted' : 'Plant a seed'}<Icon name="arrow" size={18} /></button></div>
        <div className="garden-feedback" role="status">{feedback}</div>
        {practice && <div className="practice-controls"><span><strong>Practice mode</strong> · Your live garden stays separate.</span><button className="button secondary" onClick={playRound}>Play a practice round <Icon name="arrow" size={16} /></button></div>}
        {(fetchError || stale) && !practice && <div className="connection-notice"><p>{fetchError || 'The connection is stale. Growth is paused until confirmed rounds refresh.'}</p><button className="text-button" disabled={loading} onClick={() => void refresh()}><Icon name="refresh" size={15} />{loading ? 'Retrying…' : 'Retry connection'}</button><button className="text-button" onClick={() => onMode('practice')}>Try practice</button></div>}
        {storageWarning && <p className="storage-warning" role="status">{storageWarning}</p>}
      </section>
      <aside className="garden-sidebar">
        <section className="seed-pocket" aria-labelledby="seed-heading"><div className="section-title"><h2 id="seed-heading">The seed pocket</h2><span className="small-tag">Always free</span></div><p className="muted">A little something for every plot.</p><div className="seed-options" role="group" aria-label="Choose a seed">{(Object.keys(SEEDS) as Seed[]).map(id => <button key={id} className={`seed-option ${seed === id ? 'selected' : ''}`} aria-pressed={seed === id} onClick={() => setSeed(id)}><span className={`seed-art seed-${id}`}><PlantArt seed={id} /></span><span><strong>{SEEDS[id].name}</strong><span>{SEEDS[id].label}</span></span><span className="selection-mark">{seed === id && <Icon name="check" size={13} />}</span></button>)}</div><div className="seed-summary"><Icon name="flower" size={17} /><span>{SEEDS[seed].target} growth <span className="muted">to harvest</span></span><strong>+{SEEDS[seed].reward} petals</strong></div></section>
        <section className="basket-panel" aria-labelledby="basket-heading"><div className="section-title"><h2 id="basket-heading">Your harvest basket</h2><Icon name="basket" size={21} /></div><div className="basket-stats"><div><strong>{format(garden.petals)}</strong><span>Petals collected</span></div><div><strong>{format(garden.harvests)}</strong><span>Plants harvested</span></div></div><button className="button secondary harvest-button" disabled={!readyCount} onClick={() => collect()}><Icon name="basket" size={18} />{readyCount ? `Harvest ${readyCount} ${readyCount === 1 ? 'plant' : 'plants'}` : 'Nothing to harvest yet'}</button><p className="fine-print">{practice ? 'Practice points' : 'Game points'} · Saved in this browser</p></section>
        <div className="caretaker-note"><span className="note-flower"><Icon name="flower" size={25} /></span><p>“I run a little.<br />You grow a little.”<span>Your very small gardener</span></p></div>
      </aside>
    </div>
    <section className="below-garden" aria-label="How rounds grow your garden">
      <div className="growth-guide"><div className="section-title"><h2>A round of possibilities</h2><button className="icon-button" aria-label="Read the garden guide" onClick={onHelp}><Icon name="help" size={19} /></button></div><div className="outcome-guide">{(['Nap', 'Jog', 'Zoomies'] as Outcome[]).map(o => <div className={`outcome-item outcome-${o.toLowerCase()}`} key={o}><span className="outcome-art"><Icon name={OUTCOME_ICON[o]} size={24} /></span><div><strong>{o}<span>+{GROWTH[o]} growth{o === 'Zoomies' ? ' + bonus' : ''}</span></strong><span className="muted">{o === 'Nap' ? '0 work · Taking it slow' : o === 'Jog' ? '1–499 work · A happy pace' : '500+ work · Full hamster power'}</span></div></div>)}</div></div>
      <div className="round-history"><div className="section-title"><h2>{practice ? 'Practice round trail' : 'The latest little rounds'}</h2>{!practice && <button className="icon-button" disabled={loading} aria-label="Refresh settled rounds" onClick={() => void refresh()}><Icon name="refresh" size={17} /></button>}</div><div className="round-chips">{history.length ? history.map(r => r.transactionHash ? <a key={r.id} className={`round-chip outcome-${r.outcome.toLowerCase()}`} href={`${EXPLORER_URL}/tx/${r.transactionHash}`} target="_blank" rel="noreferrer" aria-label={`Settled round ${r.id}: ${r.outcome}, ${r.work} work. View transaction.`}><Icon name={OUTCOME_ICON[r.outcome]} size={18} /><strong>#{format(r.id)}</strong><span>{r.outcome}</span></a> : <div key={r.id} className={`round-chip outcome-${r.outcome.toLowerCase()}`}><Icon name={OUTCOME_ICON[r.outcome]} size={18} /><strong>#{r.id}</strong><span>{r.outcome}</span></div>) : <p className="muted history-empty">{practice ? 'Play a practice round to start your trail.' : loading ? 'Looking for confirmed rounds…' : 'Settled rounds will appear here.'}</p>}</div><p className="fine-print">{practice ? 'Simulated results for play. No chain activity.' : <>Confirmed data from <a href={`${API_URL}/v1/core`} target="_blank" rel="noreferrer">Squeekchain</a>. Refreshed every 45 seconds.</>}</p></div>
    </section>
    {selectedPlot !== null && <Modal title={`Plant in plot ${selectedPlot + 1}`} onClose={() => { if (!busy) setSelectedPlot(null); }}>
      <p className="muted">Choose a seed. We’ll save a little spot for it.</p>
      <div className="plant-picker">{(Object.keys(SEEDS) as Seed[]).map(id => <button key={id} className={`plant-pick ${seed === id ? 'selected' : ''}`} aria-pressed={seed === id} onClick={() => setSeed(id)} disabled={busy}><PlantArt seed={id} /><strong>{SEEDS[id].name}</strong><span>+{SEEDS[id].reward} petals</span></button>)}</div>
      <p className="plant-description">{SEEDS[seed].note} Harvest at {SEEDS[seed].target} growth.</p>
      <div className="plant-disclosure"><Icon name={practice ? 'leaf' : 'wallet'} size={20} /><p>{practice ? 'Practice planting is free and uses simulated rounds.' : 'Sign a free message to plant. No gas, no tokens. Your garden is saved only in this browser.'}</p></div>
      <div role="status" className="inline-feedback error-text">{actionError || (proofPending ? 'Verifying your planting signature…' : signing ? 'Confirm the free planting message in your wallet.' : '')}</div>
      <button className="button primary full" disabled={busy || switching || (!practice && isConnected && !wrongChain && (!snapshot || !!fetchError || stale))} onClick={() => void plant()}><Icon name="sprout" size={19} />{signing ? 'Sign in your wallet…' : proofPending ? 'Verifying signature…' : switching ? 'Switching…' : !practice && !isConnected ? 'Connect to plant' : !practice && wrongChain ? 'Switch to Sepolia' : `Plant ${SEEDS[seed].name.toLowerCase()}`}<Icon name="arrow" size={18} /></button>
      {!practice && isConnected && (!snapshot || !!fetchError || stale) && <button className="text-button full retry-inline" disabled={loading} onClick={() => void refresh()}>{loading ? 'Loading confirmed rounds…' : 'Retry loading confirmed rounds'}</button>}
      <p className="fine-print centered">{practice ? 'Practice garden' : 'Ethereum Sepolia'} · Free seed · Local progress</p>
    </Modal>}
    {detailPlot !== null && garden.plots[detailPlot] && (() => {
      const p = garden.plots[detailPlot]!, s = SEEDS[p.seed], ready = p.growth >= s.target;
      return <Modal title={`${s.name} in plot ${detailPlot + 1}`} onClose={() => setDetailPlot(null)}><div className="plant-detail-art"><PlantArt seed={p.seed} stage={Math.min(3, Math.floor(p.growth / s.target * 4))} /></div><p className="detail-headline">{ready ? 'Grown with a little hamster help.' : 'Good things take little rounds.'}</p><div className="progress-heading"><span>Growth</span><strong>{p.growth} / {s.target}</strong></div><progress value={p.growth} max={s.target} aria-label={`${s.name} growth`} /><p className="muted">{ready ? `Ready for your basket. Harvest for ${s.reward} petals.` : `${s.target - p.growth} more growth until harvest. ${practice ? 'Play a practice round to help it grow.' : 'Your next settled round adds growth automatically.'}`}</p><button className={`button ${ready ? 'primary' : 'secondary'} full`} onClick={() => ready ? collect(detailPlot) : setDetailPlot(null)}>{ready ? <><Icon name="basket" size={18} />Harvest {s.name.toLowerCase()} · +{s.reward} petals</> : 'Back to garden'}</button>{p.message && <details className="signature-proof"><summary>View planting signature</summary><p>{p.message}</p><code>{p.signature}</code></details>}</Modal>;
    })()}
  </>;
}
