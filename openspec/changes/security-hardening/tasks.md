# Tasks: security-hardening

> Implementation tasks for change `security-hardening`. Maps 1:1 to commits. Run tasks in order — each builds on the previous.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120 SQL + ~10 TS = ~130 lines |
| 400-line budget risk | **Low** (well under budget) |
| Chained PRs recommended | **No** |
| Delivery strategy | ask-always |

Decision needed before apply: **No**
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

---

## Task 1: Create helper functions

**Work unit:** Add two reusable tenant-validation helpers to migration 035.

**Files:**
- `supabase/migrations/035_security_hardening.sql` (section 1 — append after existing migrations)

**Commit message:** `fix(db): add tenant validation helpers assert_caller_tenant and assert_caller_has_no_tenant`

**Acceptance criteria:**
- [ ] `\df public.assert_caller_tenant` returns one row
- [ ] `\df public.assert_caller_has_no_tenant` returns one row
- [ ] `SELECT public.assert_caller_tenant('<own-tenant-uuid>')` returns without raising when called as that tenant's user
- [ ] `SELECT public.assert_caller_tenant('<other-tenant-uuid>')` raises `42501 tenant_mismatch`
- [ ] `SELECT public.assert_caller_has_no_tenant()` raises `42501 already_has_tenant` when caller has tenant set
- [ ] `SELECT public.assert_caller_has_no_tenant()` returns without raising for a user with `usuarios.tenant_id IS NULL`

**Test steps:**
```sql
-- Verify helpers exist
\df public.assert_caller_tenant
\df public.assert_caller_has_no_tenant

-- Helper 1: assert_caller_tenant — matching tenant returns without raising
-- (run as a user whose tenant_id matches the UUID below)
SELECT assert_caller_tenant('<your-tenant-uuid>');
-- Expected: returns without error

-- Helper 1: assert_caller_tenant — mismatched tenant raises 42501
SELECT assert_caller_tenant('<any-other-uuid>');
-- Expected: ERROR:  tenant_mismatch: caller <uuid> does not belong to tenant <uuid> (SQLSTATE 42501)

-- Helper 2: assert_caller_has_no_tenant — user without tenant returns without raising
-- (run as a fresh user with NULL tenant_id)
SELECT assert_caller_has_no_tenant();
-- Expected: returns without error

-- Helper 2: assert_caller_has_no_tenant — user with tenant raises 42501
-- (run as an onboarded user)
SELECT assert_caller_has_no_tenant();
-- Expected: ERROR:  already_has_tenant: caller <uuid> already belongs to tenant <uuid> (SQLSTATE 42501)
```

**Estimated diff:** ~80 lines

**Dependencies:** none

---

## Task 2: Patch SECURITY DEFINER RPCs with tenant guard

**Work unit:** Add `PERFORM public.assert_caller_tenant(p_tenant_id);` as first executable statement to `registrar_labor`, `seed_tenant_insumos`, and `get_deviation_report`. Full `CREATE OR REPLACE` for each.

**Files:**
- `supabase/migrations/035_security_hardening.sql` (section 2 — append)

**Commit message:** `fix(db): add tenant guard to registrar_labor, seed_tenant_insumos, and get_deviation_report`

**Acceptance criteria:**
- [ ] `registrar_labor` raises `42501 tenant_mismatch` when called with a `p_tenant_id` the caller does not belong to
- [ ] `registrar_labor` succeeds when called with the caller's own tenant
- [ ] `seed_tenant_insumos` raises `42501 tenant_mismatch` for cross-tenant call
- [ ] `get_deviation_report` raises `42501 tenant_mismatch` for cross-tenant call

**Test steps:**
```sql
-- Cross-tenant rejection for registrar_labor
-- (sign in as user of tenant A; call registrar_labor with tenant B's UUID)
SELECT registrar_labor(
    p_tenant_id := '<tenant-B-uuid>',
    p_finca_id  := '<any-uuid>',
    p_lote_id   := '<any-uuid>',
    p_fecha     := CURRENT_DATE,
    p_tipo_labor:= 'Test',
    p_estado_fenologico := null,
    p_jornales  := 0,
    p_observaciones := null,
    p_insumos   := '[]'::jsonb,
    p_moneda    := 'ARS',
    p_tipo_cambio := 1,
    p_costo_jornales := 0,
    p_personal  := '[]'::jsonb
);
-- Expected: ERROR: tenant_mismatch (SQLSTATE 42501)

-- Same-tenant success for registrar_labor
SELECT registrar_labor(
    p_tenant_id := '<tenant-A-uuid>',
    p_finca_id  := '<finca-A-uuid>',
    p_lote_id   := '<lote-A-uuid>',
    p_fecha     := CURRENT_DATE,
    p_tipo_labor:= 'Riego',
    p_estado_fenologico := null,
    p_jornales  := 1,
    p_observaciones := 'Test',
    p_insumos   := '[]'::jsonb,
    p_moneda    := 'ARS',
    p_tipo_cambio := 1,
    p_costo_jornales := 0,
    p_personal  := '[]'::jsonb
);
-- Expected: returns {"id": <uuid>, "success": true}

-- Cross-tenant rejection for get_deviation_report
SELECT * FROM get_deviation_report(
    p_tenant_id := '<tenant-B-uuid>',
    p_anio := 2026,
    p_mes := NULL,
    p_tipo_cambio_ref := 1,
    p_moneda_salida := 'ARS'
);
-- Expected: ERROR: tenant_mismatch (SQLSTATE 42501)

-- Cross-tenant rejection for seed_tenant_insumos
SELECT seed_tenant_insumos('<tenant-B-uuid>');
-- Expected: ERROR: tenant_mismatch (SQLSTATE 42501)
```

