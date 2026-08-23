# CVRS — Core Verification & Release Standard

## Version 1.0.0 — Central Standard

> **Status:** STANDARD_CANDIDATE  
> **Scope:** Core Runtime Verification, Release Gating, Performance, Recovery, Stress, Native/Integration Evidence  
> **Principle:** Evidence over claims; Hard Gates before Score

CVRS is the central, implementation-neutral standard for proving whether a Core runtime is correct, safe, recoverable, stable, performant, and ready for release.

CVRS is **not** a benchmark-only suite and **not** a documentation checklist. PASS requires executable evidence.

Core-specific history, defects, benchmarks, and compatibility notes must live outside this normative standard.

# 1. STANDARD SCOPE AND ARCHITECTURE MODEL

CVRS applies to any Core runtime that can be identified and mapped through a target adapter.

The architecture below is a reference capability model, not a requirement that every Core expose identical names or internal structure. Unsupported capabilities must be declared explicitly by the adapter.

Architecture intent:

```text
Core Runtime
  ├─ Reactive / State
  ├─ Event / Lifecycle
  ├─ Module / Service orchestration
  ├─ Router / Navigation
  ├─ Storage abstraction
  ├─ Diagnostics / Contracts
  └─ Optional advanced capabilities
        │
        ▼
     Contract
        │
        ▼
      Adapter
        │
        ▼
      Service
        │
        ▼
Infrastructure / Browser / Process / HTTP / DB / Native
```

When comparing runtimes, CVRS must compare equivalent semantics and equivalent workloads. A faster implementation that removes required guarantees is not a valid win.

------------------------------------------------------------------------

# 2. NON-NEGOTIABLE OPTIMIZATION RULE

Never optimize by removing or weakening:

``` text
Reactive
Contracts
Rollback
Safety checks
Lifecycle guarantees
```

Performance work may optimize:

-   allocations
-   lookup paths
-   temporary objects
-   queues
-   caching
-   route precompilation
-   storage hot paths
-   diagnostics overhead
-   duplicate work

But correctness and guarantees must remain intact.

A faster Core with reduced semantics is **not** a valid performance win.

------------------------------------------------------------------------

# 3. CVRS PHILOSOPHY

CVRS is an **external verification system**, not part of the Core
kernel.

It must be reusable across Core versions and implementations through versioned target adapters, without embedding target-specific assumptions in common suites.

The tool must separate:

``` text
STANDARD
  ↓
TEST SUITE
  ↓
RUNNER
  ↓
METRICS
  ↓
EVIDENCE
  ↓
GATE ENGINE
  ↓
RELEASE DECISION
```

Never use a total score to hide a critical correctness failure.

Rule:

``` text
Critical Gate FAIL
        ↓
RELEASE BLOCKED
```

Even a 99/100 benchmark score cannot override a failed Reactive,
Contract, Rollback, Safety, State Integrity, or Lifecycle gate.

------------------------------------------------------------------------

# 3.1 CVRS TARGET ADAPTER CONTRACT

CVRS must not couple test suites directly to one Core implementation.

Every target Core version must be connected through an adapter that exposes a stable verification surface.

Recommended adapters:

```text
adapters/
  core-1.2.mjs
  core-2.x.mjs
  custom-core.mjs
```

Minimum adapter responsibilities:

```text
identifyTarget()
getCapabilities()
createCore()
boot(core)
destroy(core)

reactive:
  createSignal()
  createComputed()
  createEffect()
  batch()
  untrack()

modules:
  register()
  initialize()
  teardown()

services:
  register()
  resolve()
  cleanup()

navigation:
  addRoute()
  navigate()
  getCurrentRoute()

storage:
  open()
  close()
  get()
  set()
  remove()
  clear()

diagnostics:
  snapshot()
  counters()
```

Adapters may mark unsupported capabilities explicitly.

Allowed capability status:

```text
SUPPORTED
UNSUPPORTED
NOT_IMPLEMENTED
ENVIRONMENT_REQUIRED
```

A CVRS suite must never silently emulate a missing target capability and then report PASS.

The adapter is only a translation layer. It must not modify Core semantics.

---

# 3.2 SPEC REQUIREMENTS VS HISTORICAL FINDINGS

The CVRS Standard must remain neutral across Core versions.

