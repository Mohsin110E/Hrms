# TEST_STRATEGY.md — Testing Approach (PROPOSAL)

## Goals

1. Protect business behavior during migration — every confirmed rule from `BUSINESS_RULES.md` (BR-* IDs) becomes a regression test.
2. Guarantee security redesign (auth, file access) is properly tested.
3. Make cutover verifiable (reconciliation + smoke suites).

## Layers

| Layer | Tooling | Scope | Target coverage |
|---|---|---|---|
| Unit (NestJS) | Jest, ts-mockito | services, password policy, token lifecycle, validators, metadata engine logic | all module services; ≥ 80% on auth/documents |
| Unit (Next.js) | Jest + Testing Library | forms, auth guards, permission-driven UI | critical paths |
| API/e2e | Supertest against Nest testing module + local PG | full routes incl. auth failure/403 cases, upload flows, pagination/filter parity vs legacy payloads | every route in API spec |
| Data migration | Node ETL test harness vs restored snapshot subsets | type casts, ID preservation, reconciliation queries, file-copy mapping | every workstream WS-1..8 |
| Security | automated (`npm audit`, secret-scan) + review checklist | authz matrix, injection attempts against new endpoints (verify parameterized storage), file-access control | mandatory before release |
| Manual UAT | scripted parity checklist per module (QA-01) | business acceptance | sign-off gate |

## Rule-ID traceability

- Every test naming convention: `br-um-01.spec.ts` ↔ `BUSINESS_RULES.md` entry; a matrix in `TASKS.md` TEST-02 tracks rule coverage.
- Unknown legacy behaviors (proc bodies pending) appear as **placeholder tests pending evidence** — never faked passes.

## Environments & data

- Local dev PG with synthetic seeds only (no real employee data in tests).
- Staging = restored UAT snapshot (human action) for parity/E2E rehearsals. All data-handling access audited; no production credentials anywhere.

## CI gates (proposal — to be created only after approval)

`lint` + `tsc --noEmit` + `jest` + `prisma validate` + build; migration dry-run test suite; secret scanning (e.g., gitleaks).
Legacy repo excluded from all pipelines.
