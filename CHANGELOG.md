# Changelog

## 1.1.1 — 2026-08-23

- Added executable GVS verification.
- Added explicit Version / Release / Build / Core / Baseline / Schema identity.
- Separated CVRS product version from CVRS Standard and evidence schema versions.
- Added `npm run verify` combined GVS + CVRS self-verification gate.

## 1.1.0 — 2026-08-23

- Added false-positive safeguards for regression diagnosis.
- Added positive and negative self-controls for REG-004 and REG-006.
- Failed gates are not automatically classified as CORE_BUG.
- Added `UNCLASSIFIED_REQUIRES_DIAGNOSIS` default failure classification.
- Retained canonical A/B/C/D verification domains.
- Retained Mandatory Regression Gates, stress, memory, repeatability, isolation,
  evidence, profiles, baseline comparison, environment fingerprint and CI exit codes.
- Self-test baseline: CVRS 5/5 + regression harness 4/4 PASS.

## 1.0.0

- Initial executable CVRS standard/tool baseline.
