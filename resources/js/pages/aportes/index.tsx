import { Head, Link } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Pagination, type PaginationLink } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';
import { index as aportesIndex, show } from '@/routes/aportes';
import { index as plansIndex } from '@/routes/plans';
import type { BreadcrumbItem } from '@/types';

type Titular = { id: number; nombre: string; project_id: number };
type Plan = { id: number; nombre: string } | null;
type Aporte = {
    id: number;
    fecha_consignacion?: string | null;
    nro_recibo?: string | null;
    valor: string;
    estado: string;
    soporte_path: string | null;
    created_at: string;
    verific_antecedentes?: string | null;
    observaciones?: string | null;
    titular: Titular;
    plan: Plan;
    approved_by_user?: { id: number; name: string } | null;
};

type Props = {
    aportes: { data: Aporte[]; links: PaginationLink[]; current_page: number; last_page: number };
    plans: { id: number; nombre: string }[];
    estadoLabels: Record<string, string>;
    filters: { estado?: string; plan_id?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Aportes', href: aportesIndex().url },
];

export default function AportesIndex({ aportes, plans, estadoLabels, filters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Aportes" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Aportes</h1>
                    <Button variant="outline" asChild>
                        <Link href={plansIndex().url}>Ver planes</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filtros</CardTitle>
                        <CardDescription>Filtrar por estado o plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form method="get" className="flex flex-wrap items-end gap-4">
                            <div className="min-w-[180px]">
                                <Label className="text-xs">Estado</Label>
                                <Select
                                    name="estado"
                                    value={filters.estado ?? 'all'}
                                    onValueChange={(v) => {
                                        const u = new URL(window.location.href);
                                        if (v === 'all') u.searchParams.delete('estado');
                                        else u.searchParams.set('estado', v);
                                        window.location.href = u.toString();
                                    }}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {Object.entries(estadoLabels).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="min-w-[180px]">
                                <Label className="text-xs">Plan</Label>
                                <Select
                                    name="plan_id"
                                    value={filters.plan_id ?? 'all'}
                                    onValueChange={(v) => {
                                        const u = new URL(window.location.href);
                                        if (v === 'all') u.searchParams.delete('plan_id');
                                        else u.searchParams.set('plan_id', v);
                                        window.location.href = u.toString();
                                    }}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {plans.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full min-w-[900px] text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="p-3 text-left font-medium">Titular</th>
                                <th className="p-3 text-left font-medium">Fecha consignación</th>
                                <th className="p-3 text-left font-medium">Nro. recibo</th>
                                <th className="p-3 text-left font-medium">Valor recibo</th>
                                <th className="p-3 text-left font-medium">Programa o campaña</th>
                                <th className="p-3 text-left font-medium">Verific. antecedentes</th>
                                <th className="p-3 text-left font-medium">Observaciones</th>
                                <th className="p-3 text-left font-medium">Estado</th>
                                <th className="p-3 text-right font-medium">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aportes.data.map((aporte) => (
                                <tr key={aporte.id} className="border-b last:border-0">
                                    <td className="p-3">{aporte.titular.nombre}</td>
                                    <td className="p-3 text-muted-foreground">
                                        {aporte.fecha_consignacion
                                            ? new Date(aporte.fecha_consignacion).toLocaleDateString()
                                            : '—'}
                                    </td>
                                    <td className="p-3">{aporte.nro_recibo ?? '—'}</td>
                                    <td className="p-3">{aporte.valor}</td>
                                    <td className="p-3">{aporte.plan?.nombre ?? '—'}</td>
                                    <td className="p-3 max-w-[100px] truncate" title={aporte.verific_antecedentes ?? ''}>
                                        {aporte.verific_antecedentes ?? '—'}
                                    </td>
                                    <td className="p-3 max-w-[120px] truncate" title={aporte.observaciones ?? ''}>
                                        {aporte.observaciones ?? '—'}
                                    </td>
                                    <td className="p-3">
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
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={show.url(aporte.id)}>
                                                <FileText className="mr-1 size-4" />
                                                Ver
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {aportes.data.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No hay aportes.
                        </CardContent>
                    </Card>
                )}

                {aportes.last_page > 1 && (
                    <div className="flex justify-center pt-4">
                        <Pagination links={aportes.links} />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