Therefore:

- normative requirements belong in the main CVRS specification
- Core-version-specific defects belong in `known-issues/`
- previous run results belong in `baselines/` or `evidence/`
- historical findings must never automatically become PASS/FAIL expectations for another Core version

Recommended structure:

```text
known-issues/
  core-2.0.4.md

baselines/
  core-1.2/
  core-2.0.4/
```

Historical findings may generate regression tests, but the expected behavior must be justified by:

```text
target contract
CVRS requirement
or explicit compatibility policy
```

If that justification is missing, classify the result as `SPEC_GAP` or `SPEC_MISMATCH`.

---


# 4. REQUIRED CVRS TEST DOMAINS

## 4.1 Functional Correctness

Verify the public API and actual behavior of every subsystem.

Do not assume APIs from a document. Inspect the supplied source first
and create an API/capability inventory.

Classify every claimed capability as:

-   PASS
-   FAIL
-   NOT_IMPLEMENTED
-   NOT_TESTABLE
-   SPEC_MISMATCH

------------------------------------------------------------------------

## 4.2 Reactive 2.0 Correctness --- Mandatory Hard Gate

At minimum test:

``` text
Diamond dependency graph
Deep dependency graph
Wide fan-out
Wide fan-in
Dynamic dependency switching
Nested computed
Computed equality / unchanged propagation
Batch consistency
Nested batch
Untrack
Effect cleanup
Effect self-dispose
Effect cross-dispose
Subscriber mutation during propagation
Re-entrant signal writes
Circular dependency detection
Computed exception recovery
Effect exception recovery
Cleanup exception recovery
Repeated create/dispose
10K reactive nodes
100K reactive nodes
100K mixed reactive graph
```

Reactive adversarial requirements:

- Subscriber mutation during propagation must not cause runaway execution, duplicate delivery, or skipped cleanup.
- Circular dependency behavior must be validated against the target contract. A raw runtime stack overflow must never be mislabeled as structured cycle detection.
- Computed equality semantics must be explicit. If the target promises value-based downstream suppression, unchanged computed output must not trigger downstream work. Otherwise classify the difference as `SPEC_GAP` or `SPEC_MISMATCH`, not automatically as a Core defect.
- Every failure must be classified as `CORE_BUG`, `TEST_BUG`, `SPEC_GAP`, `SPEC_MISMATCH`, or `ENVIRONMENT_BLOCKED` before remediation.

------------------------------------------------------------------------

# 5. FAILURE INJECTION / RECOVERY --- Mandatory Hard Gate

Inject failures at real lifecycle boundaries:

``` text
Storage open FAIL
Module #1 FAIL
Module #N FAIL
Service factory FAIL
Service onDestroy FAIL
Plugin install FAIL
Navigation guard FAIL
Effect FAIL
Rollback itself FAIL
Destroy midway FAIL
Boot → Fail → Retry ×100
Boot → Fail → Retry ×1000
```

Verify invariants after each failure.

Boot rollback is **not** final destroy.

Expected rollback semantics for the current Core design include:

``` text
BOOT FAIL
  ↓
ROLLBACK
  ├─ teardown runtime/module work already started
  ├─ cleanup factory-created singleton instances
  ├─ preserve service definitions for retry
  ├─ preserve direct object services
  ├─ preserve pre-existing persistent storage
  └─ permit retry
```

Final destroy is different:

``` text
FINAL DESTROY
  ├─ cleanup runtime/effects/navigation
  ├─ teardown modules
  ├─ destroy factory singleton instances
  ├─ call direct service onDestroy()
  ├─ clear service definitions
  └─ phase → DESTROYED
```

Test both paths independently.

------------------------------------------------------------------------

# 6. MODULE GRAPH VERIFICATION

Test:

``` text
registration
duplicate registration
missing dependency
circular dependency
diamond graph
deep dependency graph
wide graph
deterministic initialization order
partial initialization failure
reverse teardown order
rollback
retry
module churn
```

A module failure must not leave partially initialized modules/resources
behind.

------------------------------------------------------------------------

# 7. SERVICE REGISTRY / DI

Test:

``` text
direct services
factory services
singleton caching
factory failure
circular DI
missing service
cleanup
onDestroy
onDestroy failure
definition preservation during boot rollback
direct-service preservation during rollback
final destruction
service churn
```

