"use client"

import { useState, useEffect, useCallback } from "react"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { DesvioTable } from "@/components/insumos/desvio-table"
import type { DeviationRow, InsumoBreakdownRow } from "@/types/insumos"
import { api } from "@/lib/api"

type Moneda = "ARS" | "USD"

const MESES = [
    { value: 1,  label: "Enero" },
    { value: 2,  label: "Febrero" },
    { value: 3,  label: "Marzo" },
    { value: 4,  label: "Abril" },
    { value: 5,  label: "Mayo" },
    { value: 6,  label: "Junio" },
    { value: 7,  label: "Julio" },
    { value: 8,  label: "Agosto" },
    { value: 9,  label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
]

function makeFormatter(moneda: Moneda) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: moneda,
        minimumFractionDigits: 2,
    })
}

export default function InformePage() {
    const today = new Date()

    // Filters
    const [periodType,    setPeriodType]    = useState<"mensual" | "anual">("mensual")
    const [selectedAnio,  setSelectedAnio]  = useState(today.getFullYear())
    const [selectedMes,   setSelectedMes]   = useState(today.getMonth() + 1)
    const [monedaInforme, setMonedaInforme] = useState<Moneda>("ARS")
    const [tipoCambioRef, setTipoCambioRef] = useState<number>(1)
    const [loadingTc,     setLoadingTc]     = useState(false)

    // Data
    const [data,      setData]      = useState<DeviationRow[]>([])
    const [breakdown, setBreakdown] = useState<InsumoBreakdownRow[]>([])
    const [loading,   setLoading]   = useState(false)

    // Pre-fill tipo de cambio con dólar blue al montar
    useEffect(() => {
        setLoadingTc(true)
        fetch("/api/insumos/dolar-blue")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.venta) setTipoCambioRef(d.venta) })
            .catch(() => {})
            .finally(() => setLoadingTc(false))
    }, [])

    const fetchInforme = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                anio:             String(selectedAnio),
                tipo_cambio_ref:  String(tipoCambioRef),
                moneda_salida:    monedaInforme,
            })
            if (periodType === "mensual") params.set("mes", String(selectedMes))

            const result = await api.informe.get({
                anio: selectedAnio,
                mes: periodType === "mensual" ? selectedMes : null,
                tipo_cambio_ref: tipoCambioRef,
                moneda_salida: monedaInforme as "ARS" | "USD",
            })
            setData(result.report)
            setBreakdown(result.breakdown)
        } catch (e) {
            console.error("Error cargando informe", e)
        } finally {
            setLoading(false)
        }
    }, [selectedAnio, selectedMes, periodType, monedaInforme, tipoCambioRef])

    // Auto-fetch on mount and whenever filters change
    useEffect(() => {
        fetchInforme()
    }, [fetchInforme])

    const formatter = makeFormatter(monedaInforme)

    // Summary
    const totalPresupuestado = data.reduce((acc, r) => acc + r.monto_presupuestado, 0)
    const totalGasto         = data.reduce((acc, r) => acc + r.gasto_real, 0)
    const totalDesvioMonto   = totalGasto - totalPresupuestado
    const totalDesvioPct     = totalPresupuestado > 0
        ? (totalDesvioMonto / totalPresupuestado) * 100
        : null

    const periodoLabel = periodType === "mensual"
        ? `${MESES.find(m => m.value === selectedMes)?.label ?? selectedMes} ${selectedAnio}`
        : `Año ${selectedAnio}`

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Informe de Desvío</h1>
                    <p className="text-muted-foreground">
                        Comparativo entre presupuesto y gasto real por categoría de insumos.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchInforme}
                    disabled={loading}
                    className="shrink-0"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Actualizar
                </Button>
            </div>

            {/* Filters */}
            <div className="border rounded-lg bg-card shadow-sm p-4">
                <div className="flex flex-wrap items-end gap-4">

                    {/* Período */}
                    <div className="space-y-1.5">
                        <Label>Período</Label>
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

                    {/* Año */}
                    <div className="space-y-1.5">
                        <Label htmlFor="informe-anio">Año</Label>
                        <Input
                            id="informe-anio"
                            type="number"
                            min="2020"
                            max="2100"
                            value={selectedAnio}
                            onChange={e => setSelectedAnio(Number(e.target.value))}
                            className="w-28"
                        />
                    </div>

                    {/* Mes */}
                    {periodType === "mensual" && (
                        <div className="space-y-1.5">
                            <Label htmlFor="informe-mes">Mes</Label>
                            <select
                                id="informe-mes"
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

                    {/* Moneda del informe */}
                    <div className="space-y-1.5">
                        <Label>Moneda del informe</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={monedaInforme === "ARS" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setMonedaInforme("ARS")}
                            >
                                Pesos (ARS)
                            </Button>
                            <Button
                                type="button"
                                variant={monedaInforme === "USD" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setMonedaInforme("USD")}
                            >
                                Dólar (USD)
                            </Button>
                        </div>
                    </div>

                    {/* Tipo de cambio referencia */}
                    <div className="space-y-1.5">
                        <Label htmlFor="tipo-cambio-ref" className="flex items-center gap-1">
                            TC Referencia
                            {loadingTc && <span className="text-xs text-blue-500 animate-pulse">cargando...</span>}
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                            <Input
                                id="tipo-cambio-ref"
                                type="number"
                                step="0.01"
                                min="1"
                                value={tipoCambioRef}
                                onChange={e => setTipoCambioRef(Number(e.target.value))}
                                className="w-32 pl-7"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">USD ↔ ARS (blue)</p>
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            {data.length > 0 && (
                <>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                        Resumen — {periodoLabel} · en {monedaInforme}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Total Presupuestado
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold tabular-nums">
                                    {formatter.format(totalPresupuestado)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    Total Gasto Real
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold tabular-nums">
                                    {formatter.format(totalGasto)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className={
                            totalDesvioMonto > 0 ? "border-red-200 dark:border-red-900/30"
                            : totalDesvioMonto < 0 ? "border-blue-200 dark:border-blue-900/30"
                            : "border-green-200 dark:border-green-900/30"
                        }>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    {totalDesvioMonto > 0
                                        ? <TrendingUp className="h-4 w-4 text-red-500" />
                                        : <TrendingDown className="h-4 w-4 text-blue-500" />
                                    }
                                    Desvío ({monedaInforme})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={`text-2xl font-bold tabular-nums ${
                                    totalDesvioMonto > 0 ? "text-red-600 dark:text-red-400"
                                    : totalDesvioMonto < 0 ? "text-blue-600 dark:text-blue-400"
                                    : "text-green-600 dark:text-green-400"
                                }`}>
                                    {totalDesvioMonto >= 0 ? "+" : ""}{formatter.format(totalDesvioMonto)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className={
                            totalDesvioPct != null && totalDesvioPct > 5 ? "border-red-200 dark:border-red-900/30"
                            : totalDesvioPct != null && totalDesvioPct < -5 ? "border-blue-200 dark:border-blue-900/30"
                            : "border-green-200 dark:border-green-900/30"
                        }>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    {totalDesvioPct != null && totalDesvioPct > 5
                                        ? <TrendingUp className="h-4 w-4 text-red-500" />
                                        : <TrendingDown className="h-4 w-4 text-blue-500" />
                                    }
                                    Desvío (%)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={`text-2xl font-bold tabular-nums ${
                                    totalDesvioPct != null && totalDesvioPct > 5 ? "text-red-600 dark:text-red-400"
                                    : totalDesvioPct != null && totalDesvioPct < -5 ? "text-blue-600 dark:text-blue-400"
                                    : "text-green-600 dark:text-green-400"
                                }`}>
                                    {totalDesvioPct != null
                                        ? `${totalDesvioPct >= 0 ? "+" : ""}${totalDesvioPct.toFixed(1)}%`
                                        : "—"
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* Tabla */}
            <DesvioTable
                data={data}
                breakdown={breakdown}
                isLoading={loading}
                moneda={monedaInforme}
            />
        </div>
    )
}
