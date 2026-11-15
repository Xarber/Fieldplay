# Fieldplay UADS baseline

The November 14, 2026 instructions through section 50 have no published version number. The manifest uses the dated baseline identifier and schema version 1. The registry currently covers the landing regression and priorities from sections 36–50. Its IDs are stable. Individual controls across the full standard still require deeper mapping.

Run `npx tsx scripts/validate-uads.ts` from the repository root. It validates the manifest, registry correspondence, evidence references and generated schema consistency. The quality workflow runs structural validation, existing source tests and a dependency audit. References to source and documentation are implementation pointers. All requirement results remain pending until the required evidence is recorded.

Onboarding, the screenshot studio, developer server switching, live native distribution, changed-code coverage and operational alerting remain open. No exceptions have been approved. Native publication requires separate authorization and complete release checks.
