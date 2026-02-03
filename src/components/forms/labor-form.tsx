"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2, Sprout, Users } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useFinca } from "@/contexts/finca-context"
import { laborSchema, type LaborFormValues } from "@/lib/validations/labor"

interface Resource {
    id: string
    nombre: string
    stock_actual?: number
    unidad?: string
}

const TIPOS_LABOR = [
    "Desbrote",
    "Fertilización",
    "Riego",
    "Aplicación Agroquímicos",
    "Carpida",
    "Aporque",
    "Cosecha (Pre)",
    "Otro"
]

interface LaborFormProps {
    onSuccess?: () => void;
    initialData?: any;
    onCancel?: () => void;
}

export function LaborForm({ onSuccess, initialData, onCancel }: LaborFormProps) {
    const router = useRouter()
    const { activeFincaId } = useFinca()
    const [loading, setLoading] = useState(false)
    const [lotes, setLotes] = useState<Resource[]>([])
    const [insumosList, setInsumosList] = useState<Resource[]>([])
    const [personalList, setPersonalList] = useState<{ id: string, nombre: string, tipo: string, costo_jornal_referencia?: number }[]>([])
    const [fetchingRate, setFetchingRate] = useState(false)

    // Initial Fetch
    useEffect(() => {
        if (!activeFincaId) return

        const fetchData = async () => {
            try {
                const [lotesRes, insumosRes, personalRes] = await Promise.all([
                    fetch(`/api/lotes?finca_id=${activeFincaId}`),
                    fetch(`/api/insumos?finca_id=${activeFincaId}`),
                    fetch(`/api/personal`)
                ])

                if (lotesRes.ok) setLotes(await lotesRes.json())
                if (insumosRes.ok) setInsumosList(await insumosRes.json())
                if (personalRes.ok) setPersonalList(await personalRes.json())

            } catch (err) {
                console.error("Error fetching resources:", err)
            }
        }
        fetchData()
    }, [activeFincaId])

    const form = useForm<LaborFormValues>({
        resolver: zodResolver(laborSchema),
        defaultValues: initialData ? {
            ...initialData,
            finca_id: initialData.finca_id || activeFincaId || "",
            fecha: initialData.fecha ? format(new Date(initialData.fecha), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
            tipo_labor: initialData.tipo_labor || "",
            estado_fenologico: initialData.estado_fenologico || "",
            jornales: initialData.jornales || 0,
            costo_jornales: initialData.costo_jornales || 0,
            moneda: initialData.moneda || "ARS",
            tipo_cambio: initialData.tipo_cambio || 1,
            observaciones: initialData.observaciones || "",
            insumos: initialData.detalles?.map((d: any) => ({
                insumo_id: d.insumo_id || "",
                cantidad: d.cantidad || 0
            })) || [],
            personal: initialData.personal?.map((p: any) => ({
                personal_id: p.personal_id || "",
                dias_trabajados: p.dias_trabajados || 0
            })) || []
        } : {
            finca_id: activeFincaId || "",
            fecha: format(new Date(), "yyyy-MM-dd"),
            tipo_labor: "",
            estado_fenologico: "",
            jornales: 0,
            costo_jornales: 0,
            moneda: "ARS",
            tipo_cambio: 1,
            observaciones: "",
            insumos: [],
            personal: []
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "insumos"
    })

    const { fields: personalFields, append: appendPersonal, remove: removePersonal } = useFieldArray({
        control: form.control,
        name: "personal"
    })

    // Dolar Blue Fetch
    const selectedMoneda = form.watch("moneda")
    useEffect(() => {
        if (selectedMoneda === "USD") {
            setFetchingRate(true)
            fetch("https://dolarapi.com/v1/dolares/blue")
                .then(res => res.json())
                .then(data => {
                    if (data?.venta) form.setValue("tipo_cambio", data.venta)
                })
                .finally(() => setFetchingRate(false))
        } else {
            form.setValue("tipo_cambio", 1)
        }
    }, [selectedMoneda, form])

    // Sync Finca ID
    useEffect(() => {
        if (activeFincaId) form.setValue("finca_id", activeFincaId)
    }, [activeFincaId, form])

    // Reset form when initialData changes (Edit Mode)
    useEffect(() => {
        if (initialData) {
            form.reset({
                ...initialData,
                finca_id: initialData.finca_id || activeFincaId || "",
                fecha: initialData.fecha ? format(new Date(initialData.fecha), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
                tipo_labor: initialData.tipo_labor || "",
                estado_fenologico: initialData.estado_fenologico || "",
                jornales: initialData.jornales || 0,
                costo_jornales: initialData.costo_jornales || 0,
                moneda: initialData.moneda || "ARS",
                tipo_cambio: initialData.tipo_cambio || 1,
                observaciones: initialData.observaciones || "",
                // Map DB relations to Form structures
                insumos: initialData.detalles?.map((d: any) => ({
                    insumo_id: d.insumo_id || "",
                    cantidad: d.cantidad || 0
                })) || [],
                personal: initialData.personal?.map((p: any) => ({
                    personal_id: p.personal_id || "",
                    dias_trabajados: p.dias_trabajados || 0
                })) || []
            })
        } else {
            // Reset to defaults if initialData is cleared (Cancel Edit)
            form.reset({
                finca_id: activeFincaId || "",
                fecha: format(new Date(), "yyyy-MM-dd"),
                tipo_labor: "",
                estado_fenologico: "",
                jornales: 0,
                costo_jornales: 0,
                moneda: "ARS",
                tipo_cambio: 1,
                observaciones: "",
                insumos: [],
                personal: []
            })
        }
    }, [initialData, form, activeFincaId])

    // Auto-calculate Total Cost when Personal assignments change
    const personalValues = form.watch("personal")
    useEffect(() => {
        if (!personalValues?.length) return

        // Skip auto-calc if we are in "Edit Mode" initial load to avoid overwriting stored cost? 
        // No, if we edit days, we want to recalc.
        // But on initial load of edit, if cost is stored, we might want to keep it?
        // The calculation is deterministic based on days * rate.
        // If rate changed since record was created, auto-calc might change the cost.
        // This is acceptable behavior for "Edit".

        const totalCost = personalValues.reduce((acc, current) => {
            const persona = personalList.find(p => p.id === current.personal_id)
            const costoDiario = Number(persona?.costo_jornal_referencia || 0)
            return acc + (Number(current.dias_trabajados) * costoDiario)
        }, 0)

        if (totalCost > 0) {
            form.setValue("costo_jornales", totalCost)
        }
    }, [personalValues, personalList, form])

    async function onSubmit(data: LaborFormValues) {
        setLoading(true)
        try {
            const url = initialData?.id
                ? `/api/produccion/cultivo/${initialData.id}`
                : "/api/produccion/cultivo"

            const method = initialData?.id ? "PUT" : "POST"

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Error al guardar")
            }

            form.reset({
                finca_id: activeFincaId || "",
                fecha: format(new Date(), "yyyy-MM-dd"),
                tipo_labor: "",
                jornales: 0,
                costo_jornales: 0,
                moneda: "ARS",
                tipo_cambio: 1,
                observaciones: "",
                insumos: [],
                personal: []
            })
            router.refresh()
            if (onSuccess) onSuccess()
        } catch (error) {
            console.error(error)
            alert("Error: " + (error instanceof Error ? error.message : "Error desconocido"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-muted/50 p-3 rounded text-sm border flex items-center justify-between">
                    <div>
                        <span className="font-semibold">Finca Activa:</span>{' '}
                        {activeFincaId ? "Seleccionada" : <span className="text-destructive">Seleccione Finca</span>}
                    </div>
                    {fetchingRate && <span className="text-xs text-blue-500 animate-pulse">Actualizando cotización...</span>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="lote_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lote</FormLabel>
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
                                <FormLabel>Fecha</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} value={field.value ?? ''} />
                                </FormControl>
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
                        name="estado_fenologico"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado (Opcional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Floración" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Costs Section */}
                <div className="border rounded-md p-3 bg-muted/20 space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                        <Sprout className="h-4 w-4" /> Costos de Mano de Obra
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <FormField
                            control={form.control}
                            name="jornales"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jornales</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.5" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="moneda"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Moneda</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ARS">ARS</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="costo_jornales"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Costo Total MO</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tipo_cambio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cotización</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} disabled={selectedMoneda === 'ARS'} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Personal Assignment */}
                <div className="border border-indigo-100 dark:border-indigo-900/20 rounded-md p-3 bg-indigo-50/20 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                            <Users className="h-4 w-4" /> Asignación de Personal
                        </h4>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendPersonal({ personal_id: "", dias_trabajados: 1 })}>
                            <Plus className="h-4 w-4 mr-2" /> Asignar Empleado
                        </Button>
                    </div>
                    {personalFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-end">
                            <FormField
                                control={form.control}
                                name={`personal.${index}.personal_id`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar Empleado" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {personalList.filter((p: any) => p.activo).map((p: any) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.nombre} ({p.tipo}) - Ref: ${p.costo_jornal_referencia || 0}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`personal.${index}.dias_trabajados`}
                                render={({ field }) => (
                                    <FormItem className="w-24">
                                        <FormControl>
                                            <Input type="number" placeholder="Días" step="0.5" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removePersonal(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    {personalFields.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">Sin personal asignado específicamente.</p>
                    )}
                </div>

                {/* Insumos Usage */}
                {/* Insumos Usage */}
                <div className="border border-indigo-100 dark:border-indigo-900/20 rounded-md p-3 bg-indigo-50/20 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                            <Sprout className="h-4 w-4" /> Insumos Utilizados
                        </h4>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ insumo_id: "", cantidad: 0 })}>
                            <Plus className="h-4 w-4 mr-2" /> Agregar Insumo
                        </Button>
                    </div>
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-end">
                            <FormField
                                control={form.control}
                                name={`insumos.${index}.insumo_id`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Insumo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {insumosList.map(i => (
                                                        <SelectItem key={i.id} value={i.id}>
                                                            {i.nombre} ({i.stock_actual} {i.unidad})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`insumos.${index}.cantidad`}
                                render={({ field }) => (
                                    <FormItem className="w-24">
                                        <FormControl>
                                            <Input type="number" placeholder="Cant." step="0.01" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    {fields.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No se utilizan insumos en esta labor.</p>
                    )}
                </div>

                <FormField
                    control={form.control}
                    name="observaciones"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observaciones</FormLabel>
                            <FormControl>
                                <Textarea {...field} className="h-20" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-2">
                    {initialData && (
                        <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
                            Cancelar Edición
                        </Button>
                    )}
                    <Button type="submit" className="w-full" disabled={loading || !activeFincaId}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Actualizar Labor" : "Registrar Labor"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
