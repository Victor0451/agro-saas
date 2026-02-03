"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, RotateCw } from "lucide-react"
import { InsumoForm } from "@/components/forms/insumo-form"

interface Insumo {
    id: string
    nombre: string
    stock_actual: number
    unidad: string
    costo_unitario: number
    categorias_insumos?: {
        nombre: string
    }
}

export default function InsumosPage() {
    const [insumos, setInsumos] = useState<Insumo[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const supabase = createClient()

    const fetchInsumos = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
            .from('insumos')
            .select(`
            *,
            categorias_insumos (nombre)
        `)
            .order('nombre')

        if (data) setInsumos(data as unknown as Insumo[])
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchInsumos()
    }, [fetchInsumos])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Insumos</h1>
                    <p className="text-muted-foreground">
                        Control de stock y costos de materiales.
                    </p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancelar" : (
                        <>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Insumo
                        </>
                    )}
                </Button>
            </div>

            {showForm && (
                <div className="max-w-2xl mx-auto animate-in slide-in-from-top-4 fade-in duration-300">
                    <InsumoForm onSuccess={() => {
                        setShowForm(false)
                        fetchInsumos()
                    }} />
                </div>
            )}

            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Stock Actual</TableHead>
                            <TableHead>Costo Unitario</TableHead>
                            <TableHead className="text-right">Valor Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <RotateCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : insumos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay insumos registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            insumos.map((insumo) => (
                                <TableRow key={insumo.id}>
                                    <TableCell className="font-medium">{insumo.nombre}</TableCell>
                                    <TableCell>{insumo.categorias_insumos?.nombre || "General"}</TableCell>
                                    <TableCell>{insumo.stock_actual} {insumo.unidad}</TableCell>
                                    <TableCell>${insumo.costo_unitario}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${(insumo.stock_actual * insumo.costo_unitario).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">Editar</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
