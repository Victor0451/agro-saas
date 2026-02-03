"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { loteSchema, type LoteFormValues } from "@/lib/validations/lote"
import { useFinca } from "@/contexts/finca-context"

interface LoteFormProps {
    onSuccess: () => void
}

export function LoteForm({ onSuccess }: LoteFormProps) {
    const { activeFincaId, fincas } = useFinca()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<LoteFormValues>({
        resolver: zodResolver(loteSchema),
        defaultValues: {
            nombre: "",
            superficie: 0,
            variedad: "",
            activo: true,
            finca_id: activeFincaId || ""
        },
    })

    // Sync with global active finca
    useEffect(() => {
        if (activeFincaId) {
            setValue("finca_id", activeFincaId)
        }
    }, [activeFincaId, setValue])

    async function onSubmit(data: LoteFormValues) {
        if (!data.finca_id) {
            setError("Debe seleccionar una finca activa en el menú superior.")
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch("/api/lotes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || "Error al crear el lote")
            }

            reset({
                nombre: "",
                superficie: 0,
                variedad: "",
                activo: true,
                finca_id: activeFincaId || ""
            })
            onSuccess()
            onSuccess()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error desconocido"
            setError(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const activeFincaName = fincas.find(f => f.id === activeFincaId)?.nombre

    return (
        <Card className="w-full border-t-4 border-t-primary">
            <CardHeader>
                <CardTitle>Nuevo Lote</CardTitle>
                <CardDescription>
                    Agregando lote a: <span className="font-semibold text-primary">{activeFincaName || "Sin Finca Seleccionada"}</span>
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">

                    {/* Hidden Field for validation logic */}
                    <input type="hidden" {...register("finca_id")} />
                    {!activeFincaId && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
                            ⚠️ Por favor selecciona una finca en la barra superior antes de continuar.
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre / Identificador del Lote</Label>
                        <Input id="nombre" {...register("nombre")} placeholder="Ej: Lote 14, Cuadro Sur" />
                        {errors.nombre && (
                            <p className="text-sm text-red-500">{errors.nombre.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="superficie">Superficie (has)</Label>
                            <Input
                                id="superficie"
                                type="number"
                                step="0.01"
                                {...register("superficie")}
                            />
                            {errors.superficie && (
                                <p className="text-sm text-red-500">{errors.superficie.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="variedad">Variedad (Opcional)</Label>
                            <Input
                                id="variedad"
                                {...register("variedad")}
                                placeholder="Ej: Criolla, Virginia"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || !activeFincaId}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Lote
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
