import * as z from "zod"

export const personalSchema = z.object({
    nombre: z.string().min(2, "El nombre es obligatorio"),
    dni: z.string().optional(),
    legajo: z.string().optional(),
    tipo: z.enum(['Permanente', 'Temporario']).default('Temporario'),
    costo_jornal_referencia: z.coerce.number().min(0).optional(),
    activo: z.boolean().default(true),
})

export type PersonalFormValues = z.infer<typeof personalSchema>

export const laborPersonalSchema = z.object({
    personal_id: z.string().uuid("Seleccione un personal"),
    dias_trabajados: z.coerce.number().min(0.01, "Mínimo 0.01 jornadas"),
    costo_asignado: z.coerce.number().min(0).optional(),
})
