# Verify Report: workflow-foundations

**Date:** 2026-06-23
**Status:** ✅ PASS

## Build verification
`npm run build`: **PASS** — compiled successfully in 27.7s. No TypeScript errors, all 42 static/dynamic routes generated. The auth pages (`/login`, `/register`, `/auth/reset-password`, `/onboarding`) are unaffected — they live outside the `(dashboard)` layout and are not touched by this change.

---

## Spec coverage

### Spec: workflow-breadcrumb

| Requirement | Scenario | Status | Evidence |
|---|---|---|---|
| breadcrumb component | dashboard route has breadcrumb | ✅ | `layout.tsx:185` mounts `<Breadcrumb />` inside `<main>` |
| breadcrumb component | nested route has full path | ✅ | `breadcrumb.tsx:16-23` maps segments via ROUTES; `layout.tsx:185` mounts it above `{children}` |
| breadcrumb component | deep route has full chain | ✅ | Same — full chain built by `.map()` over segments |
| breadcrumb component | last segment is not clickable | ✅ | `breadcrumb.tsx:54-55` — `isLast ? <span className="font-medium text-foreground">` (no Link) |
| breadcrumb component | previous segments are clickable | ✅ | `breadcrumb.tsx:57-62` — non-last wrapped in `<Link href={crumb.href}>` |
| breadcrumb component | route not in config degrades gracefully | ✅ | `breadcrumb.tsx:19` — fallback: `segment.charAt(0).toUpperCase() + segment.slice(1)`, no crash |
| route config | routes constant exists | ✅ | `routes.ts:5` exports named `ROUTES` |
| route config | routes constant shape | ✅ | Each entry: `{ label: string; parent?: string }` — matches spec |
| route config | routes constant covers all dashboard paths | ✅ | All 18 required keys present: `dashboard`, `produccion`, `cultivo`, `insumos`, `compras`, `historial`, `presupuesto`, `informe`, `personal`, `liquidacion`, `almacigos`, `plantacion`, `cosecha`, `curado`, `estufas`, `fincas`, `lotes`, `reportes` |
| /reportes link is disabled | desktop sidebar disabled | ✅ | `layout.tsx:103-109` — `<span aria-disabled="true" className="text-muted-foreground/50 cursor-not-allowed">` |
| /reportes link is disabled | mobile Sheet disabled | ✅ | `layout.tsx:166-172` — same treatment, `mx-[-0.65rem]` pattern matching Sheet style |
| /reportes link is disabled | disabled item does not navigate | ✅ | `<span>` tag (no `href`, no `onClick`) — fully inert |

### Spec: insumo-stock-derivation

| Requirement | Scenario | Status | Evidence |
|---|---|---|---|
| calcularStock helper | insumo with purchases and no consumption | ✅ | `stock.ts:21-24` — sum of compras returned as-is |
| calcularStock helper | insumo with purchases and consumption | ✅ | `stock.ts:38` — `Math.max(0, totalCompras - totalConsumos)` |
| calcularStock helper | insumo with no purchases | ✅ | `stock.ts:24` — `?? 0` fallback; result 0 |
| calcularStock helper | tenant isolation | ✅ | `stock.ts:19` `.eq("tenant_id", tenant_id)` on compras; `stock.ts:31` `.eq("labores!inner.tenant_id", tenant_id)` on labors |
| calcularStock helper | unknown insumo | ✅ | No throw — `reduce` over null/undefined yields 0 |
| Labor form shows current stock | stock is visible after selection | ✅ | `labor-form.tsx:508-519` — `stockData` from `stockByInsumo[selectedInsumoId]`; renders `<p className="text-[10px] text-muted-foreground mt-1">Stock actual: …` |
| Labor form shows current stock | stock updates per selection | ✅ | `labor-form.tsx:508` — `form.watch(\`insumos.${index}.insumo_id\`)` re-renders on change |
| Labor form shows current stock | stock not shown when no insumo selected | ✅ | `labor-form.tsx:509` — `stockData` is null/falsy when no insumo selected; conditional render on line 515 |
| page server component computes stock | stock map is built server-side | ✅ | `cultivo/page.tsx:56-59` — `for (const insumo of insumos)` iterates and calls `calcularStock` per insumo |
| page server component computes stock | no client-side fetch waterfall | ✅ | `cultivo/page.tsx:15-62` — all stock computation is in RSC; `stockByInsumo` passed as prop to `<LaborManager>` |
| page server component computes stock | stock reflects page load | ✅ | Computed at RSC render time (dynamic = force-dynamic); "as of page load" semantics per spec |

---

## Regressions

- **Auth / onboarding pages** — `/login`, `/register`, `/onboarding`, `/auth/reset-password` are outside `(dashboard)` layout. Not touched by this change. ✅
- **FincaSwitcher** — `layout.tsx:52` unchanged; `FincaProvider` still wraps full layout. ✅
- **Other dashboard pages** — all routes build successfully (build output confirms `/fincas`, `/lotes`, `/insumos`, `/produccion`, `/personal`, `/personal/liquidacion`, `/produccion/*` all present). ✅
- **Labor form submit flow** — `labor-form.tsx:215-255` `onSubmit` unchanged; `stockByInsumo` is a new prop with default `{}`, does not affect validation. ✅
- **SelectItem fix (AD-9)** — `labor-form.tsx:494-496`: now renders `{i.nombre} ({i.unidad})` instead of broken `{i.nombre} ({i.stock_actual} {i.unidad})`. ✅

---

## Findings

### CRITICAL
- **(none)** — all 22 spec scenarios pass.

### WARNING
- **(none)** — no implementation concerns found.

### SUGGESTION
- **N+1 query pattern documented but not addressed** (`cultivo/page.tsx:56-59`): each `calcularStock` call fires 2 queries (compras + labores). For a tenant with many insumos this could be slow. The design already acknowledges this (AD-1, medium probability / low impact). A future batch RPC or `vw_stock_actual` view would fix it. Not blocking for archive.
- **Stock display uses `toFixed(2)`** (`labor-form.tsx:517`): this produces strings like `Stock actual: 38.00 kg` even when the value is a whole number. The spec format `Stock actual: {n} {unidad}` does not mandate decimal precision. Minor visual polish — not blocking.

---

## Manual verification steps for the user

1. Open `/dashboard` — breadcrumb shows "Inicio" with Home icon
2. Open `/produccion/cultivo` — breadcrumb shows "Inicio > Producción > Cultivo"
3. Open `/insumos/compras/historial` — breadcrumb shows "Inicio > Insumos > Compras > Historial"
4. Navigate to an unknown route like `/foo/bar` — breadcrumb gracefully shows only "Inicio" (no crash, no broken label)
5. Desktop sidebar: "Reportes · próximamente" is shown in muted gray (`text-muted-foreground/50`) and is not clickable
6. Mobile: open hamburger menu — same disabled Reportes treatment visible
7. Open `/produccion/cultivo` → "Registrar Nueva Labor" → add an insumo row → select an insumo → "Stock actual: X.XX kg" (or relevant unidad) appears below the quantity input
8. Change the selected insumo to another → stock line updates

---

## Conclusion

All 22 spec scenarios pass. Build is clean. No regressions detected. The two suggestions (N+1 query and `toFixed(2)` formatting) are minor and do not block archive.

**Status: verified — ready for `sdd-archive`.**
