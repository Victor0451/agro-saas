# Design: security-hardening

## Context

Two critical issues from the 2026-06-19 audit: **(1)** every `SECURITY DEFINER` RPC accepts `p_tenant_id` and runs as the function owner, bypassing RLS, but never validates the caller's tenant — any authenticated user can read/write any tenant. **(2)** `registrar_almacigo` is dead-on-arrival: it references `insumos.stock_actual`, dropped in migration 025, so every call throws. This change lands the multi-tenant security boundary and restores the sowing flow. See `proposal.md` (corrected post-spec) and `specs/multi-tenant-rpc-guards/spec.md`.

**Spec→proposal correction applied:** JWT `tenant_id` claim is **top-level** (set by migration 033 hook via `jsonb_set(claims, '{tenant_id}', ...)`), so the helper reads `auth.jwt() ->> 'tenant_id'`, not `auth.jwt() -> 'app_metadata' ->> 'tenant_id'`. Verified in `supabase/migrations/033_auth_hook_tenant_claim.sql:32`.

## Architecture

### Helper functions

#### `public.assert_caller_tenant(p_expected_tenant uuid) RETURNS void`

```sql
CREATE OR REPLACE FUNCTION public.assert_caller_tenant(p_expected_tenant uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
DECLARE
  v_jwt_claim uuid;
  v_db_tenant uuid;
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'tenant_mismatch: no authenticated user'
      USING ERRCODE = '42501';
  END IF;

  BEGIN
    v_jwt_claim := (auth.jwt() ->> 'tenant_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_jwt_claim := NULL;
  END;

  IF v_jwt_claim IS NULL THEN
    SELECT tenant_id INTO v_db_tenant
    FROM public.usuarios
    WHERE id = v_caller;
  END IF;

  IF COALESCE(v_jwt_claim, v_db_tenant) IS DISTINCT FROM p_expected_tenant THEN
    RAISE EXCEPTION 'tenant_mismatch: caller % does not belong to tenant %',
      v_caller, p_expected_tenant
      USING ERRCODE = '42501';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assert_caller_tenant(uuid) TO authenticated;
```

**Why STABLE:** JWT claim is stable within a transaction; the DB fallback is a single PK SELECT.
**Why SECURITY DEFINER:** reads `usuarios` even if caller's RLS would block it.
**Why SET search_path = public, auth:** prevent search-path hijacking (per Supabase best practice).
**Why BEGIN/EXCEPTION around the cast:** a malformed `tenant_id` claim must not crash the helper — treat as "no claim" and fall back to DB.

#### `public.assert_caller_has_no_tenant() RETURNS void`

```sql
CREATE OR REPLACE FUNCTION public.assert_caller_has_no_tenant()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_tenant uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'already_has_tenant: no authenticated user'
      USING ERRCODE = '42501';
  END IF;
  SELECT tenant_id INTO v_tenant FROM public.usuarios WHERE id = v_caller;
  IF v_tenant IS NOT NULL THEN
    RAISE EXCEPTION 'already_has_tenant: caller % already belongs to tenant %',
      v_caller, v_tenant
      USING ERRCODE = '42501';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assert_caller_has_no_tenant() TO authenticated;
```

### Migration: `supabase/migrations/035_security_hardening.sql`

Order matters (helpers must exist before callers reference them):

1. `CREATE OR REPLACE FUNCTION public.assert_caller_tenant(uuid)` — helper first.
2. `CREATE OR REPLACE FUNCTION public.assert_caller_has_no_tenant()` — sibling helper.
3. `DROP FUNCTION IF EXISTS public.registrar_plantacion(...)` — orphan cleanup (verified zero callers in `src/`; only match is its own definition at `013_plantacion_stock.sql:9` and our proposal/spec docs).
4. `CREATE OR REPLACE FUNCTION public.registrar_labor(...)` — patched with `PERFORM public.assert_caller_tenant(p_tenant_id);` as first executable statement. **No body changes.**
5. `CREATE OR REPLACE FUNCTION public.seed_tenant_insumos(uuid)` — patched with `PERFORM public.assert_caller_tenant(p_tenant_id);`.
6. `CREATE OR REPLACE FUNCTION public.get_deviation_report(...)` — patched with `PERFORM public.assert_caller_tenant(p_tenant_id);`.
7. `CREATE OR REPLACE FUNCTION public.create_owner_tenant(text, text, numeric, numeric)` — patched with `PERFORM public.assert_caller_has_no_tenant();` as first executable statement.
8. `CREATE OR REPLACE FUNCTION public.registrar_almacigo(...)` — **full rewrite** preserving signature.

#### `registrar_almacigo` rewrite (signature preserved)

