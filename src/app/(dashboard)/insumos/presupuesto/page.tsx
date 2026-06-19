"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { api } from "@/lib/api"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PresupuestoInsumoForm } from "@/components/forms/presupuesto-insumo-form"
import type { PresupuestoInsumoWithCategoria } from "@/types/insumos"

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

interface InsumoName {
    id: string
    nombre: string
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
})
const usdFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
})

function formatMonto(amount: number, moneda: string): string {
    return moneda === "USD" ? usdFormatter.format(amount) : arsFormatter.format(amount)
}

export default function PresupuestoPage() {
    const today = new Date()
    const [selectedAnio, setSelectedAnio] = useState(today.getFullYear())
    const [selectedMes, setSelectedMes] = useState(today.getMonth() + 1)
    const [periodType, setPeriodType] = useState<"mensual" | "anual">("mensual")

    const [presupuestos, setPresupuestos] = useState<PresupuestoInsumoWithCategoria[]>([])
    const [insumoNames, setInsumoNames] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)

    const [showNewDialog, setShowNewDialog] = useState(false)
    const [editingPresupuesto, setEditingPresupuesto] = useState<PresupuestoInsumoWithCategoria | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchPresupuestos = useCallback(async () => {
        setLoading(true)
        try {
            const data = await api.presupuesto.list({
                anio: selectedAnio,
                mes: periodType === "mensual" ? selectedMes : null,
            })
            setPresupuestos(data)

            const insumoIds = data.filter(p => p.insumo_id != null)
            if (insumoIds.length > 0) {
                const allInsumos = await api.insumos.list() as InsumoName[]
                const map: Record<string, string> = {}
                allInsumos.forEach(i => { map[i.id] = i.nombre })
                setInsumoNames(map)
            }
        } catch (e) {
            console.error("Error cargando presupuestos", e)
        } finally {
            setLoading(false)
        }
    }, [selectedAnio, selectedMes, periodType])

    useEffect(() => {
        fetchPresupuestos()
    }, [fetchPresupuestos])

    async function handleDelete() {
        if (!deletingId) return
        setIsDeleting(true)
        try {
            await api.presupuesto.delete(deletingId)
            setPresupuestos(prev => prev.filter(p => p.id !== deletingId))
        } catch (e) {
            console.error("Error eliminando presupuesto", e)
        } finally {
            setIsDeleting(false)
            setDeletingId(null)
        }
    }

    function formatPeriodo(p: PresupuestoInsumoWithCategoria): string {
        if (p.periodo_mes == null) return `Anual ${p.periodo_anio}`
        const mes = MESES.find(m => m.value === p.periodo_mes)
        return `${mes?.label ?? p.periodo_mes} ${p.periodo_anio}`
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Presupuesto de Insumos</h1>
                    <p className="text-muted-foreground">
                        Establecé montos presupuestados por categoría o insumo.
                    </p>
                </div>
                <Button onClick={() => setShowNewDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo presupuesto
                </Button>
            </div>

            {/* Period selector */}
            <div className="border border-indigo-100 dark:border-indigo-900/20 rounded-lg bg-card shadow-sm p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1.5">
                        <Label>Tipo de período</Label>
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

                    <div className="space-y-1.5">
                        <Label htmlFor="anio-selector">Año</Label>
                        <Input
                            id="anio-selector"
                            type="number"
                            min="2020"
                            max="2100"
                            value={selectedAnio}
                            onChange={e => setSelectedAnio(Number(e.target.value))}
                            className="w-28"
                        />
                    </div>

                    {periodType === "mensual" && (
                        <div className="space-y-1.5">
                            <Label htmlFor="mes-selector">Mes</Label>
                            <select
                                id="mes-selector"
                                value={selectedMes}
                                onChange={e => setSelectedMes(Number(e.target.value))}
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                {MESES.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="border border-indigo-100 dark:border-indigo-900/20 rounded-lg bg-card shadow-sm">
                <Table aria-label="Presupuestos de insumos">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Insumo</TableHead>
                            <TableHead>Período</TableHead>
                            <TableHead className="text-right">Monto Presupuestado</TableHead>
                            <TableHead>Moneda</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <TableCell key={j}>
                                            <div className="h-4 bg-muted animate-pulse rounded" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : presupuestos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    <p className="font-medium">No hay presupuestos para este período.</p>
                                    <p className="text-sm mt-1">Usá el botón "Nuevo presupuesto" para agregar uno.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            presupuestos.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">
                                        {p.categorias_insumos?.nombre ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        {p.insumo_id
                                            ? (insumoNames[p.insumo_id] ?? p.insumo_id)
                                            : <span className="text-muted-foreground text-sm italic">Categoría completa</span>
                                        }
                                    </TableCell>
                                    <TableCell>{formatPeriodo(p)}</TableCell>
                                    <TableCell className="text-right tabular-nums font-semibold">
                                        {formatMonto(p.monto_presupuestado, p.moneda)}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-mono">{p.moneda}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingPresupuesto(p)}
                                                title="Editar presupuesto"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                <span className="sr-only">Editar</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setDeletingId(p.id)}
                                                title="Eliminar presupuesto"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span className="sr-only">Eliminar</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* New presupuesto dialog */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nuevo Presupuesto</DialogTitle>
                    </DialogHeader>
                    <PresupuestoInsumoForm onSuccess={() => {
                        setShowNewDialog(false)
                        fetchPresupuestos()
                    }} />
                </DialogContent>
            </Dialog>

            {/* Edit presupuesto dialog */}
            {editingPresupuesto && (
                <Dialog open={!!editingPresupuesto} onOpenChange={(open) => { if (!open) setEditingPresupuesto(null) }}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Editar Presupuesto</DialogTitle>
                        </DialogHeader>
                        <PresupuestoInsumoForm
                            initialData={editingPresupuesto}
                            onSuccess={() => {
                                setEditingPresupuesto(null)
                                fetchPresupuestos()
                            }}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete confirmation */}
            <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El presupuesto será eliminado permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