**Estimated diff:** ~15 lines (3 × `PERFORM assert_caller_tenant(p_tenant_id);`)

**Dependencies:** Task 1 (helpers must exist before RPCs call them)

---

## Task 3: Patch create_owner_tenant with strict guard

**Work unit:** Add `PERFORM public.assert_caller_has_no_tenant();` as first executable statement to `create_owner_tenant`. `CREATE OR REPLACE`.

**Files:**
- `supabase/migrations/035_security_hardening.sql` (section 3 — append)

**Commit message:** `fix(db): add strict tenant guard to create_owner_tenant`

**Acceptance criteria:**
- [ ] `create_owner_tenant` raises `42501 already_has_tenant` when called by a user who already has a tenant
- [ ] `create_owner_tenant` succeeds for a user with `usuarios.tenant_id IS NULL`

**Test steps:**
```sql
-- Onboarded user attempts re-onboarding (should fail)
-- (sign in as a user already assigned to a tenant)
SELECT create_owner_tenant(
    tenant_name := 'Duplicate Tenant',
    finca_name  := 'Duplicate Finca',
    superficie  := 1,
    rendimiento := 1
);
-- Expected: ERROR: already_has_tenant (SQLSTATE 42501)
```

**Estimated diff:** ~3 lines

**Dependencies:** Task 1 (helper must exist)

---

## Task 4: Drop registrar_plantacion

**Work unit:** `DROP FUNCTION IF EXISTS public.registrar_plantacion(...)` with exact signature. Orphaned RPC (zero callers in `src/`); `plantaciones` writes go through direct INSERT in route.

**Files:**
- `supabase/migrations/035_security_hardening.sql` (section 4 — append)

**Commit message:** `fix(db): drop orphaned registrar_plantacion function`

**Acceptance criteria:**
- [ ] `\df public.registrar_plantacion` returns no rows
- [ ] `plantaciones` writes via direct INSERT in `src/app/api/produccion/plantaciones/route.ts` are unaffected

**Test steps:**
```sql
-- Verify function is gone
\df public.registrar_plantacion
-- Expected: No rows returned
```

**Estimated diff:** ~1 line (the DROP statement)

**Dependencies:** Task 1 (no functional dependency, but part of same migration; runs after helpers exist)

---

## Task 5: Rewrite registrar_almacigo with derived stock

**Work unit:** Full rewrite of `registrar_almacigo` per design: tenant guard → SERIALIZABLE → derived stock check (compras - almacigos - labores_insumos) → INSERT. Signature unchanged.

**Files:**
- `supabase/migrations/035_security_hardening.sql` (section 5 — append; replaces prior definition via `CREATE OR REPLACE`)

**Commit message:** `fix(db): rewrite registrar_almacigo with derived stock from ledger and SERIALIZABLE isolation`

**Acceptance criteria:**
- [ ] SOW with sufficient stock returns `{id, success: true}`
- [ ] SOW with insufficient seed stock raises `insufficient_stock_semilla` (errcode `23514`)
- [ ] SOW with insufficient substrate stock raises `insufficient_stock_sustrato` (errcode `23514`)
- [ ] SOW with mismatched tenant raises `42501 tenant_mismatch`
- [ ] `almacigos` row is created with correct `semilla_usada` and `sustrato_usado`
- [ ] Concurrent sows: exactly one succeeds; the other raises a serialization or stock error (no double-spend)

