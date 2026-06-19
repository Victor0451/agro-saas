# Spec: multi-tenant-rpc-guards

> Delta spec for change `security-hardening`. After archive, becomes the canonical capability at `openspec/specs/multi-tenant-rpc-guards/spec.md`.

## Purpose

This capability provides a DB-level guarantee that every `SECURITY DEFINER` RPC — which bypasses RLS by running as the function owner — first validates the caller's tenant before mutating or reading tenant-scoped data. It also enforces the single-tenant-per-user invariant for onboarding and removes a known-dead RPC. The single, reusable contract is `public.assert_caller_tenant(p_expected_tenant uuid)`, which raises `42501` (`tenant_mismatch`) whenever the caller's tenant claim does not match the requested tenant, and a sibling `public.assert_caller_has_no_tenant()` for onboarding. Without this, any authenticated user can read or write any other tenant by passing an arbitrary UUID into a `p_tenant_id` parameter.

## Requirements

### Requirement: assert_caller_tenant helper

The system SHALL provide `public.assert_caller_tenant(p_expected_tenant uuid) RETURNS void` declared `SECURITY DEFINER STABLE` with `SET search_path = public, auth`. The function MUST read the caller's tenant from the top-level JWT claim `auth.jwt() ->> 'tenant_id'` (set by the migration 033 custom access token hook). If that claim is NULL or absent, the function MUST fall back to `SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()`. The function MUST raise SQLSTATE `42501` with errcode `tenant_mismatch` when the resolved caller tenant is NULL or does not equal `p_expected_tenant`. Grant `EXECUTE` to `authenticated`.

#### Scenario: matching tenant via JWT claim
- GIVEN `auth.jwt() ->> 'tenant_id' = X`
- WHEN the function is called with `p_expected_tenant = X`
- THEN the function returns without raising.

#### Scenario: matching tenant via DB fallback
- GIVEN `auth.jwt() ->> 'tenant_id' IS NULL` AND `usuarios.tenant_id = X` for `auth.uid()`
- WHEN the function is called with `p_expected_tenant = X`
- THEN the function returns without raising.

#### Scenario: mismatched tenant
- GIVEN the caller's tenant resolves to `X`
- WHEN the function is called with `p_expected_tenant = Y`
- THEN the function raises `42501 tenant_mismatch` and no mutation occurs.

#### Scenario: caller has no tenant
- GIVEN `auth.jwt() ->> 'tenant_id' IS NULL` AND `usuarios.tenant_id IS NULL` for `auth.uid()`
- AND `p_expected_tenant` is non-NULL
- THEN the function raises `42501 tenant_mismatch`.

### Requirement: assert_caller_has_no_tenant helper

The system SHALL provide `public.assert_caller_has_no_tenant() RETURNS void` declared `SECURITY DEFINER STABLE` with `SET search_path = public, auth`. The function MUST raise SQLSTATE `42501` with errcode `already_has_tenant` when `public.usuarios.tenant_id IS NOT NULL` for `auth.uid()`. Grant `EXECUTE` to `authenticated`.

#### Scenario: caller has no tenant
- GIVEN `usuarios.tenant_id IS NULL` for `auth.uid()`
- THEN the function returns without raising.

#### Scenario: caller already onboarded
- GIVEN `usuarios.tenant_id` is set for `auth.uid()`
- THEN the function raises `42501 already_has_tenant`.

### Requirement: SECURITY DEFINER RPCs MUST validate caller tenant

Every `SECURITY DEFINER` RPC that accepts a `p_tenant_id` parameter MUST call `PERFORM public.assert_caller_tenant(p_tenant_id);` as its first executable statement, before any `SELECT`, `INSERT`, `UPDATE`, or `DELETE` against tenant-scoped tables.

#### Scenario: protected RPCs
- The following RPCs MUST call the helper as their first executable statement:
  - `public.seed_tenant_insumos(uuid)`
  - `public.registrar_almacigo(p_tenant_id uuid, ...)`
  - `public.registrar_labor(p_tenant_id uuid, ...)`
  - `public.get_deviation_report(p_tenant_id uuid, ...)`

#### Scenario: rejected cross-tenant attempt
- GIVEN user A belongs to tenant X
- WHEN A calls any protected RPC with `p_tenant_id = Y` (a tenant A does not belong to)
- THEN the call raises `42501 tenant_mismatch` and no row is read or written.

#### Scenario: same-tenant attempt succeeds
- GIVEN user A belongs to tenant X
- WHEN A calls any protected RPC with `p_tenant_id = X`
- THEN the call proceeds and operates only on X's data.

### Requirement: create_owner_tenant enforces single-tenant-per-user

`public.create_owner_tenant(text, text, numeric, numeric)` MUST call `PERFORM public.assert_caller_has_no_tenant();` as its first executable statement. The function MUST continue to insert into `tenants` and update `usuarios.tenant_id` for the caller, then call `seed_tenant_insumos` for the new tenant.

#### Scenario: new user creates a tenant
- GIVEN the caller's `usuarios.tenant_id IS NULL`
- WHEN the caller invokes `create_owner_tenant(...)`
- THEN the call succeeds, a new tenant is created, the caller is assigned as admin, and `seed_tenant_insumos` runs.

