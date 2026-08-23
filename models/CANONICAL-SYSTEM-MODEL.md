# CVRS Canonical System Model v1

Discovery describes a target without assuming that implementation names equal CVRS semantics.

Canonical dimensions:
- identity / manifests / language-runtime
- public capabilities and entry points
- state and lifecycle
- dependency and ownership graph
- errors / failure semantics / retry
- resource ownership and cleanup
- concurrency / scheduling
- persistence and external I/O
- security boundaries
- performance characteristics
- built-in tests and verification hooks

Pipeline:

`Target → Safe Discovery → Canonical Model → Contract Mapping → Adapter → Verification → Evidence → Decision`

Discovery is non-executing by default. A discovered name is a hypothesis, not proof of capability.
Contract mapping must be explicit before a domain-specific gate can become authoritative.
