import type { CSSProperties } from 'react';
import { SEEDS, type Plant, type Seed, type Outcome } from './game';

export function Icon({ name, size = 20, className = '' }: { name: 'sprout' | 'arrow' | 'flower' | 'basket' | 'help' | 'external' | 'leaf' | 'close' | 'check' | 'refresh' | 'wallet' | 'sun' | 'moon' | 'bolt' | 'chevron'; size?: number; className?: string }) {
  const paths = {
    sprout: <><path d="M12 21v-9M12 15C3 16 3 9 3 9s9-1 9 6ZM12 11C12 3 21 3 21 3s1 9-9 9" /></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
    flower: <><path d="M9 7C4 0 0 10 7 11c-8 2-1 10 3 5-2 8 8 7 6 0 6 5 11-3 3-5 7-4-1-10-4-4 0-8-8-7-6 0Z" /><circle cx="12" cy="11" r="3" /></>,
    basket: <><path d="M3 10h18l-3 11H6L3 10Zm3 0 5-8m7 8-5-8M9 14v3m6-3v3" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1.5-1.5 2M12 17h.01" /></>,
    external: <><path d="M14 3h7v7m0-7L10 14M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6" /></>,
    leaf: <><path d="M20 3S2 0 3 13c1 10 14 9 17-10ZM3 21 15 9" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    refresh: <><path d="M21 9a9 9 0 0 0-15-4L3 8m0-5v5h5M3 15a9 9 0 0 0 15 4l3-3m0 5v-5h-5" /></>,
    wallet: <><path d="M20 8V5H5a2 2 0 0 1 0-4h13v4M3 3v17h18V8H5a2 2 0 0 1-2-2m18 7h-5v4h5" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l1.5 1.5M18.5 18.5 20 20M4 20l1.5-1.5M18.5 5.5 20 4" /></>,
    moon: <path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z" />,
    bolt: <path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z" />,
    chevron: <path d="m8 4 8 8-8 8" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name]}</svg>;
}

export function Hamster({ className = '', sleepy = false }: { className?: string; sleepy?: boolean }) {
  return <svg className={className} viewBox="0 0 140 150" fill="none" aria-hidden="true">
    <ellipse cx="71" cy="139" rx="48" ry="7" fill="#708a4c" opacity=".18" />
    <ellipse cx="38" cy="126" rx="16" ry="10" fill="#c18a50" /><ellipse cx="101" cy="126" rx="16" ry="10" fill="#c18a50" />
    <path d="M24 104c0-33 19-54 47-54s48 22 48 54c0 24-21 35-48 35s-47-11-47-35Z" fill="#dda15e" />
    <circle cx="32" cy="32" r="21" fill="#c18a50" /><circle cx="110" cy="32" r="21" fill="#c18a50" />
    <circle cx="32" cy="32" r="13" fill="#f0bc9d" /><circle cx="110" cy="32" r="13" fill="#f0bc9d" />
    <path d="M13 67C13 33 36 19 71 19s58 16 58 49c0 31-26 47-58 47S13 96 13 67Z" fill="#e8b57a" />
    <path d="M37 49c7-8 17-4 22 2 7 7 17 7 24 0 7-7 17-9 23-1 25 27 5 57-35 57-39 0-61-29-34-58Z" fill="#fff1d6" />
    <ellipse cx="71" cy="114" rx="28" ry="21" fill="#fff1d6" />
    {sleepy ? <g stroke="#674a32" strokeWidth="3.5" strokeLinecap="round"><path d="m39 68 8 3 7-4M88 67l7 4 8-3" /></g> : <g fill="#493c2e"><ellipse cx="47" cy="67" rx="4.5" ry="6" /><ellipse cx="96" cy="67" rx="4.5" ry="6" /><circle cx="48" cy="65" r="1.5" fill="white" /><circle cx="97" cy="65" r="1.5" fill="white" /></g>}
    <ellipse cx="32" cy="80" rx="9" ry="5" fill="#edb194" /><ellipse cx="110" cy="80" rx="9" ry="5" fill="#edb194" />
    <path d="M65 77q6-5 12 0l-6 5Z" fill="#b77765" /><path d="M71 83v4m-7-1q7 8 14 0" stroke="#674a32" strokeWidth="2" strokeLinecap="round" />
    <path d="m19 80-13-3m14 9L6 88m116-8 13-3m-14 9 14 2" stroke="#a87b53" strokeWidth="2" strokeLinecap="round" />
    <path d="m30 99 16 11m66-11-17 11" stroke="#c18a50" strokeWidth="12" strokeLinecap="round" />
    <g transform="translate(53 98) rotate(-12 16 16)"><path d="m5 9 27-1-16 35Z" fill="#ed9953" /><path d="M18 10q-11-16-2-19 7 1 5 16 9-14 14-8 1 7-17 11" fill="#6b9650" /><path d="m8 17 6 2m5 5 6-1" stroke="#cf783e" strokeWidth="2" /></g>
    <path d="M21 28q48-17 100 0l-1 13q-49-14-98 0Z" fill="#6f8c52" /><path d="M24 26Q26 0 71 0t48 26" fill="#90a76c" /><path d="M17 30q54-14 110 1" stroke="#647f4b" strokeWidth="7" strokeLinecap="round" />
    <path d="m82 14 5-7m0 7 6-3" stroke="#dce8bb" strokeWidth="3" strokeLinecap="round" />
  </svg>;
}

