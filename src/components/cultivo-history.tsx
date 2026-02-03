"use client"

import { useFinca } from "@/contexts/finca-context"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface LaborHistoryItem {
    id: string
    finca_id: string
    fecha: string
    tipo_labor: string
    lote?: {
        nombre: string
    }
    detalles?: {
        cantidad: number
        insumo?: {
            nombre: string
            unidad: string
        }
    }[]
}

interface CultivoHistoryProps {
    history: LaborHistoryItem[]
}

export function CultivoHistory({ history }: CultivoHistoryProps) {
    const { activeFincaId, fincas } = useFinca()
    const activeFinca = fincas.find(f => f.id === activeFincaId)

    const filteredHistory = activeFincaId
        ? history.filter((item) => item.finca_id === activeFincaId)
        : []

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Historial de Labores</span>
                    {activeFinca && (
                        <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                            {activeFinca.nombre}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Lote</TableHead>
                            <TableHead>Labor</TableHead>
                            <TableHead>Insumos</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-muted-foreground">
                                        {format(new Date(item.fecha), 'dd/MM/yy')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-semibold">
                                            {item.lote?.nombre || "S/D"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{item.tipo_labor}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {item.detalles && item.detalles.length > 0 ? (
                                            <ul className="list-disc pl-3">
                                                {item.detalles.map((d, idx) => (
                                                    <li key={idx}>
                                                        {d.insumo?.nombre}: {d.cantidad} {d.insumo?.unidad}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="opacity-50">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                    {activeFincaId
                                        ? "No hay labores registradas en esta finca."
                                        : "Seleccione una finca para ver el historial."
                                    }
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