Factory singleton retry lifecycle should prove:

``` text
instance #1
  ↓
boot fails
  ↓
destroy #1
  ↓
definition preserved
  ↓
retry
  ↓
instance #2
  ↓
READY
  ↓
final destroy
  ↓
destroy #2
```

------------------------------------------------------------------------

# 8. LIFECYCLE / STATE INTEGRITY

Verify valid and invalid transitions.

Include:

``` text
create
boot
ready
failed boot
rollback
retry
destroy-before-boot
destroy while booting
destroy midway
double destroy
operations after destroy
partial async completion after destroy
```

State integrity is a separate hard gate.

Verify that failure/rollback does not:

-   corrupt pre-existing persistent state
-   destroy direct services prematurely
-   lose service/module definitions required for retry
-   leave stale listeners/subscribers/timers/handles
-   permit invalid lifecycle state

------------------------------------------------------------------------

# 9. ROUTER / NAVIGATION

Router:

``` text
static routes
parameter routes
wildcards
query parsing
metadata
duplicate/conflicting routes
malformed URI
encoded unsafe keys
regex metacharacter escaping
URL fragments
sanitized params
```

Navigation:

``` text
async navigation
reactive current route
guards
hooks
redirect
abort previous navigation
repeated navigation
concurrent navigation
guard failure
redirect loops
destroy during navigation
navigation stress
```

------------------------------------------------------------------------

# 10. STORAGE

Test storage contract independently from provider implementations.

``` text
open
close
get
set
remove
clear
has
keys
TTL
failed open
failed operation
rollback interaction
pre-existing data preservation
reopen/retry
```

Provider/native gates are separate:

``` text
Memory adapter
IndexedDB real I/O
browser persistence/reload
OPFS integration
```

Do not mark IndexedDB/OPFS PASS from a memory fallback.

------------------------------------------------------------------------

# 11. CONTRACTS / SAFETY / SECURITY

Verify:

``` text
assertions
structured CoreError
stable error codes
invalid inputs
deep freeze
resilient clone
prototype pollution attempts
encoded dangerous keys
malformed URI
contract bypass attempts
unsafe plugin/module input
invalid lifecycle calls
circular dependencies
runaway recursion/propagation protection
```

Critical errors must not be silently swallowed.

------------------------------------------------------------------------

# 12. CONCURRENCY / REENTRANCY / DETERMINISM

Test:

``` text
signal write during effect
nested effect execution
nested batch
navigation while navigation pending
destroy while booting
destroy during callbacks
async service resolves after destroy
concurrent retries
repeated identical workloads
```

Measure deterministic:

-   dependency execution order
-   module initialization order
-   reverse teardown order
-   same input → same state
-   no race-dependent correctness result

------------------------------------------------------------------------

# 12.1 TEST ISOLATION MODEL

CVRS must isolate tests that can mutate global/runtime state, leak resources, deadlock, or run away.

Required rules:

```text
1 test = 1 isolated execution boundary when risk is non-trivial
```

Preferred isolation:

- lightweight functional tests may share a process only when state reset is proven
- reactive runaway/circular tests should run in Worker/child-process isolation
- memory/stress suites must run in dedicated processes
- native/browser tests must run in dedicated target sessions
- each risky test must have a timeout
- a timeout must force termination of that execution boundary
- one hung test must not prevent the rest of the suite from producing evidence

Each test result should record:

```text
timeoutMs
isolated
processExitCode
signal
forcedTermination
```

After a test finishes, CVRS should verify cleanup invariants before reusing any process.

---


# 13. MEMORY / STRESS / SOAK --- RELEASE GATES

Required workloads:

``` text
1M operations
10K–100K reactive nodes
10K create/destroy cycles
1K boot/fail/retry cycles
navigation stress
service churn
module churn
24h soak for final gate
```

At minimum measure:

``` text
Heap baseline
Peak heap
Heap after GC
Retained heap delta
Allocation/op
P50
P95
P99
Max latency
Initial throughput
Final throughput
Throughput degradation %
Listener count
Subscriber count
Dependency count
Effect count
Resource handles
Pending async work
Timer count
GC count
GC pause
Event-loop lag
Error rate
Recovery success rate
```

