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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState } from "react"

interface LaborDetail {
    cantidad: number
    insumo: {
        nombre: string
        unidad: string
    }
}

interface LaborHistoryItem {
    id: string
    finca_id: string
    fecha: string
    tipo_labor: string
    estado_fenologico?: string
    lote?: {
        nombre: string
    }
    jornales?: number
    costo_jornales?: number
    moneda?: string
    tipo_cambio?: number
    detalles: LaborDetail[]
    personal?: {
        dias_trabajados: number
        personal: {
            nombre: string
        }
    }[]
}

interface LaborHistoryProps {
    history: LaborHistoryItem[]
    onEdit?: (item: LaborHistoryItem) => void
    onDelete?: (id: string) => void
    // Pagination
    currentPage?: number
    totalPages?: number
    onPageChange?: (page: number) => void
    limit?: number
    onLimitChange?: (limit: number) => void
    totalCount?: number
}

export function LaborHistory({
    history,
    onEdit,
    onDelete,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    limit = 10,
    onLimitChange,
    totalCount = 0
}: LaborHistoryProps) {
    const { activeFincaId, fincas } = useFinca()
    const activeFinca = fincas.find(f => f.id === activeFincaId)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const formatCurrency = (amount: number, currency = 'ARS') => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency === 'USD' ? 'USD' : 'ARS',
            minimumFractionDigits: 2
        }).format(amount)
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Avance de Labores</span>
                    {activeFinca && (
                        <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                            {activeFinca.nombre}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Lote</TableHead>
                            <TableHead>Labor / Recursos</TableHead>
                            <TableHead className="text-right">Jornales</TableHead>
                            <TableHead className="text-right">Costo MO</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length > 0 ? (
                            history.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-muted-foreground whitespace-nowrap align-top">
                                        {format(new Date(item.fecha), 'dd/MM/yy')}
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <Badge variant="outline" className="font-semibold whitespace-nowrap">
                                            {item.lote?.nombre || "S/D"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <div className="font-medium">{item.tipo_labor}</div>
                                        {item.estado_fenologico && (
                                            <div className="text-xs text-muted-foreground mb-1">Est: {item.estado_fenologico}</div>
                                        )}
                                        {item.detalles && item.detalles.length > 0 && (
                                            <div className="mt-1 space-y-0.5">
                                                {item.detalles.map((d, i) => (
                                                    <div key={i} className="text-xs bg-muted/50 rounded px-1 py-0.5 inline-block mr-1">
                                                        {d.insumo?.nombre}: <strong>{d.cantidad}</strong> {d.insumo?.unidad}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {item.personal && item.personal.length > 0 && (
                                            <div className="mt-1">
                                                <div className="text-[10px] text-muted-foreground font-medium mb-0.5">Personal:</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {item.personal.map((p, i) => (
                                                        <Badge key={i} variant="secondary" className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border-0">
                                                            {p.personal.nombre}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right align-top">
                                        {item.jornales !== undefined && item.jornales !== null ? (
                                            <span className="font-medium">{item.jornales}</span>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right align-top">
                                        {item.costo_jornales !== undefined && item.costo_jornales !== null ? (
                                            <div className="flex flex-col items-end">
                                                <span className="font-medium">
                                                    {formatCurrency(item.costo_jornales, item.moneda)}
                                                </span>
                                                {item.moneda === 'USD' && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        ~ {formatCurrency(item.costo_jornales * (item.tipo_cambio || 1))}
                                                    </span>
                                                )}
                                            </div>
                                        ) : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell className="align-top text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onEdit?.(item)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeleteId(item.id)}
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    {activeFincaId
                                        ? "No hay labores registradas."
                                        : "Seleccione una finca para ver el avance."
                                    }
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            {/* Pagination and Footer */}
            <CardFooter className="border-t px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Filas por página</span>
                    <Select
                        value={limit.toString()}
                        onValueChange={(val) => onLimitChange?.(parseInt(val))}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={limit} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">
                        Página {currentPage} de {totalPages || 1}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onPageChange?.(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onPageChange?.(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardFooter>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente el registro de labor y sus datos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteId) onDelete?.(deleteId)
                                setDeleteId(null)
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card >
    )
}
