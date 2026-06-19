import * as z from "zod"

export const CURRENCIES = [
    { value: 'ARS', label: 'Pesos (ARS)' },
    { value: 'USD', label: 'Dólar (USD)' },
] as const

export const insumoSchema = z.object({
    nombre: z.string().min(2, "El nombre es obligatorio"),
    categoria_id: z.string().uuid("Debe seleccionar una categoría"),
    unidad: z.string().min(1, "La unidad es obligatoria"),
    costo_unitario: z.coerce.number().min(0, "El costo no puede ser negativo"),
    stock_actual: z.coerce.number().min(0).default(0),
    activo: z.boolean().default(true),
    moneda: z.enum(['ARS', 'USD']).default('ARS'),
    tipo_cambio: z.coerce.number().positive("El tipo de cambio debe ser positivo").default(1),
    fecha_compra: z.coerce.date().default(() => new Date()),
})

export type InsumoFormValues = z.infer<typeof insumoSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Schemas for the Insumos management module (Compras / Presupuesto / Updates).
// Schema names match imports from src/components/forms and src/app/api/insumos.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schema for creating a new CompraInsumo (purchase ledger entry).
 * Inserted into `compras_insumos` table. tenant_id is added server-side.
 */
export const CreateCompraSchema = z.object({
    insumo_id: z.string().uuid("Debe seleccionar un insumo"),
    fecha_compra: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)")
        .refine((d) => d <= new Date().toISOString().split('T')[0], {
            message: "La fecha de compra no puede ser futura",
        }),
    cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0").multipleOf(0.001),
    costo_unitario: z.coerce.number().positive("El costo unitario debe ser mayor a 0").multipleOf(0.01),
    moneda: z.enum(['ARS', 'USD']),
    tipo_cambio: z.coerce.number().positive("El tipo de cambio debe ser positivo"),
    notas: z.string().max(500, "Las notas no pueden superar los 500 caracteres").optional().default(""),
})

export type CreateCompraInput = z.infer<typeof CreateCompraSchema>

/**
 * Schema for creating a new PresupuestoInsumo (budget entry).
 * Either categoria_id or insumo_id may be set; periodo_mes null = annual budget.
 */
export const CreatePresupuestoSchema = z.object({
    categoria_id: z.string().uuid("Debe seleccionar una categoría"),
    insumo_id: z.string().uuid("Insumo inválido").nullable().optional(),
    periodo_mes: z.coerce.number().int().min(1).max(12).nullable().optional(),
    periodo_anio: z.coerce.number().int().min(2020).max(2100),
    monto_presupuestado: z.coerce.number().positive("El monto debe ser mayor a 0").multipleOf(0.01),
    moneda: z.enum(['ARS', 'USD']),
})

export type CreatePresupuestoInput = z.infer<typeof CreatePresupuestoSchema>

/**
 * Update schema for presupuesto. All fields optional — supports partial updates.
 */
export const UpdatePresupuestoSchema = CreatePresupuestoSchema.partial()

/**
 * Schema for updating an Insumo (tenant-scoped). Partial updates supported
 * (only the fields passed are validated and updated).
 */
export const UpdateInsumoSchema = z.object({
    nombre: z.string().min(2, "El nombre es obligatorio").optional(),
    unidad: z.string().min(1, "La unidad es obligatoria").optional(),
    categoria_id: z.string().uuid("Debe seleccionar una categoría").optional(),
    stock_minimo: z.coerce.number().min(0, "El stock mínimo no puede ser negativo").optional(),
    activo: z.boolean().optional(),
})

export type UpdateInsumoInput = z.infer<typeof UpdateInsumoSchema>

/**
 * Returns a reasonable default `stock_minimo` value for a given unit.
 * Heuristic: bulk-measured units (kg, L, tn) start at 10; countable units (u, semilla)
 * start at 1; fallback is 1.
 */
export function stockMinimoDefault(unidad: string): number {
    const u = unidad.toLowerCase().trim()
    if (['kg', 'l', 'lt', 'tn', 'qq'].includes(u)) return 10
    if (['g', 'ml', 'cc'].includes(u)) return 100
    return 1
}
