"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// We need filtered insumos. Reusing or fetching them.
// For simplicity, we assume we pass filtered lists as props or fetch them inside.

import { almacigoSchema, type AlmacigoFormValues } from "@/lib/validations/almacigo"

// Define types locally or import from a shared type file
// Using strict types as per advanced-types skill
export interface Insumo {
    id: string
    nombre: string
    stock_actual: number
    unidad: string
    categoria?: string
}

export interface Finca {
    id: string
    nombre: string
    // Add other fields as needed
}

import { useFinca } from "@/contexts/finca-context"

// ... imports

// Update Props: remove fincas, use Context instead
interface AlmacigoFormProps {
    semillas: Insumo[]
    sustratos: Insumo[]
    // fincas: Finca[] // Removed, using Global Context
    onSuccess?: () => void
}

export function AlmacigoForm({ semillas, sustratos, onSuccess }: AlmacigoFormProps) {
    const router = useRouter()
    const { fincas, activeFincaId } = useFinca() // Use Global Context
    const [loading, setLoading] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const form = useForm<AlmacigoFormValues>({
        resolver: zodResolver(almacigoSchema),
        defaultValues: {
            fecha: format(new Date(), "yyyy-MM-dd"),
            variedad: "",
            cantidad_bandejas: 0,
            semilla_usada: 0,
            sustrato_usado: 0,
            finca_id: activeFincaId || "", // Default to Active Global Farm
        },
    })

    // Listen to global changes
    useEffect(() => {
        if (activeFincaId) {
            form.setValue("finca_id", activeFincaId)
        }
    }, [activeFincaId, form])

    // ... onSubmit ...
    async function onSubmit(data: AlmacigoFormValues) {
        // ... same logic ...
        // Validation: Ensure finca_id is set
        if (!data.finca_id) {
            setSubmitError("Debe seleccionar una finca activa arriba.")
            return
        }
        // ... fetch code ...
        setLoading(true)

        try {
            const response = await fetch("/api/produccion/almacigos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const err = await response.json()
                if (Array.isArray(err.error)) {
                    throw new Error("Error de validación")
                }
                throw new Error(err.error || "Error al registrar siembra")
            }

            form.reset({
                fecha: format(new Date(), "yyyy-MM-dd"),
                finca_id: activeFincaId || "" // Reset but keep active farm
            })
            router.refresh()
            if (onSuccess) onSuccess()
            if (onSuccess) onSuccess()
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Error desconocido"
            setSubmitError(message)
        } finally {
            setLoading(false)
        }
    }

    // Helper to format currency/unit
    const getUnit = (id: string, list: Insumo[]) => {
        const item = list.find(i => i.id === id)
        return item?.unidad || ''
    }

    const selectedSemilla = form.watch('insumo_semilla_id')
    const selectedSustrato = form.watch('insumo_sustrato_id')

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {submitError && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm font-medium">
                        {submitError}
                    </div>
                )}

                <div className="bg-muted p-3 rounded-md text-sm mb-4 border flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">Finca Activa:</span>
                    <span className="font-bold text-primary">
                        {fincas.find(f => f.id === activeFincaId)?.nombre || "Ninguna seleccionada"}
                    </span>
                    {!activeFincaId && <span className="text-destructive text-xs ml-2">(Seleccione una arriba)</span>}
                </div>

                {/* Hidden Field for validation logic if needed, or just relying on form state */}
                <input type="hidden" {...form.register("finca_id")} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="fecha"
                        render={({ field }) => (
                            <FormItem >
                                <FormLabel>Fecha de Siembra</FormLabel>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        {...field}
                                    />
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="variedad"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Variedad</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Criollo, Virginia..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Materiales (Stock)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Semilla */}
                        <FormField
                            control={form.control}
                            name="insumo_semilla_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Semilla Utilizada</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar Semilla" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {semillas.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.nombre} (Stock: {s.stock_actual} {s.unidad})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="semilla_usada"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cantidad Usada ({selectedSemilla ? getUnit(selectedSemilla, semillas) : 'u'})</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Sustrato */}
                        <FormField
                            control={form.control}
                            name="insumo_sustrato_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sustrato Utilizado</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar Sustrato" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sustratos.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.nombre} (Stock: {s.stock_actual} {s.unidad})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="sustrato_usado"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cantidad Usada ({selectedSustrato ? getUnit(selectedSustrato, sustratos) : 'u'})</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="cantidad_bandejas"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Total de Bandejas Sembradas</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="observaciones"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observaciones (Opcional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Detalles sobre el clima, lote de semilla, etc."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar Siembra
                </Button>
            </form>
        </Form>
    )
}
