"use client"

import { useState, useEffect } from "react"
import { Loader2, Check, Plus } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CatalogoInsumo } from "@/types/insumos"
import { api } from "@/lib/api"

interface AddFromCatalogoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

interface Category {
    id: string
    nombre: string
}

interface TenantInsumo {
    id: string
    catalogo_id: string | null
    nombre: string
}

interface OverrideForm {
    nombre: string
    unidad: string
}

export function AddFromCatalogoDialog({ open, onOpenChange, onSuccess }: AddFromCatalogoDialogProps) {
    const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("")
    const [categorias, setCategorias] = useState<Category[]>([])
    const [loadingCats, setLoadingCats] = useState(true)

    const [catalogoItems, setCatalogoItems] = useState<CatalogoInsumo[]>([])
    const [loadingCatalogo, setLoadingCatalogo] = useState(false)

    const [tenantInsumos, setTenantInsumos] = useState<TenantInsumo[]>([])
    const [loadingTenant, setLoadingTenant] = useState(true)

    // Item being confirmed (inline override form)
    const [pendingItem, setPendingItem] = useState<CatalogoInsumo | null>(null)
    const [overrideForm, setOverrideForm] = useState<OverrideForm>({ nombre: "", unidad: "" })
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    // IDs already added by tenant
    const addedCatalogoIds = new Set(
        tenantInsumos
            .filter(i => i.catalogo_id != null)
            .map(i => i.catalogo_id as string)
    )

    // Load categories
    useEffect(() => {
        if (!open) return
        setLoadingCats(true)
        api.categorias.list()
            .then(data => setCategorias(data))
            .catch(e => console.error("Error cargando categorías", e))
            .finally(() => setLoadingCats(false))
    }, [open])

    // Load tenant insumos (to know what's already added)
    useEffect(() => {
        if (!open) return
        setLoadingTenant(true)
        api.insumos.list()
            .then(data => setTenantInsumos(data as TenantInsumo[]))
            .catch(e => console.error("Error cargando insumos del tenant", e))
            .finally(() => setLoadingTenant(false))
    }, [open])

    // Load catalog items when category changes
    useEffect(() => {
        if (!selectedCategoriaId) {
            setCatalogoItems([])
            return
        }
        setLoadingCatalogo(true)
        api.catalogo.list({ categoria_id: selectedCategoriaId })
            .then(data => setCatalogoItems(data))
            .catch(e => console.error("Error cargando catálogo", e))
            .finally(() => setLoadingCatalogo(false))
    }, [selectedCategoriaId])

    function handleAgregar(item: CatalogoInsumo) {
        setPendingItem(item)
        setOverrideForm({ nombre: item.nombre, unidad: item.unidad_default })
        setSubmitError(null)
    }

    async function handleConfirm() {
        if (!pendingItem || !selectedCategoriaId) return

        setSubmitting(true)
        setSubmitError(null)

        try {
            await api.insumos.create({
                catalogo_id: pendingItem.id,
                nombre: overrideForm.nombre || pendingItem.nombre,
                unidad: overrideForm.unidad || pendingItem.unidad_default,
                categoria_id: selectedCategoriaId,
            })
            // Refresh tenant insumos list (so the item becomes disabled)
            const refreshed = await api.insumos.list()
            setTenantInsumos(refreshed as TenantInsumo[])

            setPendingItem(null)
            onSuccess?.()
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : "Error desconocido")
        } finally {
            setSubmitting(false)
        }
    }

    function handleCancel() {
        setPendingItem(null)
        setSubmitError(null)
    }

    const isLoading = loadingCats || loadingTenant

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Agregar desde el Catálogo</DialogTitle>
                    <DialogDescription>
                        Seleccioná una categoría y elegí los insumos que querés agregar a tu lista.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {/* Category selector */}
                    <div className="space-y-2">
                        <Label htmlFor="cat-select">Categoría</Label>
                        <Select
                            value={selectedCategoriaId}
                            onValueChange={(val) => {
                                setSelectedCategoriaId(val)
                                setPendingItem(null)
                            }}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="cat-select">
                                <SelectValue placeholder={isLoading ? "Cargando..." : "Seleccioná una categoría"} />
                            </SelectTrigger>
                            <SelectContent>
                                {categorias.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Catalog items list */}
                    {selectedCategoriaId && (
                        <div className="space-y-2">
                            {loadingCatalogo ? (
                                <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cargando catálogo...
                                </div>
                            ) : catalogoItems.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4">
                                    No hay insumos en esta categoría.
                                </p>
                            ) : (
                                <ul className="divide-y rounded-md border overflow-hidden" role="list" aria-label="Insumos del catálogo">
                                    {catalogoItems.map(item => {
                                        const alreadyAdded = addedCatalogoIds.has(item.id)
                                        const isPending = pendingItem?.id === item.id

                                        return (
                                            <li key={item.id}>
                                                <div className={cn(
                                                    "flex items-center justify-between px-3 py-2.5",
                                                    alreadyAdded && "bg-muted/60 opacity-60"
                                                )}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {alreadyAdded && (
                                                            <Check className="h-4 w-4 text-green-600 shrink-0" aria-label="Ya agregado" />
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{item.nombre}</p>
                                                            <p className="text-xs text-muted-foreground">{item.unidad_default}</p>
                                                        </div>
                                                    </div>
                                                    {alreadyAdded ? (
                                                        <Badge variant="secondary" className="shrink-0 text-xs">
                                                            Agregado
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="shrink-0"
                                                            onClick={() => handleAgregar(item)}
                                                            disabled={isPending}
                                                        >
                                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                                            Agregar
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Inline override form */}
                                                {isPending && (
                                                    <div className="px-3 pb-3 pt-1 bg-muted/30 border-t space-y-3">
                                                        <p className="text-xs text-muted-foreground">
                                                            Podés personalizar el nombre y la unidad antes de confirmar.
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="space-y-1">
                                                                <Label htmlFor={`nombre-${item.id}`} className="text-xs">
                                                                    Nombre
                                                                </Label>
                                                                <Input
                                                                    id={`nombre-${item.id}`}
                                                                    value={overrideForm.nombre}
                                                                    onChange={e => setOverrideForm(f => ({ ...f, nombre: e.target.value }))}
                                                                    className="h-8 text-sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label htmlFor={`unidad-${item.id}`} className="text-xs">
                                                                    Unidad
                                                                </Label>
                                                                <Input
                                                                    id={`unidad-${item.id}`}
                                                                    value={overrideForm.unidad}
                                                                    onChange={e => setOverrideForm(f => ({ ...f, unidad: e.target.value }))}
                                                                    className="h-8 text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        {submitError && (
                                                            <p className="text-xs text-red-500">{submitError}</p>
                                                        )}
                                                        <div className="flex gap-2 justify-end">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={handleCancel}
                                                                disabled={submitting}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={handleConfirm}
                                                                disabled={submitting || !overrideForm.nombre || !overrideForm.unidad}
                                                            >
                                                                {submitting && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                                                                Confirmar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
