import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import InputError from '@/components/input-error';
import { dashboard } from '@/routes';
import { index as projectsIndex, update } from '@/routes/projects';
import type { BreadcrumbItem } from '@/types';

type Project = {
    id: number;
    title: string;
    description: string | null;
    valor_ingreso: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    status: string;
};

type Props = { project: Project };

const breadcrumbs = (project: Project): BreadcrumbItem[] => [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Proyectos', href: projectsIndex().url },
    { title: project.title, href: '#' },
];

export default function ProjectEdit({ project }: Props) {
    const form = useForm({
        title: project.title,
        description: project.description ?? '',
        valor_ingreso: String(project.valor_ingreso),
        fecha_inicio: project.fecha_inicio ?? '',
        fecha_fin: project.fecha_fin ?? '',
        status: project.status,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs(project)}>
            <Head title={`Editar: ${project.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>Editar proyecto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.put(update.url(project.id));
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="title">Título *</Label>
                                <Input
                                    id="title"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    required
                                />
                                <InputError message={form.errors.title} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Ventajas previstas / Descripción</Label>
                                <textarea
                                    id="description"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    rows={3}
                                />
                                <InputError message={form.errors.description} />
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
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="fecha_inicio">Fecha inicio</Label>
                                    <Input
                                        id="fecha_inicio"
                                        type="date"
                                        value={form.data.fecha_inicio}
                                        onChange={(e) => form.setData('fecha_inicio', e.target.value)}
                                    />
                                    <InputError message={form.errors.fecha_inicio} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fecha_fin">Fecha fin</Label>
                                    <Input
                                        id="fecha_fin"
                                        type="date"
                                        value={form.data.fecha_fin}
                                        onChange={(e) => form.setData('fecha_fin', e.target.value)}
                                    />
                                    <InputError message={form.errors.fecha_fin} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Estado</Label>
                                <Select
                                    value={form.data.status}
                                    onValueChange={(v) => form.setData('status', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="activo">Activo</SelectItem>
                                        <SelectItem value="inactivo">Inactivo</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.status} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    Guardar cambios
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={projectsIndex().url}>Cancelar</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
