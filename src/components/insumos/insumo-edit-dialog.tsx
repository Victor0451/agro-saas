"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Info } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { UpdateInsumoSchema, type UpdateInsumoInput } from "@/lib/validations/insumo"
import { stockMinimoDefault } from "@/lib/validations/insumo"
import { api } from "@/lib/api"

interface InsumoEditDialogProps {
    insumo: {
        id: string
        nombre: string
        unidad: string
        categoria_id: string
        catalogo_id: string | null
        stock_minimo?: number
    }
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

interface Category {
    id: string
    nombre: string
}

export function InsumoEditDialog({ insumo, open, onOpenChange, onSuccess }: InsumoEditDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [categorias, setCategorias] = useState<Category[]>([])
    const [loadingCats, setLoadingCats] = useState(true)

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<UpdateInsumoInput>({
        resolver: zodResolver(UpdateInsumoSchema),
        defaultValues: {
            nombre: insumo.nombre,
            unidad: insumo.unidad,
            categoria_id: insumo.categoria_id,
            stock_minimo: insumo.stock_minimo ?? stockMinimoDefault(insumo.unidad),
        },
    })

    // Reload form values if insumo changes
    useEffect(() => {
        reset({
            nombre: insumo.nombre,
            unidad: insumo.unidad,
            categoria_id: insumo.categoria_id,
            stock_minimo: insumo.stock_minimo ?? stockMinimoDefault(insumo.unidad),
        })
        setError(null)
    }, [insumo, reset])

    // Load categories
    useEffect(() => {
        if (!open) return
        api.categorias.list()
            .then(data => setCategorias(data))
            .catch(e => console.error("Error cargando categorías", e))
            .finally(() => setLoadingCats(false))
    }, [open])

    async function onSubmit(data: UpdateInsumoInput) {
        setIsSubmitting(true)
        setError(null)

        try {
            await api.insumos.update(insumo.id, data)
            onOpenChange(false)
            onSuccess?.()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error desconocido"
            setError(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Insumo</DialogTitle>
                    <DialogDescription>
                        Modificá el nombre, unidad o categoría de este insumo.
                    </DialogDescription>
                </DialogHeader>

                {insumo.catalogo_id && (
                    <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>
                            Este insumo fue agregado desde el catálogo. Podés personalizarlo.
                        </span>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-nombre">Nombre</Label>
                        <Input
                            id="edit-nombre"
                            {...register("nombre")}
                            placeholder="Nombre del insumo"
                        />
                        {errors.nombre && (
                            <p className="text-sm text-red-500">{errors.nombre.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-unidad">Unidad</Label>
                        <Input
                            id="edit-unidad"
                            {...register("unidad")}
                            placeholder="Ej: kg, l, u"
                        />
                        {errors.unidad && (
                            <p className="text-sm text-red-500">{errors.unidad.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-categoria">Categoría</Label>
                        <Controller
                            name="categoria_id"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={loadingCats}
                                >
                                    <SelectTrigger id="edit-categoria">
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
                        <Label htmlFor="edit-stock-minimo">Alerta mínima</Label>
                        <Input
                            id="edit-stock-minimo"
                            type="number"
                            step="0.01"
                            min="0"
                            {...register("stock_minimo", { valueAsNumber: true })}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Se alerta cuando el stock baja de este valor
                        </p>
                        {errors.stock_minimo && (
                            <p className="text-sm text-red-500">{errors.stock_minimo.message}</p>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
