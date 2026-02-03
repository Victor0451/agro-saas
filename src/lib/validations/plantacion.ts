import * as z from "zod"

export const plantacionSchema = z.object({
    finca_id: z.string().uuid("Finca ID requerida"),
    lote_id: z.string().uuid("Debe seleccionar un lote"),
    almacigo_id: z.string().uuid().optional().nullable(),
    fecha: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Fecha inválida",
    }),
    variedad: z.string().min(2, "La variedad es requerida"),
    tipo_plantacion: z.string().optional(),
    cantidad_plantas: z.coerce.number().min(1, "Debe haber al menos 1 planta"),
    bandejas_usadas: z.coerce.number().min(0).optional(),
    superficie_cubierta: z.coerce.number().min(0).optional(),
    jornales_usados: z.coerce.number().min(0).optional(),
    costo_total: z.coerce.number().min(0).optional(),
    moneda: z.enum(['ARS', 'USD']).default('ARS'),
    tipo_cambio: z.coerce.number().positive().default(1),
    observaciones: z.string().optional(),
})

export type PlantacionFormValues = z.infer<typeof plantacionSchema>