export function PlantArt({ seed, stage = 3, className = '' }: { seed: Seed; stage?: number; className?: string }) {
  return <svg className={className} viewBox="0 0 100 110" fill="none" aria-hidden="true">
    {stage === 0 ? <><path d="M49 98V80" stroke="#648d42" strokeWidth="4" strokeLinecap="round" /><path d="M49 88C26 88 29 70 29 70s23-2 20 18Z" fill="#8caf62" /><path d="M50 84c-1-20 21-19 21-19s2 21-21 19Z" fill="#719b4d" /></> : <>
      <path d={stage === 1 ? 'M49 98V55' : 'M49 98V35'} stroke="#648d42" strokeWidth="4" strokeLinecap="round" />
      <path d="M49 86C23 88 21 67 21 67s25-4 28 19Z" fill="#82a957" /><path d="M50 77c0-24 26-22 26-22S77 77 50 77Z" fill="#688f43" />
      {stage >= 2 && <path d="M48 65C28 65 30 48 30 48s20-2 18 17Z" fill="#a2bc6c" />}
      {seed === 'daisy' && (stage >= 2 ? <g transform={stage === 2 ? 'translate(13 12) scale(.75)' : undefined}>
        {[0,45,90,135,180,225,270,315].map(a => <ellipse key={a} cx="49" cy="17" rx="9" ry="17" fill="#fffcdf" stroke="#e9dca9" strokeWidth="1" transform={`rotate(${a} 49 38)`} />)}
        <circle cx="49" cy="38" r="14" fill="#efbe52" /><circle cx="45" cy="37" r="1.5" fill="#8b6938" /><circle cx="54" cy="37" r="1.5" fill="#8b6938" /><path d="M45 43q4 3 8 0" stroke="#8b6938" strokeWidth="1.5" strokeLinecap="round" />
      </g> : <ellipse cx="49" cy="55" rx="9" ry="13" fill="#b7c87f" />)}
      {seed === 'carrot' && <><path d="M50 60C27 42 21 24 31 22c10-1 18 29 19 36-4-35 0-48 7-45 10 5 0 38-7 47 13-27 26-33 30-27 3 9-15 24-30 27" fill="#7a9f49" /><path d="M32 72q18-12 35 0L50 105Z" fill={stage >= 3 ? '#ef9a50' : '#d7a667'} /><path d="m38 80 9 1m6 9 7-2" stroke="#cf783e" strokeWidth="2" strokeLinecap="round" /></>}
      {seed === 'strawberry' && stage >= 2 && <><path d="M50 47q30-9 28 16" stroke="#648d42" strokeWidth="3" /><path d="M61 60q16-9 30 1c4 14-8 28-15 30-8-3-20-17-15-31Z" fill={stage === 3 ? '#dc7e72' : '#e7bbb1'} /><path d="m61 59 8-4 7 4 7-5 8 6-14 6Z" fill="#5f8c4e" /><g fill="#fff1c5"><ellipse cx="70" cy="70" rx="1" ry="2" /><ellipse cx="82" cy="70" rx="1" ry="2" /><ellipse cx="76" cy="79" rx="1" ry="2" /></g></>}
    </>}
  </svg>;
}

