import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination, type PaginationLink } from '@/components/pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Plan = { id: number; nombre: string } | null;
type Aporte = {
    id: number;
    valor: string;
    estado: string;
    created_at: string;
    plan: Plan;
};

type Flash = { success?: string; error?: string };

type Props = {
    aportes: { data: Aporte[]; links: PaginationLink[]; current_page: number; last_page: number };
    estadoLabels: Record<string, string>;
};

export default function TitularAportesIndex({ aportes, estadoLabels }: Props) {
    const flash = (usePage().props.flash as Flash | undefined) ?? {};

    return (
        <div className="min-h-svh bg-background">
            <Head title="Mis Aportes" />
            <header className="border-b bg-card">
                <div className="flex h-14 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2 font-medium">
                        <AppLogoIcon className="size-11 object-contain" />
                        <span>Reyes Primero</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/titular/dashboard">Mi carpeta</Link>
                        </Button>
                        <Button type="button" variant="outline" size="sm" asChild>
                            <Link href="/titular/logout" method="post" as="button">
                                Cerrar sesión
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-3xl p-6">
                {flash.success && (
                    <Alert className="mb-4 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}
                {flash.error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Mis Aportes</h1>
                    <Button asChild>
                        <Link href="/titular/aportes/create">
                            <Plus className="mr-2 size-4" />
                            Nuevo aporte
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Aportes realizados</CardTitle>
                        <CardDescription>
                            Aquí puede ver el estado de cada aporte. El administrador los revisará
                            y aprobará o rechazará.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {aportes.data.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">
                                No ha registrado ningún aporte.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {aportes.data.map((aporte) => (
                                    <li
                                        key={aporte.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div>
                                            <p className="font-medium">Valor: {aporte.valor}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(aporte.created_at).toLocaleString()}
                                                {aporte.plan && (
                                                    <> · Plan: {aporte.plan.nombre}</>
                                                )}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                aporte.estado === 'aprobado'
                                                    ? 'default'
                                                    : aporte.estado === 'rechazado'
                                                      ? 'destructive'
                                                      : 'secondary'
                                            }
                                        >
                                            {estadoLabels[aporte.estado] ?? aporte.estado}
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {aportes.last_page > 1 && (
                            <div className="mt-4 flex justify-center">
                                <Pagination links={aportes.links} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
