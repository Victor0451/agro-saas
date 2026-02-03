"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Calculator } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Search, DollarSign, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
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

interface LiquidacionManagerProps {
    history: any[]
    personalList: any[]
}

export function LiquidacionManager({ history, personalList }: LiquidacionManagerProps) {
    const { toast } = useToast()
    const router = useRouter()

    // Search State
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
    })
    const [selectedPersonal, setSelectedPersonal] = useState<string>("all")
    const [previewData, setPreviewData] = useState<any[]>([])
    const [loadingPreview, setLoadingPreview] = useState(false)
    const [generating, setGenerating] = useState(false)

    // Confirmation State
    const [confirmPackage, setConfirmPackage] = useState<any>(null)

    // Pagination for History (Standard Client Side)
    const [histPage, setHistPage] = useState(1)
    const [histLimit, setHistLimit] = useState(15)

    // Sort History
    const sortedHistory = [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const histTotal = sortedHistory.length
    const histPages = Math.ceil(histTotal / histLimit)
    const histPaginated = sortedHistory.slice((histPage - 1) * histLimit, histPage * histLimit)

    const handleSearch = async () => {
        if (!dateRange?.from || !dateRange?.to) {
            toast({ title: "Fechas requeridas", variant: "destructive" })
            return
        }

        setLoadingPreview(true)
        setPreviewData([])

        try {
            const params = new URLSearchParams({
                fecha_inicio: format(dateRange.from, 'yyyy-MM-dd'),
                fecha_fin: format(dateRange.to, 'yyyy-MM-dd')
            })
            if (selectedPersonal && selectedPersonal !== "all") {
                params.append('personal_id', selectedPersonal)
            }

            const res = await fetch(`/api/personal/liquidacion/preview?${params.toString()}`)
            if (!res.ok) throw new Error("Error al consultar")

            const json = await res.json()
            setPreviewData(json.data)

            if (json.data.length === 0) {
                toast({ title: "Sin resultados", description: "No se encontraron labores pendientes en este período." })
            }

        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Falló la búsqueda.", variant: "destructive" })
        } finally {
            setLoadingPreview(false)
        }
    }

    const handleGenerate = async () => {
        if (!confirmPackage) return

        setGenerating(true)
        try {
            const res = await fetch('/api/personal/liquidacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personal_id: confirmPackage.personal.id,
                    periodo_inicio: format(dateRange!.from!, 'yyyy-MM-dd'),
                    periodo_fin: format(dateRange!.to!, 'yyyy-MM-dd'),
                    items: confirmPackage.items,
                    total_dias: confirmPackage.total_dias,
                    total_pagar: confirmPackage.total_pagar
                })
            })

            if (!res.ok) throw new Error("Error al generar")

            toast({
                title: "Liquidación Exitosa",
                description: `Se registró el pago para ${confirmPackage.personal.nombre}`,
                variant: "success"
            })

            setConfirmPackage(null)
            router.refresh()
            // Remove from preview
            setPreviewData(prev => prev.filter(p => p.personal.id !== confirmPackage.personal.id))

        } catch (error) {
            toast({ title: "Error", description: "No se pudo generar la liquidación", variant: "destructive" })
        } finally {
            setGenerating(false)
        }
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val)

    return (
        <Tabs defaultValue="new" className="space-y-6">
            <TabsList>
                <TabsTrigger value="new">Nueva Liquidación</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="new">
                <div className="grid gap-6 md:grid-cols-12">
                    {/* Filter Sidebar */}
                    <div className="md:col-span-4 xl:col-span-3">
                        <Card className="h-full border-indigo-100 dark:border-indigo-900/20">
                            <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10">
                                <CardTitle>Filtros</CardTitle>
                                <CardDescription>Seleccione período y personal</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Período</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date"
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !dateRange && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateRange?.from ? (
                                                    dateRange.to ? (
                                                        <>
                                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                                            {format(dateRange.to, "LLL dd, y")}
                                                        </>
                                                    ) : (
                                                        format(dateRange.from, "LLL dd, y")
                                                    )
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={dateRange?.from}
                                                selected={dateRange}
                                                onSelect={setDateRange}
                                                numberOfMonths={2}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Personal</label>
                                    <Select value={selectedPersonal} onValueChange={setSelectedPersonal}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {personalList.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button onClick={handleSearch} className="w-full" disabled={loadingPreview}>
                                    {loadingPreview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Buscar Pendientes
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Results Area */}
                    <div className="md:col-span-8 xl:col-span-9">
                        <Card className="min-h-[400px]">
                            <CardHeader>
                                <CardTitle>Previsualización</CardTitle>
                                <CardDescription>Jornales pendientes de pago en el período seleccionado</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {previewData.length > 0 ? (
                                    <div className="space-y-6">
                                        {previewData.map((group) => (
                                            <div key={group.personal.id} className="border rounded-lg p-4 bg-card shadow-sm">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                                                    <div>
                                                        <h3 className="font-bold text-lg">{group.personal.nombre}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {group.items.length} labores pendientes
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-muted-foreground">Total a Pagar</p>
                                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                            {formatCurrency(group.total_pagar)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">{group.total_dias} días trabajados</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => setConfirmPackage(group)}
                                                        className="w-full md:w-auto"
                                                    >
                                                        <DollarSign className="mr-2 h-4 w-4" />
                                                        Liquidar
                                                    </Button>
                                                </div>

                                                <details className="text-sm group">
                                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium select-none">
                                                        Ver detalle de labores ({group.items.length})
                                                    </summary>
                                                    <div className="mt-2 pl-4 border-l-2 border-muted max-h-40 overflow-auto">
                                                        {group.items.map((item: any) => (
                                                            <div key={item.id} className="grid grid-cols-12 py-1 gap-2">
                                                                <span className="col-span-3 text-muted-foreground">{format(new Date(item.labor.fecha), 'dd/MM')}</span>
                                                                <span className="col-span-5">{item.labor.tipo_labor} ({item.labor.lote?.nombre})</span>
                                                                <span className="col-span-2 text-right">{item.dias_trabajados}d</span>
                                                                <span className="col-span-2 text-right font-medium">{formatCurrency(item.costo_asignado)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground border-2 border-dashed rounded-lg">
                                        <Check className="h-8 w-8 mb-2 opacity-50" />
                                        <p>No hay labores pendientes para los filtros seleccionados.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="history">
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Liquidaciones</CardTitle>
                        <CardDescription>Registro de pagos realizados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha Emisión</TableHead>
                                    <TableHead>Personal</TableHead>
                                    <TableHead>Período Liquidado</TableHead>
                                    <TableHead className="text-right">Días</TableHead>
                                    <TableHead className="text-right">Importe Total</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {histPaginated.length > 0 ? (
                                    histPaginated.map((liq) => (
                                        <TableRow key={liq.id}>
                                            <TableCell>{format(new Date(liq.fecha_liquidacion), 'dd/MM/yy')}</TableCell>
                                            <TableCell className="font-medium">{liq.personal?.nombre}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(liq.periodo_inicio), 'dd/MM')} - {format(new Date(liq.periodo_fin), 'dd/MM/yy')}
                                            </TableCell>
                                            <TableCell className="text-right">{liq.total_dias}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">
                                                {formatCurrency(liq.total_a_pagar)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" title="Imprimir Comprobante (Próximamente)">
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No hay historial disponible.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center border-t py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Filas por página</span>
                            <Select
                                value={histLimit.toString()}
                                onValueChange={(val) => {
                                    setHistLimit(Number(val))
                                    setHistPage(1)
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15</SelectItem>
                                    <SelectItem value="30">30</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setHistPage(p => Math.max(1, p - 1))}
                                disabled={histPage === 1}
                            >Anterior</Button>
                            <span className="text-sm">Página {histPage} de {histPages || 1}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setHistPage(p => Math.min(histPages, p + 1))}
                                disabled={histPage >= histPages}
                            >Siguiente</Button>
                        </div>
                    </CardFooter>
                </Card>
            </TabsContent>

            {/* Confirmation Dialog */}
            <AlertDialog open={!!confirmPackage} onOpenChange={(o) => !o && setConfirmPackage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Liquidación</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se generará un registro de pago por <span className="font-bold text-foreground">{confirmPackage && formatCurrency(confirmPackage.total_pagar)}</span> para {confirmPackage?.personal.nombre}.
                            <br /><br />
                            Esto marcará {confirmPackage?.items.length} labores como "Pagadas". Esta acción no se puede deshacer fácilmente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleGenerate} className="bg-green-600 hover:bg-green-700">
                            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
                            Confirmar Pago
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Tabs>
    )
}