Do not use a fixed MB threshold as the only leak criterion.

Classify memory behavior:

``` text
STABLE
heap-after-GC remains within a bounded range
with no sustained upward trend

SUSPECT
heap rises temporarily but can return

LEAK
heap-after-GC grows persistently with
iterations/time
```

Always record environment information with performance results.

Never present one machine's ops/sec as a universal Core performance
claim.

------------------------------------------------------------------------

# 14. STRESS WORKLOADS

Mandatory:

``` text
1M operations
100K reactive graph
10K create/destroy
1K boot/fail/retry
10K+ navigation transitions
10K service churn
10K module churn
```

Correctness must remain 100% under stress.

A fast incorrect result is a failure.

------------------------------------------------------------------------

# 15. REPEATABILITY

Run critical suites repeatedly.

Recommended:

``` text
Correctness suite: 10–30 repeated runs
Boot/retry: 100–1000 cycles
Stress suite: multiple independent runs
```

Track:

-   flaky failures
-   variance
-   latency drift
-   heap drift
-   resource count drift

A flaky critical gate blocks release.

------------------------------------------------------------------------

# 16. OBSERVABILITY / EVIDENCE

Every run must produce machine-readable and human-readable evidence.

Recommended structure:

``` text
evidence/
  <timestamp>/
    environment.json
    inventory.json
    functional.json
    reactive.json
    failure-injection.json
    lifecycle.json
    modules.json
    services.json
    navigation.json
    storage.json
    security.json
    memory.json
    stress.json
    performance.json
    repeatability.json
    native.json
    scorecard.json
    failures.json
    REPORT.md
```

Every test record should contain at least:

``` json
{
  "id": "CVRS-REACTIVE-001",
  "domain": "reactive",
  "name": "Diamond dependency graph",
  "status": "PASS",
  "durationMs": 0,
  "expected": "...",
  "actual": "...",
  "classification": null,
  "evidence": {}
}
```

On failure add:

``` text
CORE_BUG
TEST_BUG
SPEC_GAP
SPEC_MISMATCH
ENVIRONMENT_BLOCKED
```

Never mutate the Core merely to make a test pass without proving the
test expectation first.

------------------------------------------------------------------------

# 16.1 BASELINE / REGRESSION COMPARISON

CVRS must support version-to-version and run-to-run comparison.

Recommended files:

```text
baselines/
  <target-id>/
    baseline.json

evidence/
  <timestamp>/
    current.json
    regression.json
```

Regression comparison should report at least:

```text
PASS → FAIL transitions
FAIL → PASS transitions
new tests
removed tests
P50/P95/P99 change %
throughput change %
heap-after-GC change
retained heap delta change
listener/subscriber/resource-handle delta
recovery success-rate change
```

A performance regression must not automatically fail release unless it exceeds the configured threshold, but a correctness regression in a critical gate must block release.

---

# 16.2 MACHINE-READABLE THRESHOLD POLICY

All release thresholds must be configuration-driven and versioned.

Recommended `config/gates.json`:

```json
{
  "correctness": {
    "criticalPassRate": 1.0,
    "maxUnhandledErrors": 0,
    "maxFlakyCriticalTests": 0
  },
  "performance": {
    "maxP95RegressionPct": 10,
    "maxP99RegressionPct": 15,
    "maxThroughputDegradationPct": 10
  },
  "resources": {
    "maxListenerDelta": 0,
    "maxSubscriberDelta": 0,
    "maxResourceHandleDelta": 0
  },
  "recovery": {
    "minRecoverySuccessRate": 1.0
  }
}
```

Thresholds must be stored in evidence with a config hash.

CVRS must never silently change thresholds between runs.

---

# 16.3 ENVIRONMENT FINGERPRINT / REPRODUCIBILITY

Every run must record the environment required to reproduce it.

Minimum fingerprint:

```text
OS / version / architecture
CPU model / logical cores
RAM
runtime name/version
Node version
browser name/version
GC mode / exposed-GC availability
Core version
Core source SHA-256
repository commit SHA
CVRS version
CVRS commit SHA
adapter id/version
configuration hash
start/end timestamps
timezone
```

Performance and memory evidence without an environment fingerprint is incomplete.

---


# 17. RELEASE DECISION ENGINE

Use **Hard Gates + Score**, never score alone.

