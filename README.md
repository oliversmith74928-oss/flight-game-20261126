# flight-game-20261126

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/oliversmith74928-oss/flight-game-20261126/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/oliversmith74928-oss/flight-game-20261126/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

**Skylark Courier** — an original offline flight game: fly the mail run in a chase view over patchwork terrain toward Runway 27, through 10 golden target rings, dodging storm cells, hot-air balloons and birds. A full HUD shows altitude, speed and heading, with a lit artificial horizon, altimeter, speed dial and throttle gauge. Rings refill fuel; collisions cost hull.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Or serve `game/` with any static server and open `game/index.html` in a desktop browser. No network requests, no build step, no dependencies. Node.js 22+ for `main.ts` / `serve.ts`.

## How to play

- **← → / A D** — steer (bank and turn) · **↑ ↓ / W S** — climb / descend
- **Mouse** — steers too · **Shift** — boost · **P** — pause · **M** — sound on/off · **R** — restart · **Enter / Space / click** — take off
- Fly through the golden rings: +100 points each, +14 fuel. Near misses +25.
- Storm cells, balloons and birds cost 25 hull on a hit. Hull 0, or fuel 0, ends the flight.
- Fly all 10 rings to complete the delivery and land the mail on Runway 27.

## Handing it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` into the output directory and writes `dossier.json` with the vendored make.fun library (`vendor/makefun-game.ts`, the kit's own copy, unchanged).

## Layout

| Path | What it is |
| --- | --- |
| `main.ts` | The hand-in program (Node 22, standard library only). |
| `game/index.html` | The page the game opens from. |
| `game/src/main.js` | Boot and the fixed-step loop, screens and scoring. |
| `game/src/world.js` | The flight rules: plane, rings, hazards, fuel, hull, delivery. |
| `game/src/render.js` | All art: sky, terrain, runway, rings, hazards, plane, HUD and instruments. |
| `game/src/config.js` | The palette and every tuning number. |
| `game/src/input.js` | Keyboard and mouse steering. |
| `game/src/sound.js` | Synthesised WebAudio engine, ring and crash sounds. |
| `game/src/shots.js` | Deterministic screenshot staging through the real simulation (`?shot=start|play|rings|end&seed=N`). |
| `vendor/makefun-game.ts` | The bounty's kit, unchanged. |
| `screenshots/` | 3–4 real renders of the game's own code (first by name is the cover). |
| `shots.json` | The shot list used to take them. |

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
