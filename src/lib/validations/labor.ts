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
    observaciones: z.string().optional(),
    insumos: z.array(laborInsumoSchema).optional(),
})

export type LaborFormValues = z.infer<typeof laborSchema>