The release engine must also enforce execution-profile completeness. A score from SMOKE or STANDARD cannot be promoted as a RELEASE or FINAL result.

Critical gates include at least:

``` text
Functional correctness
Reactive correctness
Contracts
Lifecycle
Failure injection
Rollback / recovery
State integrity
Safety/security
Resource cleanup
```

Decision rule:

``` text
ANY CRITICAL FAIL
    → RELEASE BLOCKED
```

Suggested lifecycle:

``` text
DEVELOPMENT
  ↓
CANDIDATE
  ↓
VERIFIED CANDIDATE
  ↓
VERIFIED
  ↓
FINAL VERIFIED
  ↓
KNOWN-GOOD BASELINE
```

Suggested interpretation:

``` text
<70      REJECT
70–84    DEVELOPMENT
85–94    CANDIDATE
95–99    VERIFIED CANDIDATE
```

But numeric score can only be considered after all critical gates pass.

`FINAL VERIFIED` additionally requires a successful **CVRS FINAL** profile and:

``` text
Critical gates 100%
Stress PASS
Memory/leak PASS
Repeatability PASS
24h soak PASS
Native/Real Environment PASS
Required integrations PASS
```

------------------------------------------------------------------------

# 17.1 CVRS PROCESS EXIT CODE STANDARD

CVRS CLI must return stable process exit codes so CI/CD and automation can make deterministic decisions.

```text
0 = PASS / requested gates completed successfully
1 = RELEASE_BLOCKED
2 = TEST_INFRA_FAILURE
3 = ENVIRONMENT_BLOCKED
4 = INVALID_TARGET
5 = CONFIG_ERROR
6 = INTERNAL_CVRS_ERROR
```

Rules:

- `RELEASE_BLOCKED` means the verification system ran correctly and found a blocking target failure
- `TEST_INFRA_FAILURE` means the test harness could not execute reliably
- `ENVIRONMENT_BLOCKED` means required native/platform access is unavailable
- `INVALID_TARGET` means the supplied Core cannot be identified or loaded
- exit codes must be included in evidence and final report

CI pipelines must not treat `TEST_INFRA_FAILURE` as equivalent to a Core failure.

---


# 18. NATIVE / REAL ENVIRONMENT FINAL GATES

Native means **real work in the real target environment**, not
simulation.

Run after sandbox/unit/contract/failure/stress gates.

Examples:

``` text
Browser-native verification
Real IndexedDB I/O
Browser persistence/reload
OPFS Sandbox integration
Process Sandbox integration
HTTP Sandbox integration
Database Sandbox integration
Native Windows/runtime gates when applicable
```

Environment policy blocks must be reported as `ENVIRONMENT_BLOCKED`, not
disguised as code PASS or FAIL.

------------------------------------------------------------------------

# 19. PERFORMANCE COMPARISON POLICY

When comparing targets:

- use identical workloads only where semantics are equivalent
- record capability and work-per-operation differences
- report raw throughput separately from safety/capability
- never remove required semantics for benchmark parity
- bind every result to target hash, environment fingerprint, CVRS version, adapter version, and config hash
- compare against a named accepted baseline, not an unlabeled previous run

Performance regression thresholds must be machine-readable and version-controlled.

------------------------------------------------------------------------

# 20. REQUIRED TOOL IMPLEMENTATION

Build CVRS as a real executable tool, not only Markdown.

Recommended command:

``` bash
node cvrs/run.mjs --target ./core.mjs --profile release
```

Recommended project:

``` text
cvrs/
├─ package.json
├─ run.mjs
├─ cli/
│  └─ args.mjs
├─ adapters/
│  ├─ core-1.2.mjs
│  └─ core-2.x.mjs
├─ contracts/
│  ├─ target-adapter.contract.md
│  └─ capability.schema.json
├─ config/
│  ├─ default.json
│  └─ gates.json
├─ schemas/
│  ├─ test-result.schema.json
│  ├─ evidence.schema.json
│  └─ scorecard.schema.json
├─ lib/
│  ├─ loader.mjs
│  ├─ runner.mjs
│  ├─ isolation.mjs
│  ├─ metrics.mjs
│  ├─ gate-engine.mjs
│  ├─ evidence.mjs
│  ├─ failure-injector.mjs
│  ├─ regression.mjs
│  ├─ environment.mjs
│  └─ statistics.mjs
├─ suites/
│  ├─ functional.mjs
│  ├─ reactive.mjs
│  ├─ lifecycle.mjs
│  ├─ modules.mjs
│  ├─ services.mjs
│  ├─ router-navigation.mjs
│  ├─ storage.mjs
│  ├─ contracts-security.mjs
│  ├─ failure-injection.mjs
│  ├─ memory-leak.mjs
│  ├─ stress.mjs
│  ├─ performance.mjs
│  └─ repeatability.mjs
├─ workloads/
│  ├─ reactive-100k.mjs
│  ├─ operations-1m.mjs
│  ├─ lifecycle-10k.mjs
│  ├─ boot-retry-1k.mjs
│  ├─ navigation-churn.mjs
│  ├─ service-churn.mjs
│  └─ module-churn.mjs
├─ baselines/
├─ known-issues/
└─ evidence/
```

Prefer zero/minimal runtime dependencies.

The verification system must not require modifications to the target
Core unless an explicit adapter is needed.

------------------------------------------------------------------------

# 21. REQUIRED OUTPUT

A run should end with a summary similar to:

``` text
CVRS VERIFICATION
════════════════════════════════════

Target                    <identified target>
Profile                   RELEASE
Functional               PASS
Reactive 2.0             PASS
Contracts / Safety       PASS
Lifecycle                PASS
Modules                   PASS
Services                  PASS
Router / Navigation      PASS
Storage                   PASS
Failure Injection        PASS
Rollback / Recovery      PASS
State Integrity          PASS
Memory / Leak            PASS
Stress                    PASS
Repeatability            PASS
Performance              96/100

24h Soak                 NOT_RUN
Native                    NOT_RUN

Critical Gates           10/10 PASS
Overall Score            96/100

DECISION:
VERIFIED CANDIDATE
```

If a critical test fails:

``` text
Overall Score            98/100
Reactive Correctness     FAIL

DECISION:
RELEASE BLOCKED
```

------------------------------------------------------------------------

# 22. DEVELOPMENT RULES FOR THE AI

1.  Inspect the supplied Core before writing assumptions.
2.  Build a capability inventory from actual exports/source.
3.  Run existing project tests first.
4.  Keep built-in tests and CVRS external tests separate.
5.  Never treat documentation claims as execution evidence.
6.  Add adversarial tests.
7.  Put timeouts/guards around tests that can deadlock or run away.
8.  Do not let one hung test block the entire suite.
9.  Capture stack/error/evidence for every failure.
10. Distinguish Core bug from test bug.
11. Fix the test harness if the harness is wrong.
12. Do not weaken a valid test just to obtain PASS.
13. Do not modify Core semantics for benchmark scores.
14. Retest the complete regression suite after any Core change.
15. Preserve evidence from before and after fixes.
16. Report anything not actually executed as `NOT_RUN`.
17. Report missing implementation as `NOT_IMPLEMENTED`.
18. Report unavailable native environment as `ENVIRONMENT_BLOCKED`.
19. Never fabricate benchmark, memory, soak, native, or integration
    evidence.
20. Continue automatically until a real external blocker or a completed
    verification state is reached.

------------------------------------------------------------------------

# 23. CVRS EXECUTION PROFILES

CVRS defines four standard profiles so that a partial runner cannot be mistaken for a full verification.

## 23.1 SMOKE

Fast sanity verification only. Typical gates:

```text
Core load / identity
Basic Reactive
Basic lifecycle rollback
Basic router safety
Basic storage preservation
```

A SMOKE pass must be reported as **CVRS SMOKE PASS**, never simply `CVRS PASS` or `VERIFIED CANDIDATE`.

## 23.2 STANDARD

Adds full functional correctness, Reactive adversarial tests, lifecycle, modules, services, navigation, storage, contracts/security, failure injection, and state integrity.

## 23.3 RELEASE

STANDARD plus memory/leak, stress, 1M operations, 100K reactive scale, 10K lifecycle/service/module/navigation churn, 1K boot/retry, repeatability, regression comparison, and release thresholds.

## 23.4 FINAL

RELEASE plus required integrations, Native/Real Environment evidence, persistence/reload verification where applicable, and long-duration soak (24h when required by policy).