const PLOT_POSITIONS = [[35, 44], [53, 44], [71, 44], [35, 65], [53, 65], [71, 65]];
export function GardenScene({ plots, outcome, onPlot }: { plots: (Plant | null)[]; outcome?: Outcome; onPlot: (i: number) => void }) {
  return <div className={`garden-scene ${outcome === 'Zoomies' ? 'is-zoomies' : ''}`}>
    <svg className="landscape" viewBox="0 0 840 500" fill="none" aria-hidden="true">
      <defs><pattern id="soil" width="18" height="18" patternUnits="userSpaceOnUse"><path d="m4 3 4 2m4 9 3-1" stroke="#9a7550" strokeWidth="2" strokeLinecap="round" /></pattern></defs>
      <g fill="#fffdf5"><path d="M38 75c0-10 13-14 21-8 2-22 37-27 46-6 22-6 29 20 8 24H47q-15-2-9-10ZM587 54c-6-16 13-25 23-17 3-26 39-25 45-4 25-2 27 29 6 31h-60q-15 0-14-10Z" /></g>
      <circle cx="730" cy="78" r="33" fill="#f5d986" /><g stroke="#e9c972" strokeWidth="3" strokeLinecap="round"><path d="M730 30v-8m0 111v-8m48-48h8m-111 0h8m13-34-6-6m80 80-6-6m0-68 6-6m-80 80 6-6" /></g>
      <g fill="#e6eccf"><ellipse cx="301" cy="137" rx="220" ry="37" /><ellipse cx="651" cy="145" rx="160" ry="33" /></g>
      <path d="M48 225 405 125 800 246 761 397 401 474 66 363Z" fill="#b8cc8b" />
      <path d="m66 343 335 106 360-71v23l-360 77L66 370Z" fill="#9baf71" />
      <path d="M48 212 405 114 800 232 759 381 401 453 66 346Z" fill="#d4dfa7" />
      <path d="m91 222 315-88 354 105-25 114-334 73L92 330Z" fill="#dce5b6" />
      <path d="M175 201q20 60 59 96t67 69q25 19 80 40l-35 12q-84-32-109-63t-62-56q-32-38-37-87Z" fill="#e9dfb8" />
      <g stroke="#b7a77b" strokeWidth="6" strokeLinecap="round"><path d="m286 148 318 98m-302-115v36m37-24v36m37-24v36m37-24v36m37-24v36m37-24v36m37-24v36m37-24v36m37-24v36m-266-75 318 98" /></g>
      <g transform="translate(100 84)"><path d="m0 94 52-26 89 26v82l-51 22-90-29Z" fill="#ead7a2" /><path d="m89 121 52-27v82l-51 22Z" fill="#d6bf8b" /><path d="M-13 98 49 31 155 91l-62 38Z" fill="#c48c65" /><path d="m49 31 7 55 37 43-106-31Z" fill="#d6a17a" /><path d="m49 42 95 52m-94-41 81 49m-80-38 66 47m-65-36 50 44" stroke="#b77d59" strokeWidth="3" /><path d="M24 176v-40q0-22 19-17t19 29v39" fill="#9b7953" /><path d="M31 178v-41q0-14 12-10t12 19v39" fill="#b6ab78" /><circle cx="48" cy="157" r="3" fill="#f2dca9" /><path d="m99 138 22-10v25l-22 10Z" fill="#94b5ad" stroke="#fff0c7" strokeWidth="4" /><path d="m110 133 1 25" stroke="#fff0c7" strokeWidth="3" /></g>
      <g transform="translate(675 146)"><path d="m0 47 7 79" stroke="#9a8354" strokeWidth="11" strokeLinecap="round" /><ellipse cx="0" cy="39" rx="38" ry="42" fill="#8ca76c" /><ellipse cx="-18" cy="54" rx="27" ry="30" fill="#a3b67d" /><ellipse cx="20" cy="51" rx="28" ry="34" fill="#94ad70" /><circle cx="14" cy="23" r="5" fill="#d4d99e" /><circle cx="-20" cy="53" r="4" fill="#d4d99e" /></g>
      <g transform="translate(74 251)"><path d="m0 70 4-35" stroke="#9a8354" strokeWidth="7" /><ellipse cx="3" cy="24" rx="26" ry="29" fill="#91aa72" /><ellipse cx="-11" cy="35" rx="22" ry="20" fill="#a5ba7f" /></g>
      <g fill="#b5c68a"><ellipse cx="695" cy="349" rx="49" ry="19" /><ellipse cx="262" cy="397" rx="44" ry="13" /></g>
      <g fill="#a0b477"><path d="m713 338 2-13 4 12 7-7-3 13m-419 69 3-13 4 12 8-7-3 13m297-254 3-14 5 14 8-6-4 13M105 331l3-14 5 14 8-6-4 13" /></g>
      {[[330,144],[365,160],[653,333],[691,375],[231,374],[446,425],[747,290]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><path d="M0 8V0" stroke="#8caa63" strokeWidth="2" />{[0,72,144,216,288].map(a=><ellipse key={a} cx="0" cy="-5" rx="3" ry="5" fill={i%2 ? '#f6e9be' : '#e4b4aa'} transform={`rotate(${a} 0 0)`} />)}<circle r="2" fill="#cfaa62" /></g>)}
      <g fill="#c5c5ac"><ellipse cx="207" cy="308" rx="12" ry="6" transform="rotate(30 207 308)" /><ellipse cx="228" cy="332" rx="15" ry="7" transform="rotate(35 228 332)" /><ellipse cx="252" cy="355" rx="13" ry="7" transform="rotate(25 252 355)" /></g>
      <g transform="translate(631 366) rotate(8)"><path d="M0 0h28v25q-14 9-28 0Z" fill="#9bb3a7" /><path d="m0 9-14-12-7 5 17 20m34-18q20-7 14 13l-11 5" stroke="#7d9c90" strokeWidth="5" /><path d="M1-1q14-8 27 0" stroke="#7d9c90" strokeWidth="4" /></g>
      <g transform="translate(552 127) rotate(15)"><ellipse cx="-7" cy="-3" rx="9" ry="5" fill="#f1d899" /><ellipse cx="8" cy="-4" rx="9" ry="5" fill="#e7c87b" /><path d="m0-8 0 17" stroke="#a18b54" strokeWidth="2" /></g>
      <g transform="translate(735 311)"><circle r="5" fill="#c98069" /><path d="M0-5v10" stroke="#695f46" strokeWidth="1.5" /><circle cx="-2" cy="-1" r="1" fill="#695f46" /><circle cx="2" cy="2" r="1" fill="#695f46" /></g>
    </svg>
    <div className="caretaker"><Hamster sleepy={outcome === 'Nap'} /></div>
    {plots.map((plant, i) => {
      const ready = plant && plant.growth >= SEEDS[plant.seed].target;
      const stage = plant ? Math.min(3, Math.floor(plant.growth / SEEDS[plant.seed].target * 4)) : 0;
      return <button type="button" key={i} className={`plot ${plant ? 'planted' : 'empty'} ${ready ? 'ready' : ''}`} style={{ '--plot-x': `${PLOT_POSITIONS[i][0]}%`, '--plot-y': `${PLOT_POSITIONS[i][1]}%` } as CSSProperties} onClick={() => onPlot(i)} aria-label={plant ? `Plot ${i + 1}: ${SEEDS[plant.seed].name}, ${ready ? 'ready to harvest' : `${plant.growth} of ${SEEDS[plant.seed].target} growth`}` : `Plant in empty plot ${i + 1}`}>
        <svg className="plot-soil" viewBox="0 0 130 70" fill="none" aria-hidden="true"><path d="m5 20 62-17 59 19-5 30-58 16L9 49Z" fill="#af8c64" /><path d="m5 17 62-17 59 19-5 28-58 16L9 46Z" fill="#c5a178" /><path d="m13 21 54-15 51 16-5 19-50 14-46-16Z" fill="#aa825a" /><path d="m13 21 54-15 51 16-5 19-50 14-46-16Z" fill="url(#soil)" /></svg>
        {plant ? <PlantArt seed={plant.seed} stage={stage} className="plot-plant" /> : <span className="plot-add" aria-hidden="true">+</span>}
        {ready && <span className="ready-mark"><Icon name="check" size={14} /></span>}
      </button>;
    })}
    <span className="scene-note"><Icon name="leaf" size={16} /> A little patience. A little sunshine.</span>
  </div>;
}
