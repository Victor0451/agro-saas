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
import { insumoSchema, type InsumoFormValues } from "@/lib/validations/insumo"

interface InsumoFormProps {
    onSuccess: () => void
}

interface Category {
    id: string
    nombre: string
}

export function InsumoForm({ onSuccess }: InsumoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [categorias, setCategorias] = useState<Category[]>([])
    const [loadingCats, setLoadingCats] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadCategorias() {
            try {
                const res = await fetch('/api/insumos/categorias')
                if (res.ok) {
                    const data = await res.json()
                    setCategorias(data as unknown as Category[])
                }
            } catch (e) {
                console.error("Failed to load categories", e)
            } finally {
                setLoadingCats(false)
            }
        }
        loadCategorias()
    }, [])

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<InsumoFormValues>({
        resolver: zodResolver(insumoSchema),
        defaultValues: {
            nombre: "",
            unidad: "unidades",
            costo_unitario: 0,
            stock_actual: 0,
            moneda: "ARS",
            tipo_cambio: 1,
            fecha_compra: new Date(),
        },
    })

    const selectedMoneda = watch("moneda")

    useEffect(() => {
        if (selectedMoneda === "USD") {
            // Fetch Dolar Blue rate
            fetch("https://dolarapi.com/v1/dolares/blue")
                .then(res => res.json())
                .then(data => {
                    if (data && data.venta) {
                        setValue("tipo_cambio", data.venta)
                    }
                })
                .catch(err => console.error("Error fetching rate", err))
        } else {
            setValue("tipo_cambio", 1)
        }
    }, [selectedMoneda, setValue])

    async function onSubmit(data: InsumoFormValues) {
        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch("/api/insumos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || "Error al crear el insumo")
            }

            reset()
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
                <CardTitle>Nuevo Insumo</CardTitle>
                <CardDescription>
                    Registra un nuevo material o insumo productivo.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoria">Categoría</Label>
                            <Controller
                                name="categoria_id"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger id="categoria">
                                            <SelectValue placeholder={loadingCats ? "Cargando..." : "Selecciona una categoría"} />
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
                            <Label htmlFor="nombre">Nombre del Insumo</Label>
                            <Input id="nombre" {...register("nombre")} placeholder="Ej: Urea Granulada" />
                            {errors.nombre && (
                                <p className="text-sm text-red-500">{errors.nombre.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fecha_compra">Fecha de Compra</Label>
                            <Input
                                id="fecha_compra"
                                type="date"
                                {...register("fecha_compra")}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="unidad">Unidad</Label>
                            <Controller
                                name="unidad"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger id="unidad">
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                                            <SelectItem value="gr">Gramos (gr)</SelectItem>
                                            <SelectItem value="tn">Toneladas (tn)</SelectItem>
                                            <SelectItem value="l">Litros (l)</SelectItem>
                                            <SelectItem value="ml">Mililitros (ml)</SelectItem>
                                            <SelectItem value="u">Unidades (u)</SelectItem>
                                            <SelectItem value="pack">Pack / Paquete</SelectItem>
                                            <SelectItem value="bolsa">Bolsa</SelectItem>
                                            <SelectItem value="ha">Hectáreas (ha)</SelectItem>
                                            <SelectItem value="m2">Metros cuadrados (m2)</SelectItem>
                                            <SelectItem value="m3">Metros cúbicos (m3)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.unidad && (
                                <p className="text-sm text-red-500">{errors.unidad.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock Inicial</Label>
                            <Input
                                id="stock"
                                type="number"
                                step="0.01"
                                {...register("stock_actual")}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label>Moneda</Label>
                            <Controller
                                name="moneda"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Label htmlFor="costo">Costo Unit.</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                                    {selectedMoneda === 'USD' ? 'US$' : '$'}
                                </span>
                                <Input
                                    id="costo"
                                    type="number"
                                    step="0.01"
                                    className="pl-9"
                                    {...register("costo_unitario")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tipo_cambio">Tipo de Cambio</Label>
                            <Input
                                id="tipo_cambio"
                                type="number"
                                step="0.01"
                                {...register("tipo_cambio")}
                                disabled={selectedMoneda === 'ARS'}
                            />
                            {selectedMoneda === 'USD' && (
                                <p className="text-[10px] text-muted-foreground">Cotización Blue autom.</p>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Insumo
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
