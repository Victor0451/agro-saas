"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { personalSchema, type PersonalFormValues } from "@/lib/validations/personal"
import { createClient } from "@/lib/supabase/client"
import { Switch } from "@/components/ui/switch"
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

import { useToast } from "@/hooks/use-toast"

export function PersonalForm({ initialData, onSuccess }: { initialData?: any, onSuccess?: () => void }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const supabase = createClient()
    const { toast } = useToast()

    const form = useForm<PersonalFormValues>({
        resolver: zodResolver(personalSchema),
        defaultValues: initialData || {
            nombre: "",
            dni: "",
            legajo: "",
            tipo: "Temporario",
            costo_jornal_referencia: 0,
            activo: true
        },
    })

    async function onSubmit(data: PersonalFormValues) {
        setLoading(true)
        setShowConfirmDialog(false)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const res = await fetch("/api/personal", {
                method: initialData ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, id: initialData?.id }),
            })

            if (!res.ok) throw new Error("Error al guardar personal")

            form.reset()
            router.refresh()
            toast({
                title: initialData ? "Personal Actualizado" : "Personal Registrado",
                description: `Los datos se han guardado correctamente.`,
                variant: "success",
            })
            if (onSuccess) onSuccess()
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Hubo un problema al guardar los datos.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleFormSubmit = (data: PersonalFormValues) => {
        if (initialData) {
            setShowConfirmDialog(true)
        } else {
            onSubmit(data)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre Completo</FormLabel>
                            <FormControl>
                                <Input placeholder="Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="dni"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>DNI (Opcional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="12345678" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="legajo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Legajo / ID</FormLabel>
                                <FormControl>
                                    <Input placeholder="L-001" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="tipo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Contrato</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Temporario">Temporario</SelectItem>
                                        <SelectItem value="Permanente">Permanente</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="costo_jornal_referencia"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Costo Jornal (Ref.)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="activo"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Empleado Activo</FormLabel>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Actualizar" : "Registrar Empleado"}
                </Button>
            </form>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de guardar los cambios?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción actualizará la información del empleado en el sistema.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={form.handleSubmit(onSubmit)}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Form>
    )
}
