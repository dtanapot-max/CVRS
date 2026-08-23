# CVRS Target Adapter Contract v1.0.0

A target adapter translates a Core implementation into the stable CVRS verification surface without changing target semantics.

Required adapter metadata: `id`, `version`, `targetIdentity`, `capabilities`.

Capability states: `SUPPORTED`, `UNSUPPORTED`, `NOT_IMPLEMENTED`, `ENVIRONMENT_REQUIRED`.

The adapter must expose mappings for available domains (core lifecycle, reactive, modules, services, router/navigation, storage, diagnostics) and must never emulate a missing target capability and report it as PASS.

Adapter errors are classified separately from target failures.
