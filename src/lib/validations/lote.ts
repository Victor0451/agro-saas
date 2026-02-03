import * as z from "zod"

export const loteSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    finca_id: z.string().uuid("Debe seleccionar una finca"),
    superficie: z.coerce.number().positive("La superficie debe ser mayor a 0"),
    variedad: z.string().optional(),
    activo: z.boolean().default(true),
})

export type LoteFormValues = z.infer<typeof loteSchema>
