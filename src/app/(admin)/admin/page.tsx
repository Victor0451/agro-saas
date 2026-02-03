
export default function AdminPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
            <div className="grid gap-6">
                <div className="p-6 bg-white rounded-lg shadow border">
                    <h2 className="text-xl font-semibold mb-4">Gestión de Tenants</h2>
                    <p className="text-gray-600">Configuración global de fincas y usuarios administradores.</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow border">
                    <h2 className="text-xl font-semibold mb-4">Logs de Sistema</h2>
                    <p className="text-gray-600">Registro de actividades y errores.</p>
                </div>
            </div>
        </div>
    )
}

