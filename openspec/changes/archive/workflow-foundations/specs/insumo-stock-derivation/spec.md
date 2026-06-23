# Spec: insumo-stock-derivation

> Delta spec for change `workflow-foundations`. After archive, becomes canonical at `openspec/specs/insumo-stock-derivation/spec.md`.

## Purpose

The Labor form SHALL show the operator the current derived stock of the selected insumo, computed from the compras ledger minus the labores consumption, so the operator does not need to switch to the Insumos module to check stock before recording a labor.

## Requirements

### Requirement: calcularStock helper
The system SHALL provide `calcularStock(insumo_id: string, tenant_id: string): Promise<number>` in `src/lib/services/stock.ts`, returning stock as `SUM(compras_insumos.cantidad) − SUM(labores_insumos.cantidad)` for the given insumo scoped to the given tenant.

#### Scenario: insumo with purchases and no consumption
- GIVEN the insumo has 50 kg of purchases and 0 consumption in `labores_insumos`
- WHEN `calcularStock(insumo_id, tenant_id)` is called
- THEN it returns 50

#### Scenario: insumo with purchases and consumption
- GIVEN the insumo has 50 kg of purchases and 12 kg of labor consumption
- WHEN `calcularStock(insumo_id, tenant_id)` is called
- THEN it returns 38

#### Scenario: insumo with no purchases
- GIVEN the insumo has 0 purchases
- WHEN `calcularStock(insumo_id, tenant_id)` is called
- THEN it returns 0 (never negative; the compras CHECK constraint also prevents negative purchases)

#### Scenario: tenant isolation
- GIVEN `calcularStock` is called with `tenant_id = X`
- WHEN it queries `compras_insumos` and `labores_insumos`
- THEN both queries filter by `tenant_id` matching `X`

#### Scenario: unknown insumo
- GIVEN `insumo_id` does not exist or has no ledger entries
- WHEN `calcularStock(insumo_id, tenant_id)` is called
- THEN it returns 0 (no error thrown)

### Requirement: Labor form shows current stock
The Labor form SHALL display the current stock of the selected insumo directly under the quantity input, formatted as `Stock actual: {n} {unidad}`.

#### Scenario: stock is visible after selection
- GIVEN the user is filling the Labor form
- AND they have selected an insumo in the insumos field-array
- WHEN the form renders
- THEN "Stock actual: {n} {unidad}" is visible directly under the quantity input

#### Scenario: stock updates per selection
- GIVEN the user changes the selected insumo in a row
- WHEN the form re-renders
- THEN the displayed stock updates to the new insumo's derived value

#### Scenario: stock not shown when no insumo selected
- GIVEN the user has not yet selected an insumo in a row
- WHEN the form renders
- THEN no "Stock actual" line is shown for that row

### Requirement: page server component computes stock
The `src/app/(dashboard)/produccion/cultivo/page.tsx` server component SHALL compute the stock for every insumo available to the tenant in its initial render and SHALL pass a `stockByInsumo: Record<string, { stock: number; unidad: string }>` map to the Labor form as a prop.

#### Scenario: stock map is built server-side
- GIVEN the page renders
- WHEN it queries the tenant's insumos
- THEN it iterates the result and calls `calcularStock` for each insumo
- AND the resulting map is passed to the form as a prop

#### Scenario: no client-side fetch waterfall
- GIVEN the page is rendered
- WHEN the user inspects the initial server-rendered HTML or the Network panel
- THEN the stock values are present in the initial server-rendered output (not loaded via a client-side `useEffect` fetch on insumo change)

#### Scenario: stock reflects page load
- GIVEN the page is rendered at time T
- WHEN the user inspects the stock values
- THEN they reflect the state of compras and labores at time T (acceptable "as of page load" semantics)