```sql
CREATE OR REPLACE FUNCTION public.registrar_almacigo(
  p_tenant_id          uuid,
  p_finca_id           uuid,
  p_fecha              date,
  p_variedad           varchar,
  p_cantidad_bandejas  integer,
  p_insumo_semilla_id  uuid,
  p_semilla_usada      decimal,
  p_insumo_sustrato_id uuid,
  p_sustrato_usado     decimal,
  p_observaciones      text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id         uuid;
  v_stock_semilla  decimal;
  v_stock_sustrato decimal;
BEGIN
  -- 1. Tenant guard (raises 42501 on mismatch)
  PERFORM public.assert_caller_tenant(p_tenant_id);

  -- 2. SERIALIZABLE: the SET below applies to the next transaction only;
  --    the function body runs inside that single transaction.
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

  -- 3. Derived stock for semilla
  --    available = purchases - previous almacigo consumption - labor consumption
  SELECT
      COALESCE((SELECT SUM(cantidad) FROM public.compras_insumos
                 WHERE insumo_id = p_insumo_semilla_id AND tenant_id = p_tenant_id), 0)
    - COALESCE((SELECT SUM(semilla_usada) FROM public.almacigos
                 WHERE insumo_semilla_id = p_insumo_semilla_id AND tenant_id = p_tenant_id), 0)
    - COALESCE((SELECT SUM(li.cantidad) FROM public.labores_insumos li
                 JOIN public.labores l ON l.id = li.labor_id
                 WHERE li.insumo_id = p_insumo_semilla_id AND l.tenant_id = p_tenant_id), 0)
    INTO v_stock_semilla;

  IF v_stock_semilla IS NULL OR v_stock_semilla < p_semilla_usada THEN
    RAISE EXCEPTION 'insufficient_stock_semilla: disponible %, requerido %',
      COALESCE(v_stock_semilla, 0), p_semilla_usada
      USING ERRCODE = '23514';  -- check_violation
  END IF;

  -- 4. Derived stock for sustrato (only when provided)
  IF p_insumo_sustrato_id IS NOT NULL AND p_sustrato_usado > 0 THEN
    SELECT
        COALESCE((SELECT SUM(cantidad) FROM public.compras_insumos
                   WHERE insumo_id = p_insumo_sustrato_id AND tenant_id = p_tenant_id), 0)
      - COALESCE((SELECT SUM(sustrato_usado) FROM public.almacigos
                   WHERE insumo_sustrato_id = p_insumo_sustrato_id AND tenant_id = p_tenant_id), 0)
      - COALESCE((SELECT SUM(li.cantidad) FROM public.labores_insumos li
                   JOIN public.labores l ON l.id = li.labor_id
                   WHERE li.insumo_id = p_insumo_sustrato_id AND l.tenant_id = p_tenant_id), 0)
      INTO v_stock_sustrato;

    IF v_stock_sustrato IS NULL OR v_stock_sustrato < p_sustrato_usado THEN
      RAISE EXCEPTION 'insufficient_stock_sustrato: disponible %, requerido %',
        COALESCE(v_stock_sustrato, 0), p_sustrato_usado
        USING ERRCODE = '23514';
    END IF;
  END IF;

  -- 5. Insert — the almacigos row IS the consumption record (no separate ledger)
  INSERT INTO public.almacigos (
      tenant_id, finca_id, fecha, variedad, cantidad_bandejas,
      insumo_semilla_id, semilla_usada,
      insumo_sustrato_id, sustrato_usado,
      observaciones
  ) VALUES (
      p_tenant_id, p_finca_id, p_fecha, p_variedad, p_cantidad_bandejas,
      p_insumo_semilla_id, p_semilla_usada,
      p_insumo_sustrato_id, p_sustrato_usado,
      p_observaciones
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('id', v_new_id, 'success', true);
END;
$$;
```

**Why SERIALIZABLE:** under READ COMMITTED, two concurrent sows can both read stock = 10 and both pass the check (race). SERIALIZABLE serializes the read set so the second transaction aborts with `40001 serialization_failure`. The route's existing try/catch surfaces the error. **Why errcode 23514 (check_violation) instead of 42501:** `42501` is reserved for privilege errors — using it for business validation muddies the meaning. `route.ts:98` already keys off the message string (`includes('Stock insuficiente')`); update to also key on errcode in the catch path (see "Code changes").

**Why no stock counter column:** post-025 the `insumos` table is a catalog, not inventory. Consumption is implicit in `almacigos` and `labores_insumos` rows.

### Code changes

**Expected: none.** All caller APIs (signatures + return shapes) are unchanged:

| RPC | Caller | Tenant source |
|---|---|---|
| `registrar_almacigo` | `src/app/api/produccion/almacigos/route.ts:66` | `usuarios.tenant_id` |
| `registrar_labor` | `src/app/api/produccion/cultivo/route.ts:56` | `usuarios.tenant_id` |
| `get_deviation_report` | `src/app/api/insumos/informe/route.ts:37` | `usuarios.tenant_id` |
| `create_owner_tenant` | `src/app/api/tenants/create/route.ts:18` | n/a — bootstraps new tenant |
| `seed_tenant_insumos` | called internally by `create_owner_tenant` (029:85) and a backfill loop (029:107) | n/a |

**Exception to verify (already done):** `grep -rn registrar_plantacion` returns zero hits in `src/` — confirmed via codebase search. The only matches are `013_plantacion_stock.sql:9` (the function definition itself) and our proposal/spec docs.

