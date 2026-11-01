# Squeek Garden

A cozy single-page garden that grows with confirmed Squeekchain rounds on Ethereum Sepolia. Plant daisies, carrots and strawberries, collect petals, and tend six little plots with a hamster caretaker.

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

For the production export:

```sh
npm run build
npm run preview
```

Open the URL printed by Vite. `npm run build` typechecks the source and recreates `dist/`. The complete export is included in this submission. Vite uses `base: './'`; scripts, styles, fonts, icons and images have relative URLs and work under a static gateway subpath. There is one page with hash anchors and no server routing requirement.

The IdentityMD publisher uses `dist/` to create the public `*.imd.site` website after submission. A public deployment URL is not available during the local build. No manual publishing command or hosting credentials are required.

## Play

1. Connect a Sepolia wallet using **Connect**. Browser extensions are discovered by EIP-6963; Coinbase Wallet is also available. A phone without an injected wallet gets links to open this page in MetaMask, Coinbase Wallet, Rabby or Phantom, plus Coinbase Smart Wallet.
2. Select **Plant a seed**, choose a seed and sign the free planting message. No transaction, gas or token approval is requested. All three seeds are free.
3. Confirmed rounds add growth: **Nap: +1**, **Jog: +3**, **Zoomies: +6**. A Zoomies round awards one bonus petal when at least one plant is still growing.
4. Select a plant to inspect its progress. Harvest a ready plant directly or use the basket to harvest all ready plants. Daisies need 12 growth and yield 3 petals; carrots need 16 and yield 4; strawberries need 20 and yield 6.

**Practice** is a separate garden with explicitly simulated rounds and no wallet requirement. Plant, then select **Play a practice round**. The repeating Jog → Nap → Zoomies sequence makes the full game immediately playable, including when the external API is unavailable. Practice never advances a live garden.

Petals are local game points with no monetary value. Gardens and planting signatures are stored in this browser, separately for each wallet and for practice. They do not sync between browsers or devices. Clearing site storage removes them. A storage failure is reported, and the current visit can continue in memory.

## Settled data and trust

`src/config.ts` centralizes chain, source URLs and the deployment identity. The official API served SqueekCore `0x980b4424c007caf7a1f3670b48c8eaef7ebc3d44` and stream `0x52e443e4e0d236ff0c07f4cdc518c594a3d680d20abb1481510efbed0ec73633` during validation on 2026-11-01. The older deployment in the documentation differs; this build deliberately pins the identity returned by the current official Sepolia API, without guessing a replacement.

