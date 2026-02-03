import { createClient } from "@/lib/supabase/server"
import { PersonalManager } from "@/components/personal-manager"

export const dynamic = 'force-dynamic'

export default async function PersonalPage() {
    const supabase = await createClient()

    const { data: personal } = await supabase
        .from('personal')
        .select('*')
        .order('nombre')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
                    <p className="text-muted-foreground">
                        Registro de empleados para asignación de labores.
                    </p>
                </div>
            </div>

            <PersonalManager initialData={personal || []} />
        </div>
    )
}
