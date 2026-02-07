import { Head, Link, useForm } from '@inertiajs/react';
import { Download, ExternalLink } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import { dashboard } from '@/routes';
import { index as aportesIndex, update } from '@/routes/aportes';
import type { BreadcrumbItem } from '@/types';

type Plan = { id: number; nombre: string; valor_ingreso: string; fecha_cierre: string | null };
type Aporte = {
    id: number;
    valor: string;
    estado: string;
    soporte_path: string | null;
    approved_at: string | null;
    created_at: string;
    titular: { id: number; nombre: string; project: { id: number; title: string } };
    plan: Plan | null;
    approved_by_user: { id: number; name: string } | null;
};

type Props = {
    aporte: Aporte;
    plans: Plan[];
    estadoLabels: Record<string, string>;
};

const breadcrumbs = (aporte: Aporte): BreadcrumbItem[] => [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Aportes', href: aportesIndex().url },
    { title: `Aporte #${aporte.id}`, href: '#' },
];

export default function AporteShow({ aporte, plans, estadoLabels }: Props) {
    const form = useForm({
        plan_id: aporte.plan?.id ?? '',
        estado: 'aprobado' as 'aprobado' | 'rechazado',
    });

    const canApprove = aporte.estado === 'pendiente' && plans.length > 0;
    const soporteUrl = `/aportes/${aporte.id}/soporte`;

    return (
        <AppLayout breadcrumbs={breadcrumbs(aporte)}>
            <Head title={`Aporte #${aporte.id}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Aporte #{aporte.id}</h1>
                    <Button variant="outline" asChild>
                        <Link href={aportesIndex().url}>Volver a lista</Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalle</CardTitle>
                            <CardDescription>Datos del aporte y del titular</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm">
                                <span className="font-medium">Titular:</span>{' '}
                                <Link
                                    href={`/titulares/${aporte.titular.id}`}
                                    className="text-primary hover:underline"
                                >
                                    {aporte.titular.nombre}
                                    <ExternalLink className="ml-1 inline size-3" />
                                </Link>
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Proyecto:</span>{' '}
                                {aporte.titular.project.title}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Valor:</span> {aporte.valor}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Estado:</span>{' '}
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
                            </p>
                            {aporte.plan && (
                                <p className="text-sm">
                                    <span className="font-medium">Plan asociado:</span>{' '}
                                    {aporte.plan.nombre}
                                </p>
                            )}
                            {aporte.approved_at && aporte.approved_by_user && (
                                <p className="text-sm text-muted-foreground">
                                    Aprobado por {aporte.approved_by_user.name} el{' '}
                                    {new Date(aporte.approved_at).toLocaleString()}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                Registrado: {new Date(aporte.created_at).toLocaleString()}
                            </p>
                            {aporte.soporte_path && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={soporteUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="mr-2 size-4" />
                                        Ver soporte
                                    </a>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {canApprove && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Aprobar o rechazar</CardTitle>
                                <CardDescription>
                                    Asocie el aporte a un plan y marque como aprobado o rechazado
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        form.put(update.url(aporte.id));
                                    }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label>Plan (obligatorio si aprueba)</Label>
                                        <Select
                                            value={form.data.plan_id ? String(form.data.plan_id) : 'all'}
                                            onValueChange={(v) =>
                                                form.setData('plan_id', v === 'all' ? '' : Number(v))
                                            }
                                            required={form.data.estado === 'aprobado'}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un plan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {plans.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.nombre} (valor: {p.valor_ingreso}
                                                        {p.fecha_cierre &&
                                                            `, cierre: ${p.fecha_cierre}`})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.plan_id} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Acción</Label>
                                        <Select
                                            value={form.data.estado}
                                            onValueChange={(v) =>
                                                form.setData('estado', v as 'aprobado' | 'rechazado')
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="aprobado">Aprobado</SelectItem>
                                                <SelectItem value="rechazado">Rechazado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.estado} />
                                    </div>
                                    <Button type="submit" disabled={form.processing}>
                                        Guardar
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
