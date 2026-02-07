import { Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination, type PaginationLink } from '@/components/pagination';
import { dashboard } from '@/routes';
import { create, destroy, edit, index as plansIndex } from '@/routes/plans';
import type { BreadcrumbItem } from '@/types';

type Plan = {
    id: number;
    nombre: string;
    descripcion: string | null;
    valor_ingreso: string;
    fecha_cierre: string | null;
    aportes_count: number;
    creator?: { id: number; name: string } | null;
};

type Props = {
    plans: { data: Plan[]; links: PaginationLink[]; current_page: number; last_page: number };
    filters: { search?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Planes', href: plansIndex().url },
];

export default function PlansIndex({ plans }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Planes" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Planes</h1>
                    <Button asChild>
                        <Link href={create().url}>
                            <Plus className="mr-2 size-4" />
                            Nuevo plan
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {plans.data.map((plan) => (
                        <Card key={plan.id}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div>
                                    <CardTitle className="text-base">
                                        <Link href={`/plans/${plan.id}`} className="hover:underline">
                                            {plan.nombre}
                                        </Link>
                                    </CardTitle>
                                    <CardDescription className="mt-1 line-clamp-2">
                                        {plan.descripcion || 'Sin descripción'}
                                    </CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-8">
                                            ⋮
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={edit.url(plan.id)}>
                                                <Pencil className="mr-2 size-4" />
                                                Editar
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={destroy.url(plan.id)}
                                                method="delete"
                                                as="button"
                                                className="w-full text-destructive"
                                            >
                                                <Trash2 className="mr-2 size-4" />
                                                Eliminar
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>{plan.aportes_count} aportes</span>
                                    <span>
                                        Valor: {plan.valor_ingreso}
                                        {plan.fecha_cierre && ` · Cierre: ${plan.fecha_cierre}`}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {plans.data.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <p className="text-muted-foreground">No hay planes.</p>
                            <Button asChild className="mt-4">
                                <Link href={create().url}>Crear primer plan</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {plans.last_page > 1 && (
                    <div className="flex justify-center pt-4">
                        <Pagination links={plans.links} />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
