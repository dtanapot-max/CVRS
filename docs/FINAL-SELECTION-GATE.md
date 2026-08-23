# CVRS Final Selection Gate

Use after both candidates pass the same CVRS RELEASE profile.

## Decision weights
- Correctness + Regression: 35%
- Adversarial + Recovery: 20%
- Memory / Resource Safety: 15%
- Performance: 20%
- Stability / Repeatability: 10%

Any Critical Gate failure eliminates a candidate regardless of benchmark score.

Candidates must use the same workload, benchmark code, runtime and environment.
The comparison runner uses 3 independent processes; each performs warm-up and multiple samples
and reports Median/P95/P99/Max/throughput plus post-GC heap delta.

Differences below 5% are treated as practically tied unless repeatable evidence proves otherwise.
Never sacrifice Reactive, Contracts, Rollback, Safety checks, or Lifecycle guarantees for speed.

Command: `npm run compare -- <core-A.mjs> <core-B.mjs>`
