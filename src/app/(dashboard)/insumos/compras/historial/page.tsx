"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, ShoppingBag } from "lucide-react"
import { api } from "@/lib/api"

import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import type { CompraInsumoWithRelations } from "@/types/insumos"

interface Category {
    id: string
    nombre: string
}

interface InsumoOption {
    id: string
    nombre: string
    categoria_id: string
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

export default function HistorialComprasPage() {
    const [compras, setCompras] = useState<CompraInsumoWithRelations[]>([])
    const [loading, setLoading] = useState(true)

    const [categorias, setCategorias] = useState<Category[]>([])
    const [allInsumos, setAllInsumos] = useState<InsumoOption[]>([])

    // Filter state
    const [filterCategoria, setFilterCategoria] = useState<string>("all")
    const [filterInsumo, setFilterInsumo] = useState<string>("all")
    const [fechaDesde, setFechaDesde] = useState<string>("")
    const [fechaHasta, setFechaHasta] = useState<string>("")

    // Load categories + insumos on mount
    useEffect(() => {
        async function loadCategorias() {
            try {
                const res = await fetch("/api/insumos/categorias")
                if (res.ok) setCategorias(await res.json())
            } catch (e) {
                console.error("Error cargando categorías", e)
            }
        }
        async function loadAllInsumos() {
            try {
                const res = await fetch("/api/insumos")
                if (res.ok) setAllInsumos(await res.json())
            } catch (e) {
                console.error("Error cargando insumos", e)
            }
        }
        loadCategorias()
        loadAllInsumos()
    }, [])

    // Derived: insumos for selected category
    const insumos = filterCategoria === "all"
        ? allInsumos
        : allInsumos.filter(i => i.categoria_id === filterCategoria)

    // Reset insumo filter when category changes
    useEffect(() => {
        setFilterInsumo("all")
    }, [filterCategoria])

    const fetchCompras = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterCategoria !== "all") params.set("categoria_id", filterCategoria)
            if (filterInsumo !== "all") params.set("insumo_id", filterInsumo)
            if (fechaDesde) params.set("fecha_desde", fechaDesde)
            if (fechaHasta) params.set("fecha_hasta", fechaHasta)

            const compras = await api.compras.list({
                categoria_id: filterCategoria !== "all" ? filterCategoria : undefined,
                insumo_id: filterInsumo !== "all" ? filterInsumo : undefined,
                from: fechaDesde || undefined,
                to: fechaHasta || undefined,
            })
            setCompras(compras)
        } catch (e) {
            console.error("Error cargando historial", e)
        } finally {
            setLoading(false)
        }
    }, [filterCategoria, filterInsumo, fechaDesde, fechaHasta])

    // Load on mount
    useEffect(() => {
        fetchCompras()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Totals in ARS
    const totalARS = compras.reduce((acc, c) => {
        const total = c.cantidad * c.costo_unitario
        return acc + (c.moneda === "USD" ? total * (c.tipo_cambio ?? 1) : total)
    }, 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Historial de Compras</h1>
                <p className="text-muted-foreground">
                    Registro de todas las compras de insumos realizadas.
                </p>
            </div>

            {/* Filter bar */}
            <div className="border border-indigo-100 dark:border-indigo-900/20 rounded-lg bg-card shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label>Categoría</Label>
                        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {categorias.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Insumo</Label>
                        <Select
                            value={filterInsumo}
                            onValueChange={setFilterInsumo}
                            disabled={filterCategoria === "all"}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={filterCategoria === "all" ? "Seleccioná categoría primero" : "Todos"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {insumos.map(ins => (
                                    <SelectItem key={ins.id} value={ins.id}>{ins.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="fecha-desde">Fecha desde</Label>
                        <Input
                            id="fecha-desde"
                            type="date"
                            value={fechaDesde}
                            onChange={e => setFechaDesde(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="fecha-hasta">Fecha hasta</Label>
                        <Input
                            id="fecha-hasta"
                            type="date"
                            value={fechaHasta}
                            onChange={e => setFechaHasta(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button onClick={fetchCompras} disabled={loading}>
                        <Search className="mr-2 h-4 w-4" />
                        {loading ? "Filtrando..." : "Filtrar"}
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="border border-indigo-100 dark:border-indigo-900/20 rounded-lg bg-card shadow-sm">
                <Table aria-label="Historial de compras de insumos">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Insumo</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead>Unidad</TableHead>
                            <TableHead className="text-right">Costo Unitario</TableHead>
                            <TableHead>Moneda</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Notas</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 9 }).map((_, j) => (
                                        <TableCell key={j}>
                                            <div className="h-4 bg-muted animate-pulse rounded" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : compras.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-3">
                                        <ShoppingBag className="h-10 w-10 opacity-30" />
                                        <p className="font-medium">No hay compras registradas.</p>
                                        <Link href="/insumos/compras">
                                            <Button variant="outline" size="sm">Registrar primera compra</Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            compras.map(compra => {
                                const total = compra.cantidad * compra.costo_unitario
                                return (
                                    <TableRow key={compra.id}>
                                        <TableCell className="tabular-nums">
                                            {new Date(compra.fecha_compra + "T00:00:00").toLocaleDateString("es-AR")}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {compra.insumos?.nombre ?? "—"}
                                        </TableCell>
                                        <TableCell>
                                            {compra.insumos?.categorias_insumos?.nombre ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {compra.cantidad}
                                        </TableCell>
                                        <TableCell>
                                            {compra.insumos?.unidad ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {formatMonto(compra.costo_unitario, compra.moneda)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-mono">{compra.moneda}</span>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums font-semibold">
                                            {formatMonto(total, compra.moneda)}
                                        </TableCell>
                                        <TableCell className="max-w-[160px] truncate text-muted-foreground text-sm">
                                            {compra.notas ?? "—"}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                    {!loading && compras.length > 0 && (
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={7} className="font-semibold text-right text-muted-foreground">
                                    Total estimado (ARS)
                                </TableCell>
                                <TableCell className="text-right tabular-nums font-bold">
                                    {arsFormatter.format(totalARS)}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>
        </div>
    )
}
