import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { estufaSchema } from "@/lib/validations/curado"
import { ZodError } from "zod"

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

        // Ensure user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: estufas, error } = await supabase
            .from("estufas")
            .select("*")
            .order("nombre", { ascending: true })

        if (error) {
            console.error("Error fetching estufas:", error)
            return NextResponse.json({ error: "Error fetching estufas" }, { status: 500 })
        }

        return NextResponse.json(estufas)
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
        const body = estufaSchema.parse(json)

        const { data: estufa, error } = await supabase
            .from("estufas")
            .insert({
                ...body,
                tenant_id: profile.tenant_id
            })
            .select()
            .single()

        if (error) {
            console.error("Error creating estufa:", error)
            return NextResponse.json({ error: "Error creating estufa" }, { status: 500 })
        }

        return NextResponse.json(estufa)

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
        }
        console.error("Internal API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
