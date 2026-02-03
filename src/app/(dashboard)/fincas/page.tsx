"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, MapPin, Ruler, Sprout, Building2 } from "lucide-react"
import { FincaForm } from "@/components/forms/finca-form"

// Mock tenant data for now, ideally fetched from DB or user metadata
// In a real app, we'd fetch the tenant details to get 'plan' and 'max_fincas'
type TenantInfo = {
    plan_type: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
    max_fincas: number;
}

interface Finca {
    id: string
    nombre: string
    superficie_total: number
    rendimiento_esperado: number
    slug?: string
}

export default function FincasPage() {
    const [fincas, setFincas] = useState<Finca[]>([])
    const [tenant, setTenant] = useState<TenantInfo>({ plan_type: 'BASIC', max_fincas: 1 }) // Default fallback
    const [showForm, setShowForm] = useState(false)
    const supabase = createClient()

    const fetchData = async () => {
        // We'll skip setting loading state for background refreshes if desired, 
        // or add it back if we want a spinner. For now removing unused 'loading' state.

        // 1. Fetch User & Tenant Info
        // We need to know the tenant ID first. 
        const { data: { user } } = await supabase.auth.getUser()

        if (user?.user_metadata?.tenant_id || user?.app_metadata?.tenant_id) {
            const tenantId = user.user_metadata?.tenant_id || user.app_metadata?.tenant_id
            const { data: tenantData } = await supabase
                .from('tenants')
                .select('plan_type, max_fincas')
                .eq('id', tenantId)
                .single()

            if (tenantData) {
                setTenant(tenantData as TenantInfo)
            }
        }

        // 2. Fetch Fincas
        const { data } = await supabase.from("fincas").select("*").order("created_at", { ascending: false })

        if (data) setFincas(data)
    }

    useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const usagePercent = (fincas.length / tenant.max_fincas) * 100
    const isLimitReached = fincas.length >= tenant.max_fincas

    const [editingFinca, setEditingFinca] = useState<Finca | null>(null) // New State for editing

    // ... fetchData hook ...

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Mis Fincas</h1>
                    <p className="text-muted-foreground mt-1">
                        Administra tus establecimientos productivos y controla tus recursos.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => {
                            setEditingFinca(null)
                            setShowForm(!showForm)
                        }}
                        disabled={isLimitReached && !showForm && !editingFinca}
                    >
                        {showForm ? "Cancelar" : (
                            <>
                                <Plus className="mr-2 h-4 w-4" /> Nueva Finca
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Plan Usage Section */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="md:col-span-3 border-l-4 border-l-indigo-500 shadow-sm border-indigo-100 dark:border-indigo-900/20">
                    <CardHeader className="pb-2 bg-indigo-50/50 dark:bg-indigo-900/10">
                        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                            Estado de Suscripción: {tenant.plan_type}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-2xl">
                                {fincas.length} / {tenant.max_fincas} <span className="text-sm font-normal text-muted-foreground">Fincas utilizadas</span>
                            </span>
                            <Badge variant={isLimitReached ? "destructive" : "secondary"}>
                                {isLimitReached ? "Límite Alcanzado" : "Espacio Disponible"}
                            </Badge>
                        </div>
                        <Progress value={usagePercent} className="h-2" />
                        {isLimitReached && (
                            <p className="text-xs text-destructive mt-2 font-medium">
                                Has alcanzado el límite de tu plan. Contacta a soporte para ampliar tu capacidad.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Info Card */}
                <Card className="bg-muted/50 border-dashed shadow-none hidden md:block">
                    <CardContent className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-muted-foreground">
                        <Building2 className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-xs">
                            Gestiona múltiples ubicaciones centralizadas en una sola cuenta.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {(showForm || editingFinca) && (
                <div className="max-w-2xl mx-auto animate-in slide-in-from-top-4 fade-in duration-300 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-lg bg-background shadow-lg relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">{editingFinca ? "Editar Finca" : "Registrar Nuevo Establecimiento"}</h3>
                        <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingFinca(null); }}>Cerrar</Button>
                    </div>
                    <FincaForm
                        initialData={editingFinca}
                        onSuccess={() => {
                            setShowForm(false)
                            setEditingFinca(null)
                            fetchData()
                        }}
                    />
                </div>
            )}

            {/* Fincas Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* ... loading / empty states ... */}
                {fincas.map((finca) => (
                    <Card key={finca.id} className="group hover:shadow-md transition-all duration-300 overflow-hidden border-indigo-100 dark:border-indigo-900/20">
                        {/* ... Card content ... */}
                        <div className="h-32 bg-gradient-to-r from-indigo-600/10 to-blue-600/10 flex items-center justify-center relative">
                            <MapPin className="h-10 w-10 text-indigo-600/40 group-hover:scale-110 transition-transform duration-300" />
                            <Badge className="absolute top-3 right-3 bg-background/80 text-foreground backdrop-blur-sm shadow-sm hover:bg-background/90" variant="outline">
                                Activa
                            </Badge>
                        </div>
                        <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/20">
                            <CardTitle className="flex items-center justify-between text-indigo-700 dark:text-indigo-400">
                                {finca.nombre}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Finca ID: {finca.slug || "---"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Ruler className="h-4 w-4" />
                                    <span>Superficie:</span>
                                </div>
                                <span className="font-medium">{finca.superficie_total} ha</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Sprout className="h-4 w-4" />
                                    <span>Rendimiento:</span>
                                </div>
                                <span className="font-medium">{finca.rendimiento_esperado || "-"} kg/ha</span>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/20 border-t p-3 flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => setEditingFinca(finca)}
                            >
                                Editar
                            </Button>
                            <Button variant="ghost" className="flex-1 text-xs font-medium">
                                Ver Detalles
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
