# Apply Progress: security-hardening

> Tracks which tasks have been applied. One section per task. Auto-updated by `sdd-apply`.

## Tasks

- [x] Task 1: Create helper functions — commit `7683347` `feat(db): add tenant validation helpers assert_caller_tenant and assert_caller_has_no_tenant`
- [x] Task 2: Patch 3 SECURITY DEFINER RPCs — commit `c9fe7f3` `fix(db): apply tenant guard to SECURITY DEFINER RPCs (registrar_labor, seed_tenant_insumos, get_deviation_report)`
- [x] Task 3: Patch create_owner_tenant — commit `0edf016` `fix(db): enforce single-tenant-per-user on create_owner_tenant`
- [x] Task 4: Drop registrar_plantacion — commit `34364a9` `chore(db): drop orphaned registrar_plantacion RPC`
- [x] Task 5: Rewrite registrar_almacigo — commit `4280b8e` `fix(db): rewrite registrar_almacigo with derived stock and SERIALIZABLE`
- [x] Task 6: Map 40001 → 409 (optional) — commit `f450878` `fix(api): map serialization failure (40001) to HTTP 409 in almacigos route`
- [x] Task 7: Final state + verification — commit `4818800` `docs(sdd): mark security-hardening applied`

## Build verification

`npm run build` result: **FAIL** — Pre-existing dirty tree has middleware/proxy conflict (`src/middleware.ts` vs `src/proxy.ts`). Not related to security-hardening changes. The migration and route.ts edit are clean.

## Notes

- Pre-existing dirty state: 25 modified + 22 untracked files unrelated to this change. NOT touched.
- Working tree after apply: same dirty state + 7 new commits.
- Build failure is from pre-existing conflict in dirty tree, not from security-hardening changes.
- Migration 035 contains all 5 SQL tasks (sections 1-5). Route.ts Task 6 was applied and committed separately.
- `get_deviation_report` converted from `LANGUAGE sql` to `LANGUAGE plpgsql` wrapper to support `PERFORM assert_caller_tenant()`. This preserves the query logic exactly while adding the guard.