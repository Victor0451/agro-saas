import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Activity, Sprout, DollarSign, Thermometer, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { DolarTicker } from "@/components/dashboard/dolar-ticker"

async function getDashboardMetrics() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get User Details for Welcome
    let userName = "Productor"
    if (user) {
        const { data: userData } = await supabase.from('usuarios').select('nombre').eq('id', user.id).single()
        if (userData?.nombre) userName = userData.nombre
    }

    // 1. Total Plants (Plantaciones)
    const { data: plantaciones } = await supabase
        .from('plantaciones')
        .select('cantidad_plantas', { count: 'exact' })

    const totalPlantas = plantaciones?.reduce((acc, curr) => acc + (curr.cantidad_plantas || 0), 0) || 0

    // 2. Active Stoves (Estufas)
    const { count: activeEstufas } = await supabase
        .from('estufas')
        .select('*', { count: 'exact', head: true })
        .eq('activa', true)

    // 3. Harvested Kilos (Cosechas)
    const { data: cosechas } = await supabase
        .from('cosechas')
        .select('cantidad')

    const totalHarvested = cosechas?.reduce((acc, curr) => acc + (curr.cantidad || 0), 0) || 0

    // 4. Insumos Stats
    const { count: totalInsumos } = await supabase
        .from('insumos')
        .select('*', { count: 'exact', head: true })

    const { count: lowStockInsumos } = await supabase
        .from('insumos')
        .select('*', { count: 'exact', head: true })
        .lt('stock_actual', 10)

    return {
        userName,
        totalPlantas,
        activeEstufas: activeEstufas || 0,
        totalHarvested,
        totalInsumos: totalInsumos || 0,
        lowStockInsumos: lowStockInsumos || 0
    }
}

export default async function DashboardPage() {
    const metrics = await getDashboardMetrics()

    return (
        <div className="space-y-8">
            {/* 1. Welcome Section */}
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-primary">
                    Hola, {metrics.userName} 👋
                </h2>
                <p className="text-lg text-muted-foreground">
                    Bienvenido a tu panel de control. Aquí tienes un resumen de la actividad de hoy.
                </p>
            </div>

            {/* 2. Market Data Section */}
            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h3 className="text-xl font-semibold">Mercado de Divisas</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Cotizaciones en tiempo real para referencia de costos e insumos.</p>
                <DolarTicker />
            </section>

            {/* 3. Operational Metrics Grid */}
            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xl font-semibold">Estado de Producción</h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Active Plants */}
                    <Card className="shadow-md border-t-4 border-t-green-500 hover:shadow-lg transition-all cursor-default">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Plantación Activa
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                                    <Sprout className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{metrics.totalPlantas.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Plantas en crecimiento</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Harvest */}
                    <Card className="shadow-md border-t-4 border-t-yellow-500 hover:shadow-lg transition-all cursor-default">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Cosecha Acumulada
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                                    <Activity className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{metrics.totalHarvested.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">kg</span></div>
                                    <p className="text-xs text-muted-foreground mt-1">Tabaco recolectado</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stoves */}
                    <Card className="shadow-md border-t-4 border-t-red-500 hover:shadow-lg transition-all cursor-default">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Proceso de Curado
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                                    <Thermometer className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{metrics.activeEstufas}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Estufas encendidas</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory */}
                    <Card className={`shadow-md border-t-4 ${metrics.lowStockInsumos > 0 ? 'border-t-orange-500' : 'border-t-blue-500'} hover:shadow-lg transition-all cursor-default`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Almacén e Insumos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${metrics.lowStockInsumos > 0 ? 'bg-orange-100 dark:bg-orange-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                                    <TrendingUp className={`h-6 w-6 ${metrics.lowStockInsumos > 0 ? 'text-orange-600' : 'text-blue-600'}`} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{metrics.totalInsumos}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {metrics.lowStockInsumos > 0
                                            ? `${metrics.lowStockInsumos} items con stock bajo`
                                            : 'Items registrados'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    )
}
