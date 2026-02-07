import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Heart, Target, Users } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { dashboard, login } from '@/routes';
import type { SharedData } from '@/types';

const WHATSAPP_URL = 'https://api.whatsapp.com/send?phone=573104028196';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const { updateAppearance } = useAppearance();
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

    useEffect(() => {
        updateAppearance('light');
    }, [updateAppearance]);

    const handleGoToWhatsApp = () => {
        setWhatsappModalOpen(false);
        window.location.href = WHATSAPP_URL;
    };

    return (
        <>
            <Head title="Reyes Primero - Proyecto con enfoque social">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                <header className="sticky top-0 z-10 border-b border-[#19140015] bg-[#FDFDFC]/95 backdrop-blur dark:border-[#3E3E3A] dark:bg-[#0a0a0a]/95">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                        <Link href="/" className="flex items-center gap-2 font-semibold">
                            <img src="/logo.png" alt="Reyes Primero" className="h-10 w-10 object-contain" />
                            <span>Reyes Primero</span>
                        </Link>
                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-md border border-[#19140035] px-4 py-2 text-sm font-medium transition-colors hover:border-[#1915014a] hover:bg-[#19140008] dark:border-[#3E3E3A] dark:hover:border-[#62605b] dark:hover:bg-white/5"
                                >
                                    Ir al Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Iniciar sesión
                                    </Link>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-md border-[#19140035] bg-[#19140012 dark:border-[#3E3E3A] dark:bg-white/5"
                                        onClick={() => setWhatsappModalOpen(true)}
                                    >
                                        Crear cuenta
                                    </Button>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main>
                    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="mb-8 flex justify-center">
                                <img
                                    src="/logo.png"
                                    alt="Reyes Primero"
                                    className="h-24 w-24 object-contain sm:h-28 sm:w-28"
                                />
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                                Reyes Primero
                            </h1>
                            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
                                Un proyecto con enfoque social para acompañar a las personas
                                con la promesa de proyectos económicos que generen impacto real.
                            </p>
                            {!auth.user && (
                                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                                    <Link
                                        href={login()}
                                        className="rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background shadow-sm transition-colors hover:opacity-90"
                                    >
                                        Iniciar sesión
                                    </Link>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-md border border-input px-6 py-3 text-sm font-medium"
                                        onClick={() => setWhatsappModalOpen(true)}
                                    >
                                        Crear cuenta
                                    </Button>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="border-t border-[#19140015] bg-muted/30 py-16 dark:border-[#3E3E3A] dark:bg-white/[0.02]">
                        <div className="mx-auto max-w-6xl px-4 sm:px-6">
                            <h2 className="text-center text-2xl font-semibold sm:text-3xl">
                                ¿Qué hacemos?
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
                                Reyes Primero nace con la convicción de que el desarrollo económico
                                y el bienestar social van de la mano. Trabajamos para conectar a las
                                personas con oportunidades y proyectos que prioricen su dignidad y
                                el progreso de sus comunidades.
                            </p>
                            <div className="mt-12 grid gap-8 sm:grid-cols-3">
                                <div className="flex flex-col items-center rounded-xl border border-[#19140015] bg-background p-6 text-center dark:border-[#3E3E3A]">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Heart className="size-6" />
                                    </div>
                                    <h3 className="mt-4 font-semibold">Enfoque social</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Las personas y sus necesidades están en el centro de cada
                                        decisión y cada proyecto.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center rounded-xl border border-[#19140015] bg-background p-6 text-center dark:border-[#3E3E3A]">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Target className="size-6" />
                                    </div>
                                    <h3 className="mt-4 font-semibold">Proyectos económicos</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Promovemos iniciativas que generan valor económico y
                                        sostenible para las comunidades.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center rounded-xl border border-[#19140015] bg-background p-6 text-center dark:border-[#3E3E3A]">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Users className="size-6" />
                                    </div>
                                    <h3 className="mt-4 font-semibold">Acompañamiento</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Acompañamos a las personas en el proceso, con información
                                        clara y respeto por su autonomía.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-2xl font-semibold sm:text-3xl">
                                Reyes Primero es primero la persona
                            </h2>
                            <p className="mt-4 text-muted-foreground">
                                Creemos en un modelo donde el crecimiento económico y el impacto
                                social se refuerzan mutuamente. Si desea conocer más o participar
                                en nuestros proyectos, puede crear una cuenta o iniciar sesión.
                            </p>
                            {!auth.user && (
                                <div className="mt-8">
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
                                    >
                                        Acceder a la plataforma
                                    </Link>
                                </div>
                            )}
                        </div>
                    </section>
                </main>

                <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Redirección a WhatsApp</DialogTitle>
                            <DialogDescription>
                                Vas a ser redirigido a WhatsApp para contactarnos y crear tu cuenta.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setWhatsappModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="button" onClick={handleGoToWhatsApp}>
                                Continuar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <footer className="border-t border-[#19140015] py-6 dark:border-[#3E3E3A]">
                    <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground sm:px-6">
                        © {new Date().getFullYear()} Reyes Primero. Proyecto con enfoque social.
                    </div>
                </footer>
            </div>
        </>
    );
}
