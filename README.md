# HRMS Modernization — New Project Workspace

This repository is the **new home** for the HRMS modernization project. It is kept strictly
separate from the legacy repository (`D:\.net\hrms`), which remains a **read-only reference**.

## Current status

**Phase 0 / Phase 1 (Discovery & Planning)** — in progress. No implementation code exists here yet.

## Target technology stack (planned, not yet implemented)

| Layer | Current (legacy) | Target |
|---|---|---|
| Backend | .NET Framework 4.5.2 / ASP.NET Core 1.0-preview2 hybrid + EF6 database-first | NestJS (Express adapter), TypeScript |
| Frontend | Angular 7.1 SPA | Next.js (TypeScript) |
| Database | Microsoft SQL Server | PostgreSQL |
| ORM | Entity Framework 6.1.3 + EDMX + stored procedures | Prisma |

## Directory layout

```
planning/          All discovery, architecture, and migration planning documents
  AGENTS.md          Mandatory instructions for future AI coding agents
  PROGRESS.md        Living status report (evidence-based)
  TASKS.md           Task backlog with IDs, status, and acceptance criteria
  SYSTEM_OVERVIEW.md Legacy system architecture inventory
  MODULE_INVENTORY.md Feature inventory for the three Phase-1 modules
  BUSINESS_RULES.md  Confirmed business rules (with evidence paths)
  DATABASE_DISCOVERY.md Read-only database findings + SS->PG type mapping
  TARGET_ARCHITECTURE.md Proposed target architecture (proposal)
  DATA_MIGRATION_PLAN.md SQL Server -> PostgreSQL migration strategy (draft)
  SECURITY_REVIEW.md Security findings and risks of the legacy system
  TEST_STRATEGY.md   Testing approach (proposal)
  DECISIONS.md       Architecture decision records
  OPEN_QUESTIONS.md  Questions needing business/technical clarification
```

## Golden rules (see `planning/AGENTS.md` for full text)

1. Legacy code in `D:\.net\hrms` is **read-only** — never modify, refactor, or format it.
2. The UAT SQL Server database is **read-only** — SELECT and metadata access only, never writes, never execute stored procedures.
3. No implementation work before architecture, scope, and migration strategy are reviewed and approved.
4. Every claim about existing behavior must cite source evidence; mark unverified behavior as open questions.
