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

interface PlantacionHistoryItem {
    id: string
    finca_id: string
    fecha: string
    variedad?: string
    cantidad_plantas: number
    superficie_cubierta?: number
    lote?: {
        nombre: string
    }
}

interface PlantacionHistoryProps {
    history: PlantacionHistoryItem[]
}

export function PlantacionHistory({ history }: PlantacionHistoryProps) {
    const { activeFincaId, fincas } = useFinca()
    const activeFinca = fincas.find(f => f.id === activeFincaId)

    const filteredHistory = activeFincaId
        ? history.filter((item) => item.finca_id === activeFincaId)
        : []

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Avance de Plantación</span>
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
                            <TableHead>Variedad</TableHead>
                            <TableHead className="text-right">Plantas</TableHead>
                            <TableHead className="text-right">Sup.</TableHead>
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
                                    <TableCell>{item.variedad}</TableCell>
                                    <TableCell className="text-right font-bold">{item.cantidad_plantas}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {item.superficie_cubierta ? `${item.superficie_cubierta} ha` : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    {activeFincaId
                                        ? "No hay registros de plantación en esta finca."
                                        : "Seleccione una finca para ver el avance."
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
