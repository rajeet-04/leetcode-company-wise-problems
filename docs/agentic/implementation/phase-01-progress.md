# Phase 01 execution progress

- Catalog V2 domain types added.
- CSV parser extracted with fixtures for quoted fields and line endings.
- Source observation normalization added for 30d, 90d, 6m, older, and all windows.
- Deterministic aggregation added without losing distinct source observations.
- V2 web artifact, legacy compatibility artifact, extension artifact, metadata, and checksum generation added.
- Catalog V2 validator and upstream CI publication gate added.
- Phase exit verification is running on `feat/phase-01-catalog-v2`.