**Recommended small TS change (not strictly required, but improves UX):** in `src/app/api/produccion/almacigos/route.ts:96-100`, also detect `40001 serialization_failure` and return HTTP 409 with a localized "Conflicto de stock con siembra simultánea, reintentar" message. Current code returns 500 for non-`Stock insuficiente` errors. Flag in `tasks` as optional.

### Deployment order

1. **Pre-deploy (operational, by user — not in this change):** activate the custom access token hook in Supabase Dashboard (issue #3 in `Issues/CRITICAL_ISSUES_2026-06-19.md`). Without this, the helper's fast path never fires but the DB fallback keeps the guard correct.
2. **Apply migration `035_security_hardening.sql`** via Supabase SQL Editor or CLI.
3. **Verify** with the manual SQL tests in the spec.

### Rollback plan

| Action | SQL |
|---|---|
| Drop helpers | `DROP FUNCTION public.assert_caller_tenant(uuid);`<br>`DROP FUNCTION public.assert_caller_has_no_tenant();` |
| Restore old RPC body | `CREATE OR REPLACE FUNCTION <rpc_name>(...);` from git (`git show HEAD:supabase/migrations/0XX_*.sql`) |
| Restore `registrar_almacigo` | From `git show HEAD:supabase/migrations/010_almacigos_finca_update.sql` — note: rollback state has the broken `stock_actual` reference (matches current broken behavior). |
| Restore `registrar_plantacion` | From `git show HEAD:supabase/migrations/013_plantacion_stock.sql`. |

Rollback target state: identical to pre-change state. Reversible in ~5 minutes of SQL work.

## Out of scope (tracked separately)

- Frontend display of derived stock in `almacigo-form.tsx`, `labor-form.tsx`, `cultivo-form.tsx` (still references `stock_actual`).
- Activation of custom access token hook (operational, by user).
- Issues #4 (`console.log` regression) and #5 (`/admin` route guard) from the audit.
- Adding Vitest/Playwright test infrastructure.
- Items in `TECHNICAL_DEBT.md`.

## Risk analysis

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| SERIALIZABLE causes unexpected `40001` in `route.ts` | Medium | Low | Existing try/catch returns 500 today. **Recommended:** add explicit 409 mapping in `tasks` (see "Code changes"). |
| Helper slow path always fires (hook not activated) | Low | Low | DB fallback is safe; one PK SELECT per call. Document in DEPLOY.md. |
| `create_owner_tenant` strict guard breaks an existing flow | Low | Medium | Verified caller `src/app/api/tenants/create/route.ts:18` and `src/app/onboarding/page.tsx:43` only call this from the onboarding page — UI flow expects new user with `tenant_id IS NULL`. Safe. |
| Migration breaks if a tenant row has NULL `tenant_id` | Low | High | Helper handles NULL gracefully (raises `tenant_mismatch`). Covered by spec scenario. |
| Long SERIALIZABLE transactions hold locks | Low | Medium | Body is two reads + one INSERT — sub-millisecond. Per Supabase `lock-short-transactions`: keep statement_timeout reasonable in `postgrest.conf` (Supabase default is fine). |
| **`registrar_labor` "out of scope" justification is wrong** | — | — | **See "Contradictions" below — this follow-up change appears unnecessary.** |

## Contradictions with proposal/spec (flag for user review)

**The proposal and spec both claim `registrar_labor` (migration 032) "references the dropped `insumos.stock_actual` column"** and propose a follow-up change `labor-stock-derivation`. **This claim is factually wrong based on the current code.** Verification:

- `grep stock_actual supabase/migrations/032_fix_registrar_labor_atomic.sql` returns exactly **one** match — a code comment on line 7: `-- 3. Stock check referenced insumos.stock_actual which was dropped in migration 025.` followed by `-- Removed — insumos is now a catalog, not an inventory tracker.`
- The function body (lines 10–89) does an existence check on `insumos` (`IF NOT EXISTS (SELECT 1 FROM insumos WHERE id = ... AND tenant_id = ...)`) and inserts into `labores_insumos`. There is **no** `stock_actual` reference anywhere in the executable code.
- The `stock_actual` reference was in the original `registrar_labor` defined in `migration 014` (lines 73, 92, 99, 103), which was already replaced by migration 032.

**Implication:** the `labor-stock-derivation` follow-up change (proposal line 135, spec lines 135-141) does not appear to be needed for the reason stated. `registrar_labor` today does NOT consume stock — it just records labor and which insumos were used (the consumption is implicit in `labores_insumos.cantidad`, the same model used for `almacigos`). The follow-up might still be desired for *frontend* stock display (which is already listed as out-of-scope for this change under a different justification), but the "dead RPC" framing is incorrect.

**Action requested from user before tasks phase:** confirm whether the `labor-stock-derivation` follow-up should be:
- (a) Dropped entirely (no work needed — `registrar_labor` is already correct), or
- (b) Renamed/repurposed to address the frontend display issue (separate from this change's scope), or
- (c) Kept as-is in the proposal with the corrected justification.

This is surfaced here rather than silently propagated.
