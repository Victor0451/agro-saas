import { createClient } from "@/lib/supabase/server"

/**
 * Derived stock for one insumo, scoped to one tenant.
 * Formula: SUM(compras_insumos.cantidad) − SUM(labores_insumos.cantidad).
 * Returns 0 for unknown insumo_id. Never returns negative (clamped at 0).
 */
export async function calcularStock(
    insumo_id: string,
    tenant_id: string
): Promise<number> {
    const supabase = await createClient()

    // Query 1: total purchased
    const { data: comprasData } = await supabase
        .from("compras_insumos")
        .select("cantidad")
        .eq("insumo_id", insumo_id)
        .eq("tenant_id", tenant_id)

    const totalCompras = comprasData?.reduce(
        (acc, row) => acc + (row.cantidad ?? 0),
        0
    ) ?? 0

    // Query 2: total consumed via labor
    const { data: consumosData } = await supabase
        .from("labores_insumos")
        .select("cantidad")
        .eq("insumo_id", insumo_id)
        .eq("labores!inner.tenant_id", tenant_id)

    const totalConsumos = consumosData?.reduce(
        (acc, row) => acc + (row.cantidad ?? 0),
        0
    ) ?? 0

    return Math.max(0, totalCompras - totalConsumos)
}
