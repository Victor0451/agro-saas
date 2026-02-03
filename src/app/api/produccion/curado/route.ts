import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { curadoSchema } from "@/lib/validations/curado"
import { ZodError } from "zod"

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const estufaId = searchParams.get('estufa_id')

        // Ensure user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let query = supabase
            .from("curados")
            .select(`
                *,
                estufa:estufas(nombre),
                lote:lotes(nombre)
            `)
            .order("fecha_inicio", { ascending: false })

        if (estufaId) {
            query = query.eq('estufa_id', estufaId)
        }

        const { data: curados, error } = await query

        if (error) {
            console.error("Error fetching curados:", error)
            return NextResponse.json({ error: "Error fetching curados" }, { status: 500 })
        }

        return NextResponse.json(curados)
    } catch (error) {
        console.error("Internal API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get Tenant ID
        const { data: profile } = await supabase
            .from("usuarios")
            .select("tenant_id")
            .eq("id", user.id)
            .single()

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: "No tenant assigned" }, { status: 400 })
        }

        const json = await request.json()
        const body = curadoSchema.parse(json)

        const { data: curado, error } = await supabase
            .from("curados")
            .insert({
                ...body,
                tenant_id: profile.tenant_id
            })
            .select()
            .single()

        if (error) {
            console.error("Error creating curado:", error)
            return NextResponse.json({ error: "Error creating curado" }, { status: 500 })
        }

        return NextResponse.json(curado)

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
        }
        console.error("Internal API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
