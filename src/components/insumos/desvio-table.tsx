"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DeviationRow, InsumoBreakdownRow } from "@/types/insumos"

interface DesvioTableProps {
    data: DeviationRow[]
    breakdown?: InsumoBreakdownRow[]
    isLoading?: boolean
    moneda?: "ARS" | "USD"
}

function makeFormatter(moneda: "ARS" | "USD") {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: moneda,
        minimumFractionDigits: 2,
    })
}

function getEstado(row: DeviationRow): {
    label: string
    className: string
    variant: "default" | "secondary" | "destructive" | "outline"
} {
    if (row.monto_presupuestado === 0) {
        return { label: "Sin presupuesto", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", variant: "outline" }
    }
    const pct = row.desvio_pct ?? 0
    if (pct > 5) {
        return { label: "Excedido", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", variant: "destructive" }
    }
    if (pct < -5) {
        return { label: "Bajo presupuesto", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", variant: "default" }
    }
    return { label: "En presupuesto", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", variant: "secondary" }
}

function abbreviate(name: string, maxLen = 12): string {
    return name.length > maxLen ? name.slice(0, maxLen - 1) + "…" : name
}

function YAxisTickFormatter(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
    return `$${value}`
}

export function DesvioTable({ data, breakdown, isLoading, moneda = "ARS" }: DesvioTableProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const format = (v: number) => makeFormatter(moneda).format(v)

    function toggleCategory(categoriaId: string) {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(categoriaId)) {
                next.delete(categoriaId)
            } else {
                next.add(categoriaId)
            }
            return next
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
                <span>Cargando informe...</span>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center py-12 text-muted-foreground border rounded-lg">
                <span>No hay datos para el período seleccionado.</span>
            </div>
        )
    }

    const chartData = data.map(row => ({
        name: abbreviate(row.categoria_nombre),
        Presupuestado: row.monto_presupuestado,
        Real: row.gasto_real,
    }))

    // Build a lookup: categoria_id -> InsumoBreakdownRow[]
    const breakdownByCategory = new Map<string, InsumoBreakdownRow[]>()
    for (const row of breakdown ?? []) {
        const existing = breakdownByCategory.get(row.categoria_id)
        if (existing) {
            existing.push(row)
        } else {
            breakdownByCategory.set(row.categoria_id, [row])
        }
    }

    return (
        <div className="space-y-6">
            {/* Summary table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Presupuestado</TableHead>
                            <TableHead className="text-right">Gasto Real</TableHead>
                            <TableHead className="text-right">Desvío ($)</TableHead>
                            <TableHead className="text-right">Desvío (%)</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => {
                            const estado = getEstado(row)
                            const isOver = (row.desvio_pct ?? 0) > 5
                            const isUnder = (row.desvio_pct ?? 0) < -5
                            const insumoRows = breakdownByCategory.get(row.categoria_id) ?? []
                            const hasBreakdown = insumoRows.length > 0
                            const isExpanded = expandedCategories.has(row.categoria_id)

                            return (
                                <React.Fragment key={row.categoria_id}>
                                    <TableRow
                                        className={hasBreakdown ? "cursor-pointer hover:bg-muted/50" : undefined}
                                        onClick={hasBreakdown ? () => toggleCategory(row.categoria_id) : undefined}
                                    >
                                        <TableCell className="font-medium">
                                            <span className="flex items-center gap-1">
                                                {hasBreakdown && (
                                                    isExpanded
                                                        ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                )}
                                                {row.categoria_nombre}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {format(row.monto_presupuestado)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {format(row.gasto_real)}
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right tabular-nums font-medium",
                                            isOver && "text-red-600 dark:text-red-400",
                                            isUnder && "text-blue-600 dark:text-blue-400",
                                        )}>
                                            {row.desvio_monto >= 0 ? "+" : ""}{format(row.desvio_monto)}
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right tabular-nums",
                                            isOver && "text-red-600 dark:text-red-400",
                                            isUnder && "text-blue-600 dark:text-blue-400",
                                        )}>
                                            {row.desvio_pct != null
                                                ? `${row.desvio_pct >= 0 ? "+" : ""}${row.desvio_pct.toFixed(1)}%`
                                                : "—"
                                            }
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={estado.variant}
                                                className={cn(estado.className)}
                                                aria-label={`Estado: ${estado.label}`}
                                            >
                                                {estado.label}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    {hasBreakdown && isExpanded && insumoRows.map((insumo) => (
                                        <TableRow
                                            key={insumo.insumo_id}
                                            className="bg-muted/30 text-sm"
                                        >
                                            <TableCell className="pl-8 text-muted-foreground">
                                                {insumo.insumo_nombre}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">—</TableCell>
                                            <TableCell className="text-right tabular-nums text-muted-foreground">
                                                {format(insumo.gasto_real)}
                                            </TableCell>
                                            <TableCell />
                                            <TableCell />
                                            <TableCell />
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Bar chart */}
            <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
                    Presupuestado vs. Real por Categoría
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={YAxisTickFormatter}
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            formatter={(value: number) => format(value)}
                            contentStyle={{ fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Presupuestado" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Real" fill="#f97316" radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
