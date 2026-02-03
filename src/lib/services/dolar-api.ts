export interface DolarQuotation {
    moneda: string;
    casa: string;
    nombre: string;
    compra: number;
    venta: number;
    fechaActualizacion: string;
}

export async function getDolarQuotations(): Promise<DolarQuotation[]> {
    try {
        const response = await fetch("https://dolarapi.com/v1/dolares", {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error("Failed to fetch dollar quotations");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching dollar quotations:", error);
        return [];
    }
}

export function formatCurrency(value: number, currency: string = "ARS") {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
    }).format(value);
}