**Test steps:**
```sql
-- Precondition: have a seed insumo with 10 kg purchased (no prior consumption)
-- Sufficient stock: should succeed
SELECT registrar_almacigo(
    p_tenant_id          := '<tenant-uuid>',
    p_finca_id           := '<finca-uuid>',
    p_fecha              := CURRENT_DATE,
    p_variedad           := 'Tomato',
    p_cantidad_bandejas  := 100,
    p_insumo_semilla_id  := '<semilla-insumo-uuid>',
    p_semilla_usada      := 3,
    p_insumo_sustrato_id := '<sustrato-insumo-uuid>',
    p_sustrato_usado     := 20,
    p_observaciones      := 'Test'
);
-- Expected: {"id": <uuid>, "success": true}

-- Insufficient stock: should raise
SELECT registrar_almacigo(
    p_tenant_id          := '<tenant-uuid>',
    p_finca_id           := '<finca-uuid>',
    p_fecha              := CURRENT_DATE,
    p_variedad           := 'Tomato',
    p_cantidad_bandejas  := 100,
    p_insumo_semilla_id  := '<semilla-insumo-uuid>',
    p_semilla_usada      := 100,  -- exceeds available
    p_insumo_sustrato_id := null,
    p_sustrato_usado     := 0,
    p_observaciones      := 'Test'
);
-- Expected: ERROR: insufficient_stock_semilla: disponible 10, requerido 100 (SQLSTATE 23514)

-- Tenant mismatch: should raise 42501
SELECT registrar_almacigo(
    p_tenant_id          := '<other-tenant-uuid>',
    p_finca_id           := '<any-uuid>',
    p_fecha              := CURRENT_DATE,
    p_variedad           := 'Tomato',
    p_cantidad_bandejas  := 100,
    p_insumo_semilla_id  := '<semilla-insumo-uuid>',
    p_semilla_usada      := 1,
    p_insumo_sustrato_id := null,
    p_sustrato_usado     := 0,
    p_observaciones      := 'Test'
);
-- Expected: ERROR: tenant_mismatch (SQLSTATE 42501)
```

**Estimated diff:** ~90 lines (full rewrite)

**Dependencies:** Task 1 (helper must exist)

---

## Task 6 (Optional): Add 40001 serialization failure → HTTP 409 mapping

**Work unit:** In `src/app/api/produccion/almacigos/route.ts`, extend the catch block to detect `40001 serialization_failure` and return HTTP 409 with a user-friendly message.

**Files:**
- `src/app/api/produccion/almacigos/route.ts` (lines 96-101)

**Commit message:** `fix(api): map serialization_failure to HTTP 409 on almacigo creation`

**Acceptance criteria:**
- [ ] After applying, a concurrent-sow race returns HTTP 409 (not 500) with a message about simultaneous sowing
- [ ] Existing `Stock insuficiente` 409 behavior is unchanged

**Test steps:**
```sql
-- SQL-level concurrent test (run two identical calls simultaneously from two sessions):
SELECT registrar_almacigo(...);  -- same params, both sessions
-- Expected: exactly one succeeds, the other raises 40001 serialization_failure
-- The route maps this to HTTP 409 with message "Conflicto de stock con siembra simultánea, reintentar"
```

**Estimated diff:** ~10 lines

**Dependencies:** Task 5

---

## Task 7: End-to-end verification + build sanity

**Work unit:** Run all spec verification steps end-to-end, verify `npm run build` passes, commit migration 035 with all sections.

**Files:**
- `supabase/migrations/035_security_hardening.sql` (complete file with all sections)

**Commit message:** `chore(db): apply full security hardening migration 035`

**Acceptance criteria:**
- [ ] All SQL steps from Tasks 1–5 run without error in the Supabase SQL Editor
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] Migration 035 is committed as a single cohesive unit

**Test steps:**
```sql
-- Full end-to-end for registrar_almacigo (sufficiency)
-- 1. Check current stock
SELECT
    COALESCE((SELECT SUM(cantidad) FROM public.compras_insumos
             WHERE insumo_id = '<uuid>' AND tenant_id = '<tenant>'), 0)
  - COALESCE((SELECT SUM(semilla_usada) FROM public.almacigos
             WHERE insumo_semilla_id = '<uuid>' AND tenant_id = '<tenant>'), 0)
  - COALESCE((SELECT SUM(li.cantidad) FROM public.labores_insumos li
             JOIN public.labores l ON l.id = li.labor_id
             WHERE li.insumo_id = '<uuid>' AND l.tenant_id = '<tenant>'), 0)
AS disponible;

-- 2. SOW with exactly available amount
SELECT registrar_almacigo(...);

-- Cross-tenant rejection end-to-end
-- (sign in as tenant A user; call RPC with tenant B's ID)
SELECT registrar_labor(p_tenant_id := '<tenant-B>', ...);
-- Expected: 42501

-- create_owner_tenant guard
-- (sign in as onboarded user)
SELECT create_owner_tenant('x', 'y', 1, 1);
-- Expected: 42501 already_has_tenant
```

```bash
npm run build
```

**Estimated diff:** ~130 lines total (migration 035 cumulative)

**Dependencies:** Tasks 1–5 (and Task 6 if taken)

---

## Out of scope (tracked separately)

- `frontend-stock-display` — 3 forms (`almacigo-form.tsx`, `labor-form.tsx`, `cultivo-form.tsx`) show dropped `stock_actual`. Separate change.
- `labor-stock-derivation` — was incorrectly flagged; `registrar_labor` is fine on the backend (confirmed by reading migration 032 body — no `stock_actual` reference in executable code).
- Activation of custom access token hook (issue #3) — operational, by user.
- Issues #4 (console.log) and #5 (/admin guard) — separate cleanup changes.
- Vitest/Playwright — separate infrastructure change.
