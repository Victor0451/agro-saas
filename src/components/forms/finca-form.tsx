"use client"

import { useState } from "react"
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
import { fincaSchema, type FincaFormValues } from "@/lib/validations/finca"

interface FincaFormProps {
    onSuccess: () => void
    initialData?: {
        id: string
        nombre: string
        superficie_total: number
        rendimiento_esperado: number
    } | null
}

export function FincaForm({ onSuccess, initialData }: FincaFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FincaFormValues>({
        resolver: zodResolver(fincaSchema),
        defaultValues: {
            nombre: initialData?.nombre || "",
            superficie_total: initialData?.superficie_total || 0,
            rendimiento_esperado: initialData?.rendimiento_esperado || 0,
        },
    })

    async function onSubmit(data: FincaFormValues) {
        setIsSubmitting(true)
        setError(null)

        try {
            const url = initialData ? `/api/fincas?id=${initialData.id}` : "/api/fincas"
            const method = initialData ? "PUT" : "POST"

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || "Error al guardar la finca")
            }

            reset()
            onSuccess()
            onSuccess()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error desconocido"
            setError(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{initialData ? "Editar Finca" : "Nueva Finca"}</CardTitle>
                <CardDescription>
                    {initialData ? "Modifica los datos de tu establecimiento." : "Ingresa los datos básicos para registrar una nueva finca."}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre de la Finca</Label>
                        <Input id="nombre" {...register("nombre")} />
                        {errors.nombre && (
                            <p className="text-sm text-red-500">{errors.nombre.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="superficie">Superficie Total (has)</Label>
                            <Input
                                id="superficie"
                                type="number"
                                step="0.01"
                                {...register("superficie_total")}
                            />
                            {errors.superficie_total && (
                                <p className="text-sm text-red-500">{errors.superficie_total.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rendimiento">Rendimiento (kg/ha)</Label>
                            <Input
                                id="rendimiento"
                                type="number"
                                step="0.01"
                                {...register("rendimiento_esperado")}
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Actualizar Finca" : "Guardar Finca"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
