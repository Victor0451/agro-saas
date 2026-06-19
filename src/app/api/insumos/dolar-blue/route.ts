import { NextResponse } from 'next/server'
import { getDolarQuotations } from '@/lib/services/dolar-api'

export async function GET() {
    try {
        const quotations = await getDolarQuotations()

        const blue = quotations.find((q) => q.casa === 'blue')

        if (!blue) {
            return NextResponse.json(
                { error: 'No se pudo obtener la cotización del dólar blue' },
                { status: 503 }
            )
        }

        return NextResponse.json(
            { compra: blue.compra, venta: blue.venta },
            { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } }
        )
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
