import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { dashboard } from '@/routes';
import { index as plansIndex, update } from '@/routes/plans';
import type { BreadcrumbItem } from '@/types';

type Plan = {
    id: number;
    nombre: string;
    descripcion: string | null;
    valor_ingreso: string;
    fecha_cierre: string | null;
};

type Props = { plan: Plan };

const breadcrumbs = (plan: Plan): BreadcrumbItem[] => [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Planes', href: plansIndex().url },
    { title: plan.nombre, href: '#' },
];

export default function PlanEdit({ plan }: Props) {
    const form = useForm({
        nombre: plan.nombre,
        descripcion: plan.descripcion ?? '',
        valor_ingreso: String(plan.valor_ingreso),
        fecha_cierre: plan.fecha_cierre ?? '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs(plan)}>
            <Head title={`Editar: ${plan.nombre}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>Editar plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.put(update.url(plan.id));
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre *</Label>
                                <Input
                                    id="nombre"
                                    value={form.data.nombre}
                                    onChange={(e) => form.setData('nombre', e.target.value)}
                                    required
                                />
                                <InputError message={form.errors.nombre} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descripcion">Descripción</Label>
                                <textarea
                                    id="descripcion"
                                    value={form.data.descripcion}
                                    onChange={(e) => form.setData('descripcion', e.target.value)}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    rows={3}
                                />
                                <InputError message={form.errors.descripcion} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="valor_ingreso">Valor de ingreso</Label>
                                <Input
                                    id="valor_ingreso"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.data.valor_ingreso}
                                    onChange={(e) => form.setData('valor_ingreso', e.target.value)}
                                />
                                <InputError message={form.errors.valor_ingreso} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fecha_cierre">Fecha de cierre</Label>
                                <Input
                                    id="fecha_cierre"
                                    type="date"
                                    value={form.data.fecha_cierre}
                                    onChange={(e) => form.setData('fecha_cierre', e.target.value)}
                                />
                                <InputError message={form.errors.fecha_cierre} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    Guardar cambios
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={plansIndex().url}>Cancelar</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
