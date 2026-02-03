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
    moneda: string
    tipo_cambio: number
    fecha_compra?: string
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

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency === 'USD' ? 'USD' : 'ARS',
            minimumFractionDigits: 2
        }).format(amount)
    }

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
                <div className="max-w-2xl mx-auto animate-in slide-in-from-top-4 fade-in duration-300 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-lg bg-background shadow-lg items-center relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">Registrar Nuevo Insumo</h3>
                    </div>
                    <InsumoForm onSuccess={() => {
                        setShowForm(false)
                        fetchInsumos()
                    }} />
                </div>
            )}

            <div className="border border-indigo-100 dark:border-indigo-900/20 rounded-lg bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Stock Actual</TableHead>
                            <TableHead>Costo Unit.</TableHead>
                            <TableHead>Cotización al Momento de la compra</TableHead>
                            <TableHead className="text-right">Valor Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    <RotateCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : insumos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No hay insumos registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            insumos.map((insumo) => {
                                const total = insumo.stock_actual * insumo.costo_unitario
                                const isUSD = insumo.moneda === 'USD'
                                const totalARS = isUSD ? total * (insumo.tipo_cambio || 1) : total

                                return (
                                    <TableRow key={insumo.id}>
                                        <TableCell>
                                            {insumo.fecha_compra ? new Date(insumo.fecha_compra).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell className="font-medium">{insumo.nombre}</TableCell>
                                        <TableCell>{insumo.categorias_insumos?.nombre || "General"}</TableCell>
                                        <TableCell>{insumo.stock_actual} {insumo.unidad}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {formatCurrency(insumo.costo_unitario, insumo.moneda)}
                                                </span>
                                                {isUSD && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        ~ {formatCurrency(insumo.costo_unitario * (insumo.tipo_cambio || 1), 'ARS')}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isUSD ? (
                                                <span className="text-sm">
                                                    $ {insumo.tipo_cambio}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold">
                                                    {formatCurrency(total, insumo.moneda)}
                                                </span>
                                                {isUSD && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Est: {formatCurrency(totalARS, 'ARS')}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Editar</Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
