# Change: security-hardening

## Why

Two critical issues from the 2026-06-19 audit. **(1)** Every `SECURITY DEFINER` RPC accepts a `p_tenant_id` parameter and runs as the function owner — bypassing RLS — but never verifies the caller's tenant matches. Any authenticated user can write to (or read from) any other tenant by passing an arbitrary UUID. **(2)** `registrar_almacigo` is dead-on-arrival: it references `insumos.stock_actual`, a column dropped in migration 025, so the RPC throws on every call. Without this fix the multi-tenant security model is broken and the entire sowing flow is non-functional. These are the top two issues ranked by the user on 2026-06-19 and must land before any real multi-tenant load.

## What changes

### SQL (one migration: `supabase/migrations/035_security_hardening.sql`)

- **New helper** `public.assert_caller_tenant(p_expected_tenant uuid) RETURNS void` — `SECURITY DEFINER`, `STABLE`, `SET search_path = public, auth`. Reads `auth.jwt() ->> 'tenant_id'` first (top-level claim set by the migration 033 hook — verified in `033_auth_hook_tenant_claim.sql` line 32 where the hook does `jsonb_set(claims, '{tenant_id}', ...)`), falls back to `SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()`. Raises `42501 insufficient_privilege` (errcode `tenant_mismatch`) if mismatch or NULL.
- **Apply `PERFORM public.assert_caller_tenant(p_tenant_id);`** as the first executable line of every RPC that takes a `p_tenant_id`:
  - `seed_tenant_insumos(uuid)` (migration 029)
  - `registrar_almacigo(...)` (migration 010, rewritten — see below)
  - `registrar_labor(...)` (migration 032)
  - `get_deviation_report(...)` (migration 031)
- **`create_owner_tenant(text, text, numeric, numeric)`** (migration 029) does NOT accept `p_tenant_id` — it bootstraps a new tenant for the caller. Apply a different guard: assert that the caller has no tenant yet (call `assert_caller_has_no_tenant()`) — or document that the existing design intentionally permits re-onboarding. See "Decisions needed" below.
- **Rewrite `registrar_almacigo(...)`**: keep signature identical (no caller changes needed). Body:
  1. `PERFORM public.assert_caller_tenant(p_tenant_id);`
  2. Compute derived stock: `SUM(compras_insumos.cantidad) - SUM(almacigos.semilla_usada|sustrato_usado for this insumo) - SUM(labores_insumos.cantidad for this insumo)` for the tenant, for each of `p_insumo_semilla_id` and `p_insumo_sustrato_id`.
  3. Raise `insufficient_stock_<semilla|sustrato>` if available < required.
  4. `INSERT INTO almacigos(...)` and return the id.
  5. Wrap the whole body in `BEGIN ... COMMIT` with `ISOLATION LEVEL SERIALIZABLE` to prevent two concurrent sows from both passing the stock check.
- **`DROP FUNCTION` (decision needed): `public.registrar_plantacion(...)`** — confirmed orphaned (grep returns 0 callers in `src/`). See "Decisions needed".

### Code

- `src/app/api/produccion/almacigos/route.ts` — no changes required; the RPC signature stays identical.
- No new tests — the project has no test infra (see `openspec/config.yaml: tdd: false`). Verification is manual SQL/UI.

