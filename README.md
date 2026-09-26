# Life Sim — living village prototype

A player-independent, deterministic **fictional** village simulation. The first scenario is Üyük around 1600; generated names, population and jobs are gameplay placeholders, **not verified historical records**.

## Run

Requires Node.js 20+.

```bash
npm test
npm run sim -- uyuk-1600 14
```

The initial prototype creates interconnected households, parents, children and partners; assigns traits, hobbies, jobs, needs and resources; and advances daily decisions with explicit reasons. The same seed produces the same village and sequence of days.

## Current limitations

One major activity per person per day; no travel, marriage, death, births, long-term goals, weather, trade network or NPC-to-NPC relationship graph yet. Memories are bounded event records, not a complete psychological model. This is a simulation foundation, not a finished living town.

Next: multiple daily time slots, social graph, persistent goals and event-driven plan changes; then multi-year demographic and economic simulation.
