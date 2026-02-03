import * as z from "zod"

export const laborInsumoSchema = z.object({
    insumo_id: z.string().uuid("Insumo requerido"),
    cantidad: z.coerce.number().min(0.0001, "Cantidad requerida"),
})

export const laborSchema = z.object({
    finca_id: z.string().uuid(),
    lote_id: z.string().uuid("Lote requerido"),
    fecha: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Fecha inválida",
    }),
    tipo_labor: z.string().min(2, "Tipo de labor requerida"),
    estado_fenologico: z.string().optional(),
    jornales: z.coerce.number().min(0).optional(),
    costo_jornales: z.coerce.number().min(0).optional(),
    moneda: z.enum(['ARS', 'USD']).default('ARS'),
    tipo_cambio: z.coerce.number().positive().default(1),
    observaciones: z.string().optional(),
    insumos: z.array(laborInsumoSchema).optional(),
    personal: z.array(z.object({
        personal_id: z.string().uuid(),
        dias_trabajados: z.coerce.number().min(0.01),
        costo_asignado: z.coerce.number().optional()
    })).optional()
})

export type LaborFormValues = z.infer<typeof laborSchema>
