# Token Radar: pre-token protocols ranked by implied value

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/Mondirr/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/Mondirr/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Entry for [token-radar-01](https://make.fun/c/token-radar-01?ref=z206rnhh): a program that reads the sealed DefiLlama snapshot, ranks every protocol that records no token by a peer-calibrated implied value, and hands in a static dashboard with a farm plan for each protocol.

`main.ts` (Node 22, standard library only) scores the board with the model in `lib/model.ts`: each protocol's implied value is its TVL times the median market-cap-to-TVL ratio of the trading protocols in its own category, adjusted for 7-day growth, age on record, and chain breadth. The dashboard (`dashboard/`, no network) shows the board, a detail view with the value breakdown and farm plan for every protocol, category and chain filters, and the trading protocols kept apart as comparables.

Run it with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json`.
