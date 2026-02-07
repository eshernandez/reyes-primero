import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { edit, index as plansIndex } from '@/routes/plans';
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

type Props = { plan: Plan };

const breadcrumbs = (plan: Plan): BreadcrumbItem[] => [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Planes', href: plansIndex().url },
    { title: plan.nombre, href: '#' },
];

export default function PlanShow({ plan }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs(plan)}>
            <Head title={plan.nombre} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">{plan.nombre}</h1>
                    <Button asChild>
                        <Link href={edit.url(plan.id)}>Editar</Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles</CardTitle>
                        <CardDescription>
                            {plan.aportes_count} aportes asociados
                            {plan.fecha_cierre && ` · Cierre: ${plan.fecha_cierre}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {plan.descripcion && (
                            <p className="text-sm text-muted-foreground">{plan.descripcion}</p>
                        )}
                        <p className="text-sm">
                            <span className="font-medium">Valor de ingreso:</span> {plan.valor_ingreso}
                        </p>
                        {plan.creator && (
                            <p className="text-sm text-muted-foreground">
                                Creado por: {plan.creator.name}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
