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
