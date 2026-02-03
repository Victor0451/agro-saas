import * as z from "zod"

export const fincaSchema = z.object({
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    superficie_total: z.coerce.number().min(0, "La superficie debe ser positiva"),
    rendimiento_esperado: z.coerce.number().min(0).optional(),
    produccion_total: z.coerce.number().min(0).optional(),
    b1f_2025: z.coerce.number().min(0).optional(),
})

export type FincaFormValues = z.infer<typeof fincaSchema>
