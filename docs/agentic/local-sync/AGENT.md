# Local Sync Agent Guide

## Mission

Keep website and extension personal data consistent locally inside the same browser profile without any cloud user-data service.

## Source of truth model

Neither client is a permanent global source of truth. Both keep local replicas and exchange immutable mutations plus versioned entity updates. Merge rules produce the same derived state on both sides.

## Storage boundaries

- Website: IndexedDB/local browser persistence.
- Extension: `chrome.storage.local` and/or extension-owned IndexedDB behind a storage adapter.
- Public catalog: remote/static updates allowed.
- Personal data: no remote persistence and no `chrome.storage.sync`.

## Protocol rules

- Never synchronize one monolithic JSON state blob using last-write-wins.
- Mutation IDs must be globally unique within a local installation ecosystem.
- Replaying a mutation must be idempotent.
- Every persisted record carries a schema version.
- Entity-field conflicts use deterministic documented rules.
- Website origin must be explicitly allowlisted by the extension bridge.
- Unknown protocol/schema versions fail closed and leave existing local state intact.
- Sync logs must not contain private note contents unless required for explicit local debugging.

## Backup rule

Versioned export/import is part of local-first reliability. Backup operations must support dry-run/preflight summaries before replace or merge.
