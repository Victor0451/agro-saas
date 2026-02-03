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

interface CosechaHistoryItem {
    id: string
    finca_id: string
    fecha: string
    kilos_brutos: number
    cantidad_bultos: number
    clase?: string
    lote?: {
        nombre: string
    }
}

interface CosechaHistoryProps {
    history: CosechaHistoryItem[]
}

export function CosechaHistory({ history }: CosechaHistoryProps) {
    const { activeFincaId, fincas } = useFinca()
    const activeFinca = fincas.find(f => f.id === activeFincaId)

    const filteredHistory = activeFincaId
        ? history.filter((item) => item.finca_id === activeFincaId)
        : []

    const totalKilos = filteredHistory.reduce((acc, curr) => acc + (curr.kilos_brutos || 0), 0)

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Historial de Cosecha</span>
                    {activeFinca && (
                        <div className="text-right">
                            <span className="block text-sm font-normal text-muted-foreground">
                                {activeFinca.nombre}
                            </span>
                            <span className="text-lg font-bold text-green-600">
                                Total: {totalKilos.toLocaleString()} kg
                            </span>
                        </div>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Lote</TableHead>
                            <TableHead>Kilos</TableHead>
                            <TableHead>Clase</TableHead>
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
                                    <TableCell className="font-bold">
                                        {item.kilos_brutos} <span className="text-xs font-normal text-muted-foreground">kg</span>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {item.clase || "-"}
                                        {item.cantidad_bultos > 0 && (
                                            <span className="text-muted-foreground text-xs ml-1">({item.cantidad_bultos} bultos)</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                    {activeFincaId
                                        ? "No hay registros de cosecha."
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