## Impact

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/035_*.sql` | New | One migration creating the helper and modifying/rewriting 4–5 RPCs. |
| `public.assert_caller_tenant` | New | Reusable guard for all future SECURITY DEFINER RPCs. **This is the contract for downstream changes.** |
| `registrar_almacigo` | Rewritten | Same signature, new body. Caller API unchanged. |
| `seed_tenant_insumos`, `registrar_labor`, `get_deviation_report` | Patched | One added `PERFORM` line each. |
| `registrar_plantacion` | Decision needed | Delete or wire up — see below. |
| `src/app/api/produccion/almacigos/route.ts` | None | Signature-stable. |
| `src/components/forms/almacigo-form.tsx` | None (this change) | Still references `stock_actual` (lines 32, 191, 231). Client display is broken independently — tracked as a separate frontend change. |

**Risk if applied: low.** The helper is additive; existing correct callers (with matching tenant) pass. The `registrar_almacigo` rewrite preserves the same input/output contract.

**Risk if NOT applied: critical (data leak).** Cross-tenant writes are possible today with one crafted UUID. Sowing is completely non-functional.

## Out of scope

- Issue #3 (auth hook activation in Supabase Dashboard) — separate operational change, but **strongly recommended to land FIRST** so the helper's JWT fast path actually takes effect. Without it, the helper falls back to a DB read — still safe, but slower.
- Issue #4 (`console.log` regression in `next.config.mjs`) — separate cleanup.
- Issue #5 (`/admin` route without auth guard) — separate change.
- Frontend display of derived stock in `almacigo-form.tsx`, `labor-form.tsx`, `cultivo-form.tsx` (still reference dropped `stock_actual`) — separate change; needs a server-side derived-stock view/function that the forms can call.
- Adding Vitest/Playwright — separate change.
- Items in `TECHNICAL_DEBT.md` (per audit doc, ~20 items) — separate changes.

## Decisions needed (blocking sdd-spec)

1. **`registrar_plantacion` — delete or wire up?**
   - **Option A (recommended):** `DROP FUNCTION public.registrar_plantacion(...)` in the same migration. It's dead code; the table `plantaciones` is still populated by `src/app/api/produccion/plantaciones/route.ts` (direct INSERT, not via RPC — verified by grep). Keeping the RPC invites future misuse.
   - **Option B:** Keep the RPC, add the `assert_caller_tenant` call, and accept that it's currently dead code waiting for a future caller. Cheaper short-term, but accumulates debt.
   - **Default if no answer:** take Option A (delete). The audit doc flags it as orphaned, and the table writes are not RPC-based.

2. **`create_owner_tenant` guard — strict or relaxed?**
   - The current design allows any user (even with an existing tenant) to create a new tenant and be promoted to its admin. This orphans their original tenant. Is that the intended product behavior?
   - **Option A (recommended):** New helper `assert_caller_has_no_tenant()` raising `42501` if `usuarios.tenant_id IS NOT NULL` for the caller. Call it at the top of `create_owner_tenant`. Single-tenant SaaS assumption.
   - **Option B:** Leave as-is; the audit already calls out "user of tenant A creating tenant B" as the exploit, but it's actually a re-onboarding flow, not a cross-tenant write.
   - **Default if no answer:** take Option A (strict). The product is single-tenant per user; re-onboarding should require admin action, not be a one-click footgun.

3. **Stock-deduction atomicity for `registrar_almacigo` — where does the deduction live?**
   - The current pre-025 model mutated `insumos.stock_actual` in place. Post-025, stock is derived (purchases − consumption). Two design options for the new RPC:
     - **Option A (recommended):** Derive stock on the fly for the check, then `INSERT INTO almacigos`. The insert IS the consumption record. No new columns. Race-safe via `SERIALIZABLE` transaction.
     - **Option B:** Treat the almacigo insert + a negative `compras_insumos` row as the atomic stock decrement. More explicit ledger but pollutes `compras_insumos` with synthetic negatives.
   - **Default if no answer:** take Option A. Matches the existing pattern (consumption is implicit, not ledgered).

## Capabilities (contract with sdd-spec)

> This is the binding section for the next phase. `openspec/specs/` is currently empty (this is the first active change) — there are no pre-existing capabilities to modify.

### New Capabilities
- `multi-tenant-rpc-guards`: DB-level guarantee that every SECURITY DEFINER RPC validates the caller's tenant before mutating or reading. The single contract: `public.assert_caller_tenant(p_expected_tenant uuid) → void` (raises `42501` on mismatch).

### Modified Capabilities
- None (no existing specs yet).

## Verification plan

All verification is manual — no test infrastructure exists in this project.

1. **Cross-tenant write protection (the headline check):**
   - Create tenants A and B in `auth.users` + `usuarios`.
   - Sign in as user A.
   - From the SQL editor (impersonating A) run:
     ```sql
     SELECT registrar_labor(
       p_tenant_id := '<tenant B uuid>',
       p_finca_id  := '<any uuid>',
       p_lote_id   := '<any uuid>',
       p_fecha     := CURRENT_DATE,
       p_tipo_labor:= 'Test',
       p_estado_fenologico := null,
       p_jornales  := 0,
       p_observaciones := null,
       p_insumos   := '[]'::jsonb
     );
     ```
   - **Expected:** ERROR with SQLSTATE `42501` and message containing `tenant_mismatch`. No row inserted in B.
   - Repeat with A's own `p_tenant_id` — must succeed.
   - Repeat for `registrar_almacigo`, `seed_tenant_insumos`, `get_deviation_report`.

2. **`registrar_almacigo` end-to-end:**
   - Seed compras for a semilla insumo (10 kg purchased) and a sustrato insumo (50 L purchased).
   - SOW with `p_semilla_usada = 3, p_sustrato_usado = 20` → must succeed, return `{id, success: true}`.
   - SOW with `p_semilla_usada = 100` → must raise `insufficient_stock_semilla` (mapped to HTTP 409 in `route.ts`).
   - Verify `almacigos` row was created with the right `semilla_usada` and `sustrato_usado`.

3. **No regression in existing flows:**
   - Create a new tenant via `create_owner_tenant` — must still complete (and assert the guard chosen for decision #2 above).
   - `get_deviation_report` returns the same shape as before for the caller's own tenant.
   - `registrar_labor` flow (existing UI) inserts labor rows as before.

4. **Build sanity:**
   - `npm run build` (configured in `openspec/config.yaml`) must pass — the proposal touches no TS code, but verify.

## Rollback plan

- The migration is forward-only (Postgres has no transactional DDL for `CREATE OR REPLACE FUNCTION`), but the change is reversible:
  - **Helper:** `DROP FUNCTION public.assert_caller_tenant(uuid);` — harmless, no callers depend on it.
  - **RPC patches:** `CREATE OR REPLACE FUNCTION` for each of the 4 patched RPCs — restore the previous body from git (`git show HEAD:supabase/migrations/0XX_*.sql`).
  - **`registrar_almacigo` rewrite:** restore the migration 010 body from git. The column `stock_actual` no longer exists, so this RPC will be broken in the rollback state — but the rest of the system is unchanged.
- Net effect of a rollback: back to the pre-change state (cross-tenant writes possible, `registrar_almacigo` broken). Safe and reversible within ~5 minutes of SQL work.

## Dependencies

- **Strongly recommended prerequisite:** Issue #3 (activate the custom access token hook in the Supabase Dashboard) so the helper's JWT fast path actually fires. Without it, the helper does a fallback DB read on every RPC call — still safe, just slower. Does not block this change.
- **Related debt surfaced during design:** `registrar_labor` (migration 032) was incorrectly flagged in the audit as referencing the dropped `stock_actual` column. **Design-phase verification (reading migration 032 line by line) confirms this is FALSE** — the function body has no `stock_actual` reference; the only mention is in a code comment noting its removal. The RPC is fine on the backend side. The original audit concern applies to the **frontend only** (3 forms — `almacigo-form.tsx`, `labor-form.tsx`, `cultivo-form.tsx` — still reference `stock_actual` for display). Tracked as a separate frontend change: `frontend-stock-display`.
- No external packages, no API contract changes, no schema changes.
