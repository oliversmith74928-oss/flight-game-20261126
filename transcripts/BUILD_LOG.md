# Build log — Skylark Courier (make.fun best-flight-game-20261126-0057)

This file is the build record for this entry. It was written by the agent
that built the game, in the same session, as the work happened. It is a
summary log for reviewers; the full session record is bundled separately
with the kit's `bundle` command at submission time.

- 2026-11-26 08:01 UTC — Read the bounty page and `skill.md`, fetched the
  competition requirements (`GET /api/competitions/best-flight-game-20261126-0057/requirements`)
  and the kit (`GET /c/best-flight-game-20261126-0057/kit`). Requirements:
  public repo created after 2026-11-26T00:57:00Z, OSI (MIT) licence, `main.ts`
  at root, `vendor/makefun-game.ts` unchanged, `game/` static files playable
  offline in a desktop browser, 3–4 screenshots under `screenshots/`, agent
  transcripts, README badges and GitHub About (`makefun` topic + make.fun
  website). Judged on screenshots: chase/cockpit view over recognisable
  terrain, aircraft in frame with lit instruments, runway or target ring
  ahead, altitude/speed/heading on the HUD.
- 2026-11-26 08:02 UTC — Verified the GitHub PAT connection (`get-user`:
  oliversmith74928-oss, id 361358148) and created the public repository
  `oliversmith74928-oss/flight-game-20261126` (id 1472850829) via the PAT
  helper, created 2026-11-26T08:02:47Z — after the bounty opened.
- 2026-11-26 08:03 UTC — Inspected the kit starter. The starter ships a
  generic "Block Dodger" paddle game, not a flight game, so the flight game
  was written from scratch on the starter's structure (fixed-step loop,
  seeded RNG, `?shot=` screenshot staging, `main.ts` + `buildDossier`).
  Only `vendor/makefun-game.ts`, `LICENSE` (MIT, SPDX line kept) and
  `serve.ts` were copied from the kit unchanged.
- 2026-11-26 08:03–08:06 UTC — Wrote the game, file by file:
  `game/src/config.js` (tuning + palette), `input.js` (keyboard + mouse),
  `sound.js` (synthesised WebAudio, no audio files), `world.js` (plane,
  rings, storm/balloon/bird hazards, fuel, hull, 10-ring delivery),
  `render.js` (sky, sun, clouds, mountain ridges, scrolling patchwork
  fields, river, perspective Runway 27, golden rings, hazards, banking
  Courier plane, HUD with ALT/SPD/HDG + compass tape + fuel/hull bars,
  artificial horizon, altimeter, speed dial, throttle gauge, title /
  pause / delivery-complete / game-over panels), `shots.js` (autopilot
  staging: start, play, rings, end), `main.js` (boot, loop, screens,
  best score in localStorage), `game/index.html`.
- 2026-11-26 08:06 UTC — Wrote `main.ts` (copies game/ + screenshots/ to
  /output, writes dossier.json via the vendored library), `shots.json`
  (4 shots, seed 7), `README.md` (required make.fun badges), `.makefun/owner.json`
  (payout wallet public address only — no private key anywhere in the repo).
- 2026-11-26 08:06 UTC — Play-tested in headless Chromium (Playwright):
  served `game/` with `node serve.ts`, opened each `?shot=` scene at
  1280x720, waited for `window.__shotReady`, saved the 4 screenshots to
  `screenshots/` (JPEG, each under 256 KiB). Ran `node main.ts` with
  `MAKEFUN_OUTPUT_DIR=out` and confirmed `out/dossier.json` builds.
- 2026-11-26 08:07 UTC — Pushed the single commit to `main` via the GitHub
  API (git-data API, authenticated with the same PAT credential flow as
  the repo creation) and verified the repo is public and the files are
  present at the pushed commit.

No secrets, private keys, PATs or API keys are in this repository. The
Solana payout wallet's public address is in `.makefun/owner.json`; its
private key was never written here.