#### Scenario: onboarded user attempts re-onboarding
- GIVEN the caller's `usuarios.tenant_id` is already set
- WHEN the caller invokes `create_owner_tenant(...)`
- THEN the call raises `42501 already_has_tenant` and no tenant row is inserted.

### Requirement: registrar_almacigo derives stock from the ledger

`public.registrar_almacigo(p_tenant_id uuid, p_finca_id uuid, p_fecha date, p_variedad varchar, p_cantidad_bandejas integer, p_insumo_semilla_id uuid, p_semilla_usada decimal, p_insumo_sustrato_id uuid, p_sustrato_usado decimal, p_observaciones text) RETURNS jsonb` MUST:
1. Call `PERFORM public.assert_caller_tenant(p_tenant_id);` first.
2. Compute available stock for `p_insumo_semilla_id` (and `p_insumo_sustrato_id` when provided and `> 0`) as
   `SUM(compras_insumos.cantidad) - SUM(almacigos.semilla_usada|sustrato_usado) - SUM(labores_insumos.cantidad)`
   restricted to the caller's tenant and the relevant insumo.
3. Raise `insufficient_stock_semilla` or `insufficient_stock_sustrato` when required > available.
4. `INSERT INTO almacigos(...)` and return `jsonb_build_object('id', new_id, 'success', true)`.
5. Run the entire body inside a transaction with `ISOLATION LEVEL SERIALIZABLE` to make concurrent sows race-safe.
6. Preserve the existing signature (no caller-side changes required).

#### Scenario: sow with sufficient stock
- GIVEN seed insumo has 10 kg available (purchases minus prior almacigo + labor consumption for the tenant)
- WHEN the caller submits `p_semilla_usada = 3`
- THEN the almacigo is inserted and `{id, success: true}` is returned.

#### Scenario: sow exceeds available seed stock
- GIVEN seed insumo has 2 kg available
- WHEN the caller submits `p_semilla_usada = 5`
- THEN the call raises `insufficient_stock_semilla` and no row is inserted.

#### Scenario: sow exceeds available substrate stock
- GIVEN substrate insumo has 1 L available and `p_sustrato_usado = 4`
- WHEN the caller submits the request
- THEN the call raises `insufficient_stock_sustrato` and no row is inserted.

#### Scenario: concurrent sows are race-safe
- GIVEN available stock = 10 kg and two simultaneous `registrar_almacigo` calls each requesting 8 kg
- WHEN both transactions run concurrently under `SERIALIZABLE` isolation
- THEN exactly one succeeds and the other raises `insufficient_stock_semilla` (no double-spend).

### Requirement: registrar_plantacion is removed

`public.registrar_plantacion(...)` MUST be `DROP FUNCTION`'d in the same migration. The function is orphaned (0 callers in `src/`); `plantaciones` is populated via direct INSERT in `src/app/api/produccion/plantaciones/route.ts`.

#### Scenario: function no longer exists
- WHEN `DROP FUNCTION public.registrar_plantacion(...)` is applied
- THEN `\df public.registrar_plantacion` returns no rows.

#### Scenario: callers unaffected
- GIVEN `plantaciones` writes go through `src/app/api/produccion/plantaciones/route.ts` (direct INSERT)
- WHEN the migration is applied
- THEN planting flows continue to work end-to-end.

### Requirement: helper functions are idempotent and re-runnable

The migration MUST use `CREATE OR REPLACE FUNCTION` for the helper and `CREATE OR REPLACE FUNCTION` for the patched RPCs so the migration can be re-applied if it partially fails on first run.

#### Scenario: migration re-run
- WHEN the migration is re-applied (e.g., a partially failed first run left the DB in an intermediate state)
- THEN the helpers and RPCs end up in the desired state without error.

## Out of scope

- Frontend display of derived stock in `almacigo-form.tsx`, `labor-form.tsx`, `cultivo-form.tsx` (separate change).
- Activation of the custom access token hook in the Supabase Dashboard (operational, separate).
- Issues #4 and #5 from the audit (`console.log` regression, `/admin` route guard).
- Adding Vitest/Playwright.
- Items in `TECHNICAL_DEBT.md`.

## Verification mapping

| Requirement | Manual verification |
|---|---|
| assert_caller_tenant helper | Run `SELECT assert_caller_tenant('<own-tenant>');` — no raise. Run with another tenant — 42501. |
| assert_caller_has_no_tenant helper | Run as new user — no raise. Run as onboarded user — 42501. |
| SECURITY DEFINER RPCs validate tenant | Cross-tenant `SELECT registrar_labor(p_tenant_id := '<B>')` from tenant A — 42501. |
| create_owner_tenant guard | Onboarded user calls `create_owner_tenant` — 42501. |
| registrar_almacigo derives stock | SOW with sufficient stock — succeeds. SOW with insufficient — raises `insufficient_stock_*`. |
| registrar_plantacion removed | `\df public.registrar_plantacion` — no rows. |
