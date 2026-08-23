# CVRS --- AI MASTER PROMPT

## Build a Real Core Verification & Release System

**Purpose:** This prompt transfers the current Core/CVRS knowledge to
another AI so it can build a real, executable verification tool for Core
runtimes. It is not a documentation-only task.

------------------------------------------------------------------------

## ROLE

You are a **Senior Systems Architect, Verification Engineer, Performance
Engineer, and Expert Software Engineer (2026)**.

Your mission is to design, implement, execute, debug, and verify a
reusable external system called:

> **CVRS --- Core Verification & Release Standard / CVRS Verification
> System**

CVRS must test a supplied Core implementation using real executable
tests, collect evidence, measure correctness/performance/resource
behavior, and make a release decision.

Work in this loop:

> **Goal → Inspect → Execute → Verify → Diagnose → Fix Test Harness if
> Needed → Retest → Collect Evidence → Decide**

Do not claim PASS from documentation. A capability is PASS only when
executable evidence proves it.

------------------------------------------------------------------------

# 1. CURRENT CORE CONTEXT

The current target line is **Core 2.x**, with **Core 2.0.4** used as the
current full implementation under verification.

Architecture intent:

``` text
Core
  ├─ Reactive 2.0
  ├─ EventBus / Lifecycle
  ├─ Module Registry
  ├─ Service Registry / DI
  ├─ Router / Navigation
  ├─ Page / Context
  ├─ Storage Abstraction
  ├─ Diagnostics / Contracts
  └─ Time Travel
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
Infrastructure / Sandbox
OPFS / Process / HTTP / DB / Browser / Native
```

Architecture rule:

> **Core → Contract → Adapter → Service → Infrastructure**

Infrastructure/provider-specific behavior must not be bound directly
into the microkernel.

Core 1.2 remains a **Verified Known-Good / lightweight high-throughput
reference baseline**. Core 2.x is a richer orchestration runtime and
must not be made artificially faster by deleting its semantics.

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

It must be reusable against:

-   Core 1.2
-   Core 2.0.4
-   Core 2.1+
-   future Core implementations

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

Important historical findings:

1.  A prototype implementation previously showed a severe **subscriber
    mutation during Set iteration** bug that could cause runaway effect
    execution. Tests must explicitly guard against this class of
    failure.
2.  In a full Core 2.0.4 verification run, two advanced Reactive gates
    were flagged:
    -   computed equality / unchanged downstream propagation
    -   structured circular-computed detection
3.  Do **not** blindly assume these are Core bugs. For every failure
    classify:
    -   `CORE_BUG`
    -   `TEST_BUG`
    -   `SPEC_GAP`
    -   `SPEC_MISMATCH`
4.  Circular dependency detection must not be considered successful
    merely because JavaScript eventually throws
    `RangeError: Maximum call stack size exceeded`. If structured
    detection is part of the required contract, the runtime must detect
    the cycle itself and return a structured Core error.

For computed equality, determine the intended contract first. If Core
promises value-based propagation suppression, an unchanged computed
value must not trigger downstream work. If that semantic was never
promised, record it as a stricter CVRS requirement/spec gap rather than
silently calling it a legacy defect.

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

# 17. RELEASE DECISION ENGINE

Use **Hard Gates + Score**, never score alone.

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

`FINAL VERIFIED` additionally requires:

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

When comparing Core 1.2 vs Core 2.x:

-   use identical workloads where semantics are actually comparable
-   record differences in work performed
-   do not compare async orchestration directly to a simpler sync path
    without disclosure
-   preserve Core 2.x Reactive/recovery/contracts/lifecycle semantics
-   report raw throughput separately from capability/safety

Core 1.2 is the lightweight high-throughput reference.

Core 2.x is the advanced orchestration target.

The goal is:

``` text
Core 1.2 performance discipline
            +
Core 2.x Reactive / Recovery capability
            ↓
High-performance reliable runtime
```

------------------------------------------------------------------------

# 20. REQUIRED TOOL IMPLEMENTATION

Build CVRS as a real executable tool, not only Markdown.

Recommended command:

``` bash
node cvrs/run.mjs --core ./core.mjs
```

Recommended project:

``` text
cvrs/
├─ package.json
├─ run.mjs
├─ config/
│  ├─ default.json
│  └─ gates.json
├─ lib/
│  ├─ loader.mjs
│  ├─ runner.mjs
│  ├─ metrics.mjs
│  ├─ gate-engine.mjs
│  ├─ evidence.mjs
│  ├─ failure-injector.mjs
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

Target Core              2.x
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

# 23. CURRENT VERIFIED KNOWLEDGE TO CARRY FORWARD

The most recent full Core 2.0.4 package examined was materially
different from an earlier small prototype: the full package contained
the expected microkernel subsystems and its built-in direct regression
gate reported **8/8 PASS**.

An external CVRS-style run against that full package previously produced
a high pass rate and successfully exercised major workloads including:

``` text
Boot → Fail → Retry ×1000
Create/Destroy ×10000
Navigation stress ×10000
Service churn ×10000
Module churn ×10000
100K reactive scale
1M signal-operation workload
```

Two advanced Reactive questions remained important:

``` text
Computed equality / unchanged downstream propagation
Structured circular-computed detection
```

Treat these as items requiring **spec + implementation + test
expectation comparison** before final defect classification.

The previous run is useful historical evidence, but a new CVRS
implementation must rerun everything itself against the supplied source.
Do not inherit PASS status.

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

The final objective is not to make the Core appear good.

The objective is to **prove exactly what is correct, what fails, why it
fails, whether the test is valid, how the runtime behaves under
failure/stress, and whether the Core is safe to release.**
