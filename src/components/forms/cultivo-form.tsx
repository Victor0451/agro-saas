"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2 } from "lucide-react"
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
import { laborSchema, type LaborFormValues } from "@/lib/validations/labor"

interface Resource {
    id: string
    nombre?: string
}

interface InsumoResource {
    id: string
    nombre: string
    unidad: string
    stock_actual: number
    activo?: boolean
}

const TIPOS_LABOR = [
    "Riego",
    "Fertilización",
    "Fumigación / Curación",
    "Desmalezado",
    "Poda",
    "Desbrote",
    "Aclareo",
    "Cosecha (Parcial)",
    "Otros"
]

export function CultivoForm() {
    const router = useRouter()
    const { activeFincaId } = useFinca()
    const [loading, setLoading] = useState(false)
    const [lotes, setLotes] = useState<Resource[]>([])
    const [insumos, setInsumos] = useState<InsumoResource[]>([])

    // Fetch dependencies
    useEffect(() => {
        if (!activeFincaId) return

        const fetchData = async () => {
            try {
                const [lotesRes, insumosRes] = await Promise.all([
                    fetch(`/api/lotes?finca_id=${activeFincaId}`),
                    fetch(`/api/insumos`) // Fetch all insumos, can filter by tenant logic
                ])

                const lotesData = await lotesRes.json()
                const insumosData = await insumosRes.json()

                setLotes(Array.isArray(lotesData) ? lotesData : [])
                // We filter active insumos locally or rely on API to return active only
                setInsumos(Array.isArray(insumosData) ? insumosData.filter((i: InsumoResource) => i.activo !== false) : [])
            } catch (err) {
                console.error("Error fetching data:", err)
            }
        }
        fetchData()
    }, [activeFincaId])

    const form = useForm<LaborFormValues>({
        resolver: zodResolver(laborSchema),
        defaultValues: {
            finca_id: activeFincaId || "",
            fecha: format(new Date(), "yyyy-MM-dd"),
            tipo_labor: "",
            jornales: 0,
            observaciones: "",
            insumos: []
        },
    })

    // Field Array for Insumos
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "insumos"
    })

    useEffect(() => {
        if (activeFincaId) form.setValue("finca_id", activeFincaId)
    }, [activeFincaId, form])

    async function onSubmit(data: LaborFormValues) {
        setLoading(true)
        try {
            const res = await fetch("/api/produccion/cultivo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Error al guardar")
            }

            form.reset({
                finca_id: activeFincaId || "",
                fecha: format(new Date(), "yyyy-MM-dd"),
                tipo_labor: "",
                jornales: 0,
                observaciones: "",
                insumos: []
            })
            router.refresh()
        } catch (error: unknown) {
            console.error(error)
            const message = error instanceof Error ? error.message : "Error desconocido"
            alert("Error: " + message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...form.register("finca_id")} />

                <div className="bg-muted/50 p-3 rounded text-sm border">
                    <span className="font-semibold">Contexto:</span> Registrando Labor en Finca Activa
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
                                <FormLabel>Lote Afectado</FormLabel>
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

                <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="tipo_labor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Labor</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {TIPOS_LABOR.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="jornales"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jornales (Días/Hombre)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.5" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* INSUMOS SECTION */}
                <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-medium text-sm uppercase">Insumos Utilizados</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ insumo_id: "", cantidad: 0 })}>
                            <Plus className="w-4 h-4 mr-2" /> Agregar Insumo
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-end">
                                <FormField
                                    control={form.control}
                                    name={`insumos.${index}.insumo_id`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Insumo..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {insumos.map(i => (
                                                        <SelectItem key={i.id} value={i.id} disabled={i.stock_actual <= 0}>
                                                            {i.nombre} ({i.stock_actual} {i.unidad})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`insumos.${index}.cantidad`}
                                    render={({ field }) => (
                                        <FormItem className="w-24">
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="Cant." {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {fields.length === 0 && <p className="text-muted-foreground text-xs italic text-center py-2">Sin insumos agregados.</p>}
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="observaciones"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observaciones / Detalles</FormLabel>
                            <FormControl>
                                <Textarea {...field} className="h-20 resize-none" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading || !activeFincaId}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar Labor
                </Button>
            </form>
        </Form>
    )
}
