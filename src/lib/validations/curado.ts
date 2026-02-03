import * as z from "zod"

export const estufaSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    capacidad: z.coerce.number().min(0, "La capacidad debe ser positiva"),
    activa: z.boolean().default(true),
})

export type EstufaFormValues = z.infer<typeof estufaSchema>

export const curadoSchema = z.object({
    estufa_id: z.string().uuid("Seleccione una estufa válida"),
    lote_id: z.string().uuid("Seleccione un lote válido").optional(), // Optional depending on workflow
    numero_carga: z.coerce.number().int().positive("Número de carga inválido"),
    fecha_inicio: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Fecha inválida",
    }),
    fecha_final: z.string().optional(),
    variedad: z.string().optional(),
    corte: z.coerce.number().int().optional(),
    peso_verde: z.coerce.number().min(0, "El peso debe ser positivo"),
    peso_seco: z.coerce.number().min(0).optional(),
    costo_carga: z.coerce.number().optional(),
    costo_descarga: z.coerce.number().optional(),
    estado: z.enum(['en_proceso', 'curado', 'descargado']).default('en_proceso'),
})

export type CuradoFormValues = z.infer<typeof curadoSchema>
