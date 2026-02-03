import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="px-4 lg:px-6 h-14 flex items-center border-b backdrop-blur-md bg-background/60 sticky top-0 z-50">
                <Link className="flex items-center justify-center font-bold text-xl text-primary" href="#">
                    AgroERP
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
                        Características
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="#pricing">
                        Precios
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
                        Ingresar
                    </Link>
                </nav>
            </header>
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted/20">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-800">
                                    Gestión Agrícola Inteligente
                                </h1>
                                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                                    La plataforma ERP diseñada para simplificar la producción de tabaco. Control total desde el almácigo hasta la clasificación.
                                </p>
                            </div>
                            <div className="space-x-4">
                                <Link href="/login">
                                    <Button size="lg" className="h-11 px-8 rounded-full shadow-lg hover:shadow-xl transition-all">
                                        Comenzar Ahora
                                    </Button>
                                </Link>
                                <Button variant="outline" size="lg" className="h-11 px-8 rounded-full">
                                    Saber más
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
                <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <svg
                                        className=" h-6 w-6"
                                        fill="none"
                                        height="24"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        width="24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M3 3v18h18" />
                                        <path d="m19 9-5 5-4-4-3 3" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold">Control de Lotes</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Seguimiento detallado por lote, variedad y superficie. Costos y rendimientos en tiempo real.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <svg
                                        className=" h-6 w-6"
                                        fill="none"
                                        height="24"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        width="24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                        <path d="m9 12 2 2 4-4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold">Multi-tenant Seguro</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Arquitectura robusta con aislamiento de datos. Cada finca gestiona su propia información con seguridad empresarial.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <svg
                                        className=" h-6 w-6"
                                        fill="none"
                                        height="24"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        width="24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <path d="M14 2v6h6" />
                                        <path d="M16 13H8" />
                                        <path d="M16 17H8" />
                                        <path d="M10 9H8" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold">Reportes Automáticos</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Generación de informes de producción, costos, mano de obra e impuestos con un solo clic.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-gray-500 dark:text-gray-400">© 2026 AgroERP. Todos los derechos reservados.</p>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-xs hover:underline underline-offset-4" href="#">
                        Términos de Servicio
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="#">
                        Privacidad
                    </Link>
                </nav>
            </footer>
        </div>
    )
}
