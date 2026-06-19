"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { CreateCompraSchema, type CreateCompraInput } from "@/lib/validations/insumo"
import { api } from "@/lib/api"

interface CompraInsumoFormProps {
    onSuccess?: () => void
}

interface Category {
    id: string
    nombre: string
}

interface InsumoOption {
    id: string
    nombre: string
    unidad: string
    activo: boolean
}

export function CompraInsumoForm({ onSuccess }: CompraInsumoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [categorias, setCategorias] = useState<Category[]>([])
    const [loadingCats, setLoadingCats] = useState(true)

    const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("")
    const [insumos, setInsumos] = useState<InsumoOption[]>([])
    const [loadingInsumos, setLoadingInsumos] = useState(false)

    const [fetchingRate, setFetchingRate] = useState(false)

    const today = new Date().toISOString().split("T")[0]

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CreateCompraInput>({
        resolver: zodResolver(CreateCompraSchema),
        defaultValues: {
            insumo_id: "",
            fecha_compra: today,
            cantidad: undefined,
            costo_unitario: undefined,
            moneda: "ARS",
            tipo_cambio: 1,
            notas: "",
        },
    })

    const selectedMoneda = watch("moneda")
    const cantidad = watch("cantidad")
    const costo_unitario = watch("costo_unitario")

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
            setValue("insumo_id", "")
            return
        }

        setLoadingInsumos(true)
        api.insumos.list({ categoria_id: selectedCategoriaId })
            .then(data => {
                setInsumos(data.filter(i => i.activo) as InsumoOption[])
                setValue("insumo_id", "")
            })
            .catch(e => console.error("Error cargando insumos", e))
            .finally(() => setLoadingInsumos(false))
    }, [selectedCategoriaId, setValue])

    // Fetch dolar blue when USD selected
    useEffect(() => {
        if (selectedMoneda === "USD") {
            setFetchingRate(true)
            api.dolarBlue.get()
                .then(data => {
                    if (data?.venta) setValue("tipo_cambio", data.venta)
                })
                .catch(e => console.error("Error obteniendo cotización", e))
                .finally(() => setFetchingRate(false))
        } else {
            setValue("tipo_cambio", 1)
        }
    }, [selectedMoneda, setValue])

    // Computed total preview
    const total = (cantidad ?? 0) * (costo_unitario ?? 0)
    const totalARS = selectedMoneda === "USD"
        ? total * (watch("tipo_cambio") ?? 1)
        : total

    async function onSubmit(data: CreateCompraInput) {
        setIsSubmitting(true)
        setError(null)

        try {
            await api.compras.create(data)

            reset({
                insumo_id: "",
                fecha_compra: today,
                cantidad: undefined,
                costo_unitario: undefined,
                moneda: "ARS",
                tipo_cambio: 1,
                notas: "",
            })
            setSelectedCategoriaId("")
            onSuccess?.()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error desconocido"
            setError(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const activeInsumos = insumos.filter(i => i.activo)
    const hasNoActiveInsumos = selectedCategoriaId && !loadingInsumos && activeInsumos.length === 0

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Registrar Compra</CardTitle>
                <CardDescription>
                    Registrá una nueva compra de insumos para tu campo.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">

                    {/* Step 1: Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoria">Categoría</Label>
                            <Select
                                value={selectedCategoriaId}
                                onValueChange={setSelectedCategoriaId}
                            >
                                <SelectTrigger id="categoria">
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
                        </div>

                        {/* Step 2: Insumo */}
                        <div className="space-y-2">
                            <Label htmlFor="insumo_id">Insumo</Label>
                            <Controller
                                name="insumo_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={!selectedCategoriaId || loadingInsumos}
                                    >
                                        <SelectTrigger id="insumo_id">
                                            <SelectValue placeholder={
                                                loadingInsumos ? "Cargando..."
                                                    : !selectedCategoriaId ? "Primero seleccioná una categoría"
                                                        : "Seleccioná un insumo"
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeInsumos.map((ins) => (
                                                <SelectItem key={ins.id} value={ins.id}>
                                                    {ins.nombre} ({ins.unidad})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {hasNoActiveInsumos && (
                                <p className="text-sm text-amber-600">
                                    No hay insumos activos en esta categoría.
                                </p>
                            )}
                            {errors.insumo_id && (
                                <p className="text-sm text-red-500">{errors.insumo_id.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Purchase fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fecha_compra">Fecha de Compra</Label>
                            <Input
                                id="fecha_compra"
                                type="date"
                                max={today}
                                {...register("fecha_compra")}
                            />
                            {errors.fecha_compra && (
                                <p className="text-sm text-red-500">{errors.fecha_compra.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cantidad">Cantidad</Label>
                            <Input
                                id="cantidad"
                                type="number"
                                step="0.001"
                                min="0.001"
                                placeholder="0"
                                {...register("cantidad", { valueAsNumber: true })}
                            />
                            {errors.cantidad && (
                                <p className="text-sm text-red-500">{errors.cantidad.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Currency section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
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
                            <Label htmlFor="costo_unitario">Costo Unitario</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                                    {selectedMoneda === "USD" ? "US$" : "$"}
                                </span>
                                <Input
                                    id="costo_unitario"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="pl-9"
                                    placeholder="0.00"
                                    {...register("costo_unitario", { valueAsNumber: true })}
                                />
                            </div>
                            {errors.costo_unitario && (
                                <p className="text-sm text-red-500">{errors.costo_unitario.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tipo_cambio">
                                Tipo de Cambio
                                {fetchingRate && (
                                    <span className="ml-2 text-xs text-blue-500 animate-pulse">Obteniendo cotización...</span>
                                )}
                            </Label>
                            <Input
                                id="tipo_cambio"
                                type="number"
                                step="0.01"
                                {...register("tipo_cambio", { valueAsNumber: true })}
                                disabled={selectedMoneda === "ARS"}
                            />
                            {selectedMoneda === "USD" && (
                                <p className="text-[10px] text-muted-foreground">Cotización Blue (editable)</p>
                            )}
                        </div>
                    </div>

                    {/* Total preview */}
                    {total > 0 && (
                        <div className="bg-muted/50 rounded-md p-3 text-sm border">
                            <span className="text-muted-foreground">Total estimado: </span>
                            <span className="font-semibold">
                                {new Intl.NumberFormat("es-AR", {
                                    style: "currency",
                                    currency: selectedMoneda === "USD" ? "USD" : "ARS",
                                }).format(total)}
                            </span>
                            {selectedMoneda === "USD" && totalARS > 0 && (
                                <span className="text-muted-foreground ml-2 text-xs">
                                    (~{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(totalARS)} ARS)
                                </span>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notas">Notas (opcional)</Label>
                        <Textarea
                            id="notas"
                            className="h-20 resize-none"
                            placeholder="Observaciones sobre la compra..."
                            {...register("notas")}
                        />
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !!hasNoActiveInsumos}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Registrar Compra
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
