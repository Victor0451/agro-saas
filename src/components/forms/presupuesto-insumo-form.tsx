"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CreatePresupuestoSchema, type CreatePresupuestoInput } from "@/lib/validations/insumo"
import { api } from "@/lib/api"
import type { PresupuestoInsumo } from "@/types/insumos"

interface PresupuestoInsumoFormProps {
    onSuccess?: () => void
    initialData?: PresupuestoInsumo
}

interface Category {
    id: string
    nombre: string
}

interface InsumoOption {
    id: string
    nombre: string
    unidad: string
}

const MESES = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
]

export function PresupuestoInsumoForm({ onSuccess, initialData }: PresupuestoInsumoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [periodType, setPeriodType] = useState<"mensual" | "anual">(
        initialData?.periodo_mes != null ? "mensual" : "anual"
    )

    const [categorias, setCategorias] = useState<Category[]>([])
    const [loadingCats, setLoadingCats] = useState(true)

    const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>(initialData?.categoria_id ?? "")
    const [insumos, setInsumos] = useState<InsumoOption[]>([])
    const [loadingInsumos, setLoadingInsumos] = useState(false)

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    const isEditing = !!initialData?.id

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors },
    } = useForm<CreatePresupuestoInput>({
        resolver: zodResolver(CreatePresupuestoSchema),
        defaultValues: {
            categoria_id: initialData?.categoria_id ?? "",
            insumo_id: initialData?.insumo_id ?? null,
            periodo_mes: initialData?.periodo_mes ?? currentMonth,
            periodo_anio: initialData?.periodo_anio ?? currentYear,
            monto_presupuestado: initialData?.monto_presupuestado ?? undefined,
            moneda: initialData?.moneda ?? "ARS",
        },
    })

    // Load categories on mount
    useEffect(() => {
        api.categorias.list()
            .then(data => setCategorias(data))
            .catch(e => console.error("Error cargando categorías", e))
            .finally(() => setLoadingCats(false))
    }, [])

    // Load insumos when category changes
    useEffect(() => {
        if (!selectedCategoriaId) {
            setInsumos([])
            setValue("insumo_id", null)
            return
        }

        setLoadingInsumos(true)
        api.insumos.list({ categoria_id: selectedCategoriaId })
            .then(data => setInsumos(data as InsumoOption[]))
            .catch(e => console.error("Error cargando insumos", e))
            .finally(() => setLoadingInsumos(false))
    }, [selectedCategoriaId, setValue])

    // Sync periodo_mes based on period type toggle
    useEffect(() => {
        if (periodType === "anual") {
            setValue("periodo_mes", null)
        } else {
            setValue("periodo_mes", currentMonth)
        }
    }, [periodType, currentMonth, setValue])

    async function onSubmit(data: CreatePresupuestoInput) {
        setIsSubmitting(true)
        setError(null)

        try {
            if (isEditing && initialData?.id) {
                await api.presupuesto.update(initialData.id, data)
            } else {
                await api.presupuesto.create(data)
            }

            if (!isEditing) {
                reset({
                    categoria_id: "",
                    insumo_id: null,
                    periodo_mes: currentMonth,
                    periodo_anio: currentYear,
                    monto_presupuestado: undefined,
                    moneda: "ARS",
                })
                setSelectedCategoriaId("")
            }
            onSuccess?.()
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
                <CardTitle>{isEditing ? "Editar Presupuesto" : "Nuevo Presupuesto"}</CardTitle>
                <CardDescription>
                    Establecé un monto presupuestado por categoría o insumo específico.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">

                    {/* Period type toggle */}
                    <div className="space-y-2">
                        <Label>Tipo de Período</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={periodType === "mensual" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPeriodType("mensual")}
                            >
                                Mensual
                            </Button>
                            <Button
                                type="button"
                                variant={periodType === "anual" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPeriodType("anual")}
                            >
                                Anual
                            </Button>
                        </div>
                    </div>

                    {/* Period fields */}
                    <div className="grid grid-cols-2 gap-4">
                        {periodType === "mensual" && (
                            <div className="space-y-2">
                                <Label>Mes</Label>
                                <Controller
                                    name="periodo_mes"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={(val) => field.onChange(Number(val))}
                                            value={field.value != null ? String(field.value) : ""}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccioná el mes" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MESES.map(m => (
                                                    <SelectItem key={m.value} value={String(m.value)}>
                                                        {m.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.periodo_mes && (
                                    <p className="text-sm text-red-500">{errors.periodo_mes.message}</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="periodo_anio">Año</Label>
                            <Input
                                id="periodo_anio"
                                type="number"
                                min="2020"
                                max="2100"
                                {...register("periodo_anio", { valueAsNumber: true })}
                            />
                            {errors.periodo_anio && (
                                <p className="text-sm text-red-500">{errors.periodo_anio.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Category and Insumo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoria_id">Categoría</Label>
                            <Controller
                                name="categoria_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={(val) => {
                                            field.onChange(val)
                                            setSelectedCategoriaId(val)
                                        }}
                                        value={field.value}
                                    >
                                        <SelectTrigger id="categoria_id">
                                            <SelectValue placeholder={loadingCats ? "Cargando..." : "Seleccioná una categoría"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categorias.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.categoria_id && (
                                <p className="text-sm text-red-500">{errors.categoria_id.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="insumo_id">Insumo (opcional)</Label>
                            <Controller
                                name="insumo_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                                        value={field.value ?? "none"}
                                        disabled={!selectedCategoriaId || loadingInsumos}
                                    >
                                        <SelectTrigger id="insumo_id">
                                            <SelectValue placeholder={
                                                loadingInsumos ? "Cargando..."
                                                    : !selectedCategoriaId ? "Primero seleccioná categoría"
                                                        : "Toda la categoría"
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Toda la categoría</SelectItem>
                                            {insumos.map((ins) => (
                                                <SelectItem key={ins.id} value={ins.id}>
                                                    {ins.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Si no seleccionás insumo, el presupuesto aplica a toda la categoría.
                            </p>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label>Moneda</Label>
                            <Controller
                                name="moneda"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Moneda" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                                            <SelectItem value="USD">Dólar (USD)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="monto_presupuestado">Monto Presupuestado</Label>
                            <Input
                                id="monto_presupuestado"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                {...register("monto_presupuestado", { valueAsNumber: true })}
                            />
                            {errors.monto_presupuestado && (
                                <p className="text-sm text-red-500">{errors.monto_presupuestado.message}</p>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Actualizar Presupuesto" : "Guardar Presupuesto"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