The garden polls `/v1/core` and `/v1/events?category=protocol&limit=100` at [api.squeekchain.com](https://api.squeekchain.com/v1/core) every 45 seconds while visible and refreshes when the page becomes visible again. It checks supported schema versions, chain ID 11155111, contract identity, stream identity and at least 12 confirmations. Only `system.settlement_completed` events with a `safe` chain source advance plants. See the [official API reference](https://docs.squeekchain.com/developers/api/).

Work is classified per round with integer arithmetic: 0 is Nap, 1–499 is Jog and 500+ is Zoomies. A batch's total is never classified as an individual round. For mixed batches, individual `RoundRecorded` proofs come from the core response or from the matching confirmed transaction receipt, decoded using the [published SqueekCore event ABI](https://docs.squeekchain.com/assets/abi/SqueekCore.json). Omitted rounds become Nap only within a certified settlement span.

Every plant records its own starting frontier and last applied round. Repeated polls are idempotent, and missing history pauses growth instead of inventing zero work. Catch-up is bounded to 24 event-feed pages per refresh; incomplete history is reported with a retry control. Requests time out after 15 seconds. Unavailable data is never shown as zero. The current round is an informational estimate from the API's genesis and round duration plus the browser clock; it never causes growth.

The receipt fallback and smart-wallet signature verification use public Sepolia RPCs `https://ethereum-sepolia-rpc.publicnode.com` and `https://sepolia.drpc.org`. EOA planting signatures are verified locally with viem; contract-wallet signatures use viem's public-client verification. The planting message includes the origin/path, wallet, chain, core, plot, seed, starting settled round, time and unique nonce. There are no garden contracts, token transfers or approvals.

The livestream link opens the [official Sepolia site](https://sepolia.squeekchain.com/), which owns playback availability. The garden does not claim the stream is currently on air.

## Validation

Completed on 2026-11-01 against the production export:

| Check | Actual result |
| --- | --- |
| `npm run build` | Passed; complete static export, 13 files |
| `npm run typecheck` | Passed |
| `npm run test` | 12 tests passed |
| `npm run test:browser` | 17 interaction groups passed in Chromium |
| Pinned `taste.mjs --out test/scratch/taste` | 16/16 checks passed |
| Axe automated WCAG audit | 22 passing rules, 0 violations in the exercised practice state |
| Real, unmocked `fetchSnapshot()` | Eight contiguous settled rounds returned from the official API |

Browser validation serves `dist/` at `/preview/` and checks 320, 390, 590, 810, 1130 and 1440 widths, 200% text enlargement, planting, growth, harvest, saved progress, mode/account isolation, errors and retry, modal keyboard behavior, mobile wallet links, EIP-6963 discovery, signature rejection and success, wrong-network recovery, reconnect and disconnect. It reports no missing local files, page errors or console errors. Wallet interaction tests use an ephemeral local test provider and synthetic API fixtures, never production game data or a shipped private key.

To reproduce browser checks, install the test browser once:

```sh
npx playwright install chromium
npm run build
npm run test:browser
```

The pinned design probe is an assignment input, so it is not included in the final source. Its command was `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste`, with Playwright/browser locations supplied for this check environment. Its measured results are preserved in [artifacts/design-probe.json](artifacts/design-probe.json).

The build emits a Vite warning about `node:worker_threads` in a transitive ox/Tempo module. The browser export and exercised wallet/game paths run without errors; this game does not use Tempo. The supplied browser connector could not launch its missing Chrome binary, so screenshots and interactions were checked using a separately installed Playwright Chromium. WebKit could not launch because its system libraries are missing. Real wallet apps, Coinbase passkey creation, physical phones, native 200% browser zoom and screen readers were not tested. The public API smoke run contained Nap rounds; Jog/Zoomies and batch handling were validated with isolated fixtures. There was no live onchain write to validate because planting is local plus signature.

See [artifacts/validation.md](artifacts/validation.md) for the six-domain design review, fixed findings and limits; [DESIGN.md](DESIGN.md) for the implemented design system; and [artifacts/BUDGET.md](artifacts/BUDGET.md) for path and byte budgets.

## Source map

- `src/App.tsx`: page, planting consent, garden actions, progress and guide.
- `src/game.ts`: deterministic growth, planting, harvest and save validation.
- `src/rounds.ts`: confirmed history, schema checks, batching and catch-up.
- `src/config.ts`: wagmi, viem, chain, public sources and ABI.
- `src/Wallet.tsx`, `src/open-in.ts`: wallet sheet and mobile links.
- `src/Modal.tsx`, `src/useGarden.ts`: accessible dialogs and local persistence.
- `src/Art.tsx`, `src/styles.css`: original SVG illustrations and responsive tokens/styles.
- `tests/`: unit and production browser interaction checks.
- `public/`: complete runtime assets and third-party notices.

## Attribution

Original garden illustrations are in `src/Art.tsx`; the sharing image's editable source is [artifacts/share-source.svg](artifacts/share-source.svg). Nunito is bundled under the SIL Open Font License. Wallet marks are reproduced unchanged from RainbowKit 2.2.11 under MIT. Bundled runtime notices are in [public/THIRD_PARTY.txt](public/THIRD_PARTY.txt), also copied to `dist/`.

Design guidance was adapted from Jakub Krehel's Better Interface (MIT), with documentation guidance from Paul Bakaus's Impeccable (Apache-2.0). Source records and retained license notices are in [DESIGN.md](DESIGN.md) and `artifacts/licenses/`.
