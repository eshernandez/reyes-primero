import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import { dashboard } from '@/routes';
import { index as titularesIndex, update } from '@/routes/titulares';
import type { BreadcrumbItem } from '@/types';

type Titular = {
    id: number;
    nombre: string;
    project_id: number;
    folder_id: number;
    status: string;
    is_active: boolean;
};

type Project = { id: number; title: string };
type Folder = { id: number; name: string; version: string };

type Props = {
    titular: Titular;
    projects: Project[];
    folders: Folder[];
    statusLabels: Record<string, string>;
};

const breadcrumbs = (titular: Titular): BreadcrumbItem[] => [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Titulares', href: titularesIndex().url },
    { title: titular.nombre, href: '#' },
];

export default function TitularEdit({ titular, projects, folders, statusLabels }: Props) {
    const form = useForm({
        nombre: titular.nombre,
        project_id: String(titular.project_id),
        folder_id: String(titular.folder_id),
        status: titular.status,
        is_active: titular.is_active,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs(titular)}>
            <Head title={`Editar: ${titular.nombre}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>Editar titular</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.put(update.url(titular.id));
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre *</Label>
                                <input
                                    id="nombre"
                                    type="text"
                                    value={form.data.nombre}
                                    onChange={(e) => form.setData('nombre', e.target.value)}
                                    required
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                />
                                <InputError message={form.errors.nombre} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="project_id">Proyecto *</Label>
                                <Select
                                    value={form.data.project_id}
                                    onValueChange={(v) => form.setData('project_id', v)}
                                >
                                    <SelectTrigger id="project_id">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.project_id} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="folder_id">Carpeta *</Label>
                                <Select
                                    value={form.data.folder_id}
                                    onValueChange={(v) => form.setData('folder_id', v)}
                                >
                                    <SelectTrigger id="folder_id">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {folders.map((f) => (
                                            <SelectItem key={f.id} value={String(f.id)}>
                                                {f.name} (v{f.version})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.folder_id} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Estado de revisión</Label>
                                <Select
                                    value={form.data.status}
                                    onValueChange={(v) => form.setData('status', v)}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statusLabels).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.status} />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_active"
                                    checked={form.data.is_active}
                                    onCheckedChange={(v) => form.setData('is_active', Boolean(v))}
                                />
                                <Label htmlFor="is_active">Activo</Label>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    Guardar cambios
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={titularesIndex().url}>Cancelar</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
