"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Store } from "lucide-react"

export default function OnboardingPage() {
    const [tenantName, setTenantName] = useState("")
    const [fincaName, setFincaName] = useState("")
    const [superficie, setSuperficie] = useState("")
    const [rendimiento, setRendimiento] = useState("")

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error("No estás autenticado.")

            // 2. Call API to create tenant
            const res = await fetch('/api/tenants/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: tenantName,
                    fincaName: fincaName || tenantName, // Fallback if empty but should be filled
                    superficie: parseFloat(superficie) || 0,
                    rendimiento: parseFloat(rendimiento) || 0,
                    userId: user.id
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Error al crear la organización")
            }

            // Success
            router.push("/dashboard")
            router.refresh()

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error desconocido"
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                        <Store className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">
                        Configura tu Organización
                    </CardTitle>
                    <CardDescription className="text-center">
                        Para comenzar, necesitamos crear un espacio de trabajo para tu producción.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateTenant}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
                            <Label className="text-primary font-semibold">Datos de la Empresa / Organización</Label>
                            <div className="space-y-2">
                                <Label htmlFor="tenantName">Nombre de la Organización</Label>
                                <Input
                                    id="tenantName"
                                    placeholder="Ej: Tabacalera San José"
                                    value={tenantName}
                                    onChange={(e) => {
                                        setTenantName(e.target.value)
                                        // Auto-sync names unless user edits finca name explicitly (simplified interaction)
                                        if (!fincaName) setFincaName(e.target.value)
                                    }}
                                    required
                                    minLength={3}
                                />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Este será el nombre principal de tu entorno de trabajo.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 border-l-2 border-secondary pl-4 py-2">
                            <Label className="text-secondary-foreground font-semibold">Datos de tu Primera Finca</Label>

                            <div className="space-y-2">
                                <Label htmlFor="fincaName">Nombre del Establecimiento</Label>
                                <Input
                                    id="fincaName"
                                    placeholder="Ej: Finca El Recreo"
                                    value={fincaName}
                                    onChange={(e) => setFincaName(e.target.value)}
                                    required
                                    minLength={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="superficie">Superficie Total (has)</Label>
                                    <Input
                                        id="superficie"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={superficie}
                                        onChange={(e) => setSuperficie(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rendimiento">Rendimiento (kg/ha)</Label>
                                    <Input
                                        id="rendimiento"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={rendimiento}
                                        onChange={(e) => setRendimiento(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Configurando...
                                </>
                            ) : (
                                "Crear Organización y Continuar"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
