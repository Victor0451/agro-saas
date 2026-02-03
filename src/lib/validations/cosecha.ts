import * as z from "zod"

export const cosechaSchema = z.object({
    finca_id: z.string().uuid(),
    lote_id: z.string().uuid("El lote es requerido"),
    fecha: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Fecha inválida",
    }),
    kilos_brutos: z.coerce.number().min(0.1, "Debe ingresar los kilos"),
    cantidad_bultos: z.coerce.number().int().min(0).optional(),
    clase: z.string().optional(),
    observaciones: z.string().optional(),
})

export type CosechaFormValues = z.infer<typeof cosechaSchema>