Status labels must always include the profile used.

```text
CVRS SMOKE PASS
CVRS STANDARD PASS
CVRS RELEASE PASS
CVRS FINAL PASS
```

Only `CVRS FINAL PASS` may support promotion to FINAL VERIFIED / KNOWN-GOOD when all project-required final gates are satisfied.

------------------------------------------------------------------------

# 24. FIRST EXECUTION PLAN

When given a Core ZIP/repository:

``` text
1. Extract / inspect repository
2. Identify source authority and duplicate generated copies
3. Hash important Core files
4. Read package metadata and existing tests
5. Run built-in tests unchanged
6. Build actual API/capability inventory
7. Run CVRS functional gates
8. Run Reactive mandatory gates
9. Run failure injection / rollback gates
10. Run lifecycle/module/service/navigation/storage gates
11. Run security/reentrancy/determinism gates
12. Run 10K/100K/1M stress workloads
13. Run memory/leak checks with GC when available
14. Run repeatability
15. Generate evidence + scorecard
16. Decide RELEASE BLOCKED / candidate status
17. Only after correctness closure, run optimization benchmark work
18. Native/integration/24h soak remain final gates
```

------------------------------------------------------------------------

# 25. DEFINITION OF DONE

CVRS itself is complete only when:

-   it is executable
-   tests are deterministic where expected
-   individual tests have timeout/isolation
-   evidence is machine-readable
-   reports are human-readable
-   hard gates are enforced automatically
-   target Core is not silently modified
-   failures are classified
-   stress metrics are captured
-   repeat runs are supported
-   final status is generated automatically
-   the tool can verify more than one Core version through
    adapters/configuration
-   adapter contract is versioned
-   risky tests support isolation and timeout termination
-   thresholds are machine-readable and hashed
-   environment fingerprint is recorded
-   baseline/regression comparison is supported
-   CLI exit codes are stable for CI/CD
-   execution profiles are enforced and reported
-   partial-profile PASS cannot be promoted as full CVRS PASS
-   normative standard contains no target-specific PASS claims

The final objective is not to make the Core appear good.

The objective is to **prove exactly what is correct, what fails, why it
fails, whether the test is valid, how the runtime behaves under
failure/stress, and whether the Core is safe to release.**


---

# 26. IMPLEMENTATION PRIORITY FOR CVRS v1.0

Build in this order:

```text
P0
Adapter Contract
Runner
Isolation
Result Schema
Evidence Writer
Gate Engine

P1
Functional
Reactive
Lifecycle
Failure Injection
Rollback / Recovery
Modules / Services / Navigation / Storage

P2
Memory / Leak
Stress
Performance
Regression Comparison
Environment Fingerprint

P3
Repeatability
Native Providers
Integration Gates
24h Soak
CI/CD integration
```

`CVRS v1.0` is implementation-ready when P0 + P1 are executable and produce deterministic evidence and release decisions.

---

# 27. STANDARD GOVERNANCE

CVRS uses four artifact classes:

```text
CVRS-STANDARD.md          Normative requirements
CVRS-ADAPTER-CONTRACT.md Stable target translation contract
CVRS-GATES.json           Machine-readable hard gates / thresholds
CVRS-PROFILES.json        Required gates per execution profile
```

Target-specific material must be separate:

```text
adapters/<target>.mjs
baselines/<target>/
known-issues/<target>.md
evidence/<run-id>/
```

Changing a normative guarantee requires a CVRS Standard version change. Changing a target adapter does not change the Standard version unless the common adapter contract changes.

# 28. CANONICAL RELEASE RULE

A CVRS result is valid only when it identifies all of:

```text
CVRS standard version
execution profile
target identity + source hash
adapter identity + version
configuration hash
environment fingerprint
gate results
evidence location
final process exit code
```

If any critical gate is FAIL, the decision is `RELEASE_BLOCKED`.

If required gates for the selected profile were not executed, the result is `INCOMPLETE_PROFILE`, not PASS.

If the environment prevents a required gate, report `ENVIRONMENT_BLOCKED`.

The canonical objective is:

> **Prove what the Core guarantees under real executable evidence — without weakening semantics, hiding failures behind scores, or confusing a partial test profile with release verification.**

