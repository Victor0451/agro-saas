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
import { cosechaSchema, type CosechaFormValues } from "@/lib/validations/cosecha"

interface Resource {
    id: string
    nombre: string
}

const CLASES_TABACO = [
    "Primera",
    "Segunda",
    "Tercera",
    "Cuarta",
    "Quinta",
    "Verde",
    "Gris",
    "Descarte"
]

export function CosechaForm() {
    const router = useRouter()
    const { activeFincaId } = useFinca()
    const [loading, setLoading] = useState(false)
    const [lotes, setLotes] = useState<Resource[]>([])

    useEffect(() => {
        if (!activeFincaId) return
        const fetchLotes = async () => {
            const res = await fetch(`/api/lotes?finca_id=${activeFincaId}`)
            const data = await res.json()
            setLotes(Array.isArray(data) ? data : [])
        }
        fetchLotes()
    }, [activeFincaId])

    const form = useForm<CosechaFormValues>({
        resolver: zodResolver(cosechaSchema),
        defaultValues: {
            finca_id: activeFincaId || "",
            fecha: format(new Date(), "yyyy-MM-dd"),
            kilos_brutos: 0,
            cantidad_bultos: 0,
            clase: "",
            observaciones: "",
            lote_id: "",
        },
    })

    useEffect(() => {
        if (activeFincaId) form.setValue("finca_id", activeFincaId)
    }, [activeFincaId, form])

    async function onSubmit(data: CosechaFormValues) {
        setLoading(true)
        try {
            const res = await fetch("/api/produccion/cosecha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) throw new Error("Error al guardar")

            form.reset({
                finca_id: activeFincaId || "",
                fecha: format(new Date(), "yyyy-MM-dd"),
                kilos_brutos: 0,
                cantidad_bultos: 0,
                clase: "",
                observaciones: "",
                lote_id: "",
            })
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...form.register("finca_id")} />

                <div className="bg-muted/50 p-3 rounded text-sm border">
                    <span className="font-semibold">Contexto:</span> Registrando Cosecha en Finca Activa
                    {!activeFincaId && <span className="text-destructive ml-2">(Seleccione Finca)</span>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="fecha"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lote_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lote Origen</FormLabel>
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
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="kilos_brutos"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Kilos Brutos (kg)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cantidad_bultos"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cant. Bultos (fardos/cajas)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="clase"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Clase / Calidad (Est.)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Clase" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {CLASES_TABACO.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                    Registrar Cosecha
                </Button>
            </form>
        </Form>
    )
}
