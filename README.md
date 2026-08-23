# CVRS — Core Verification & Release Standard

**Version:** 1.0.0  
**Release:** 20260823  
**Status:** STANDARD_CANDIDATE / EXECUTABLE

CVRS is an **external, implementation-neutral verification system** for Core runtimes. It verifies correctness, adversarial behavior, safety/compatibility, performance protocol, regression history, stress, memory and repeatability, then produces evidence and a release decision.

## Rule

**Hard Gate FAIL → RELEASE BLOCKED.** Performance scores never override correctness, rollback, safety, lifecycle or state-integrity failures.

## Canonical verification domains

- **A — Correctness / Unit:** Reactive, EventBus, Lifecycle, Module, Service, Router, Navigation, Storage, Diagnostics
- **B — Adversarial / Worst Case:** diamond/dynamic/deep/wide graphs, batch exception, circular dependency, boot retry, partial module/service failure, concurrent destroy, 10K listeners, 5K routes
- **C — Compatibility / Safety:** default DI, direct cleanup, storage preservation, AbortSignal, prototype pollution, deepFreeze, clone, Page→Router→Navigation
- **D — Performance:** warm-up, ≥7 samples, median, P95/P99, cold + warm/cache, same workload/process/environment

## Mandatory regression gates

`REG-001` computed.peek() freshness  
`REG-002` batch exception queue recovery  
`REG-003` failed boot → valid retry  
`REG-004` service definitions survive rollback  
`REG-005` unresolved direct-service final cleanup  
`REG-006` default Core services survive recovery  
`REG-007` second navigation succeeds  
`REG-008` redirect succeeds  
`REG-009` existing storage survives failed boot  
`REG-010` PageRegistry ↔ Router compatibility

## Profiles

- `smoke` — A
- `standard` — A+B+C+D+REG
- `release` — Standard + Stress + Memory + Repeatability
- `final` — Release + Browser/IndexedDB/OPFS/Process/HTTP/DB + 24h soak evidence

A partial profile can never be reported as Full CVRS PASS.

## Run

```bash
node --expose-gc run.mjs --core /absolute/path/to/core.mjs --profile release
```

Optional baseline comparison:

```bash
node --expose-gc run.mjs --core ./core.mjs --profile release --baseline ./baseline-results.json
```

Final providers are explicit:

```bash
node --expose-gc run.mjs --core ./core.mjs --profile final \
  --final-provider browser-native,indexeddb-real,opfs-integration,process-integration,http-integration,database-integration,24h-soak
```

## Evidence

Every run records environment/Core SHA-256/config hashes, per-test duration/status/classification, isolation metadata, profile completeness and release decision under `evidence/<timestamp>/`.

## Isolation

Risky adversarial/stress tests run in child processes with hard timeouts. A synchronous infinite loop can be force-terminated without losing the rest of the verification run.

## Exit codes

- `0` PASS
- `1` RELEASE_BLOCKED
- `2` TEST_INFRA_FAILURE
- `3` ENVIRONMENT_BLOCKED / INCOMPLETE_PROFILE
- `4` INVALID_TARGET
- `5` CONFIG_ERROR
- `6` INTERNAL_CVRS_ERROR

## Development

```bash
npm test
```

Self-test includes a real isolated synchronous hang and verifies forced termination.

## Architecture

CVRS is external to the target Core:

`Standard → Adapter → Suites → Isolated Runner → Metrics/Evidence → Gate Engine → Release Decision`

Adapters translate target APIs; they must never weaken or modify target semantics to obtain PASS.


## Authority

CVRS normative authority is:

1. `docs/CVRS-STANDARD-v1.0.0.md`
2. `docs/CVRS-ADAPTER-CONTRACT-v1.0.0.md`
3. `config/gates.json`
4. `config/profiles.json`
5. executable suites / runner

`docs/CVRS-AI-MASTER-PROMPT.md` is supporting AI execution context and must not override the Standard.


## False-positive safeguard

CVRS does **not** automatically classify a failed gate as `CORE_BUG`.
A new failure is emitted as `UNCLASSIFIED_REQUIRES_DIAGNOSIS` until the target
contract, adapter, test expectation, and implementation are compared.

The CVRS self-test includes positive and negative controls for `REG-004` and
`REG-006`: conforming rollback behavior must pass, while deliberate service
definition/default-service loss must fail.


## CVRS 2.0 — Discovery / Reverse Engineering Layer

CVRS 2.0 keeps the verified 1.x engine and adds a safe, non-executing discovery front-end:

`ZIP/Repo → Discovery → Canonical Model → Contract Pack → Adapter → CVRS Verification`

Commands:

- `npm run discover -- <target-directory>`
- `npm run plan -- <target-directory>`
- `npm run verify`

Discovery output is **candidate information**, never automatic proof of a capability.
Domain gates become authoritative only after contract mapping/adapter validation.
