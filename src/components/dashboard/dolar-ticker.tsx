"use client"

import { useEffect, useState } from "react"
import { getDolarQuotations, DolarQuotation } from "@/lib/services/dolar-api"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, TrendingUp } from "lucide-react"

export function DolarTicker() {
    const [quotations, setQuotations] = useState<DolarQuotation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getDolarQuotations()
                // Filter primarily for Oficial and Blue which are most relevant
                const filtered = data.filter(q => q.casa === "oficial" || q.casa === "blue" || q.casa === "mep")
                setQuotations(filtered)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground animate-pulse">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Cargando cotizaciones...</span>
            </div>
        )
    }

    return (
        <div className="flex flex-wrap gap-4">
            {quotations.map((q) => (
                <Card key={q.casa} className="min-w-[140px] shadow-sm border-l-4 border-l-green-600">
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium uppercase text-muted-foreground">{q.nombre}</span>
                            <TrendingUp className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-foreground">
                                ${q.venta}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                Compra: ${q.compra}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
