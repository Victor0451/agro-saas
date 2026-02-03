import { z } from "zod"

export const almacigoSchema = z.object({
    fecha: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Fecha inválida",
    }),
    finca_id: z.string().uuid("Seleccione una finca"),
    variedad: z.string().min(2, "La variedad es requerida"),
    cantidad_bandejas: z.coerce.number().int().min(1, "Debe ser al menos 1 bandeja"),

    // Seed Link
    insumo_semilla_id: z.string().uuid("Seleccione una semilla válida"),
    semilla_usada: z.coerce.number().positive("La cantidad debe ser mayor a 0"),

    // Substrate Link (Optional but usually present)
    insumo_sustrato_id: z.string().uuid().optional().or(z.literal('')),
    sustrato_usado: z.coerce.number().min(0).optional(),

    observaciones: z.string().optional(),
})

export type AlmacigoFormValues = z.infer<typeof almacigoSchema>
