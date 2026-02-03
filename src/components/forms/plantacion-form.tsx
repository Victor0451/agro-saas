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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useFinca } from "@/contexts/finca-context"
import { plantacionSchema, type PlantacionFormValues } from "@/lib/validations/plantacion"

interface Resource {
    id: string
    nombre?: string
    variedad?: string
    fecha?: string
    cantidad_bandejas?: number
    bandejas_plantadas?: number
}

interface PlantacionFormProps {
    onSuccess?: () => void
}

export function PlantacionForm({ onSuccess }: PlantacionFormProps) {
    const router = useRouter()
    const { activeFincaId } = useFinca()
    const [loading, setLoading] = useState(false)
    const [lotes, setLotes] = useState<Resource[]>([])
    const [almacigos, setAlmacigos] = useState<Resource[]>([])

    // Fetch Lotes and Almacigos when activeFinca changes
    useEffect(() => {
        if (!activeFincaId) return

        const fetchData = async () => {
            try {
                // Fetch Lotes for Active Finca
                const lotesRes = await fetch(`/api/lotes?finca_id=${activeFincaId}`)
                const lotesData = await lotesRes.json()
                setLotes(Array.isArray(lotesData) ? lotesData : [])

                // Fetch Almacigos for Active Finca
                const almaRes = await fetch(`/api/produccion/almacigos?finca_id=${activeFincaId}`)
                const almaData = await almaRes.json()
                setAlmacigos(Array.isArray(almaData) ? almaData : [])
            } catch (err) {
                console.error("Error fetching dependencies:", err)
            }
        }
        fetchData()
    }, [activeFincaId])

    const form = useForm<PlantacionFormValues>({
        resolver: zodResolver(plantacionSchema),
        defaultValues: {
            finca_id: activeFincaId || "",
            fecha: format(new Date(), "yyyy-MM-dd"),
            variedad: "",
            cantidad_plantas: 0,
            superficie_cubierta: 0,
            observaciones: "",
            lote_id: "",
            bandejas_usadas: 0,
        },
    })

    const selectedMoneda = form.watch("moneda")
    const [fetchingRate, setFetchingRate] = useState(false)

    useEffect(() => {
        if (selectedMoneda === "USD") {
            setFetchingRate(true)
            fetch("https://dolarapi.com/v1/dolares/blue")
                .then(res => res.json())
                .then(data => {
                    if (data && data.venta) {
                        form.setValue("tipo_cambio", data.venta)
                    }
                })
                .catch(err => console.error("Error fetching rate", err))
                .finally(() => setFetchingRate(false))
        } else {
            form.setValue("tipo_cambio", 1)
        }
    }, [selectedMoneda, form])

    // Sync hidden finca_id
    useEffect(() => {
        if (activeFincaId) form.setValue("finca_id", activeFincaId)
    }, [activeFincaId, form])

    async function onSubmit(data: PlantacionFormValues) {
        setLoading(true)
        try {
            const res = await fetch("/api/produccion/plantaciones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) throw new Error("Error al guardar")

            form.reset({
                finca_id: activeFincaId || "",
                fecha: format(new Date(), "yyyy-MM-dd"),
                variedad: "",
                cantidad_plantas: 0,
                bandejas_usadas: 0,
                costo_total: 0,
                moneda: "ARS",
                tipo_cambio: 1
            })
            router.refresh()
            if (onSuccess) onSuccess()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Helper to auto-fill variety from Almacigo
    const handleAlmacigoChange = (id: string) => {
        // Find selected
        const selected = almacigos.find(a => a.id === id)
        if (selected && selected.variedad) {
            form.setValue("variedad", selected.variedad)
        }
        form.setValue("almacigo_id", id)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...form.register("finca_id")} />

                <div className="bg-muted/50 p-3 rounded text-sm border">
                    <span className="font-semibold">Contexto:</span> Registrando para Finca Activa
                    {!activeFincaId && <span className="text-destructive ml-2">(Seleccione Finca)</span>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="lote_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lote de Destino</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Lote" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {lotes.map(l => (
                                            <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="fecha"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha de Plantación</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="border-t pt-2">
                    <span className="text-muted-foreground text-xs uppercase mb-2 block font-medium">Origen de Plantines (Opcional)</span>
                    <FormField
                        control={form.control}
                        name="almacigo_id"
                        render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={handleAlmacigoChange} value={field.value || undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Almácigo / Siembra" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {almacigos.map(a => {
                                            const total = a.cantidad_bandejas || 0
                                            const usadas = a.bandejas_plantadas || 0
                                            const disponibles = total - usadas

                                            // Optional: Disable if stock is 0? Or just show it.
                                            // Let's just show it for now.

                                            return (
                                                <SelectItem key={a.id} value={a.id}>
                                                    {format(new Date(a.fecha!), 'dd/MM')} - {a.variedad}
                                                    <span className={`ml-2 ${disponibles <= 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                        (Disp: {disponibles} / {total})
                                                    </span>
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="variedad"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Variedad</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Ej: Criollo" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cantidad_plantas"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cant. Plantas (Est.)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bandejas_usadas"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bandejas Usadas</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="superficie_cubierta"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sup. Cubierta (ha)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="observaciones"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observaciones</FormLabel>
                            <FormControl>
                                <Textarea {...field} className="resize-none h-20" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading || !activeFincaId}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar Plantación
                </Button>
            </form>
        </Form>
    )
}
