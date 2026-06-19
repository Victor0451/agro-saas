"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)
    const router = useRouter()
    const supabase = createClient()
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirm) {
            setError("Las contraseñas no coinciden.")
            return
        }
        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.")
            return
        }
        setLoading(true)
        setError(null)
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) {
                setError(error.message)
            } else {
                setDone(true)
                timerRef.current = setTimeout(() => router.push("/login"), 2500)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm shadow-xl border-t-4 border-t-primary">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Nueva contraseña</CardTitle>
                    <CardDescription className="text-center">
                        Elegí una contraseña segura para tu cuenta
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleReset}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}
                        {done ? (
                            <div className="flex items-center gap-2 rounded-md bg-green-500/15 p-3 text-sm text-green-700 dark:text-green-400">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                <p>Contraseña actualizada. Redirigiendo al login...</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Nueva contraseña</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm">Confirmar contraseña</Label>
                                    <Input
                                        id="confirm"
                                        type="password"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <Button className="w-full font-bold shadow-md" size="lg" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Actualizar contraseña
                                </Button>
                            </>
                        )}
                    </CardContent>
                </form>
            </Card>
        </div>
    )
}
