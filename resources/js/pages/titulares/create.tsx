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
import { index as titularesIndex, store } from '@/routes/titulares';
import type { BreadcrumbItem } from '@/types';

type Project = { id: number; title: string };
type Folder = { id: number; name: string; version: string };

type Props = {
    projects: Project[];
    folders: Folder[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Titulares', href: titularesIndex().url },
    { title: 'Nuevo', href: '#' },
];

export default function TitularCreate({ projects, folders }: Props) {
    const form = useForm({
        nombre: '',
        project_id: '',
        folder_id: '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nuevo titular" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>Nuevo titular</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post(store().url);
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
                                <Label htmlFor="project_id">Proyecto *</Label>
                                <Select
                                    value={form.data.project_id}
                                    onValueChange={(v) => form.setData('project_id', v)}
                                    required
                                >
                                    <SelectTrigger id="project_id">
                                        <SelectValue placeholder="Seleccione proyecto..." />
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
                                    required
                                >
                                    <SelectTrigger id="folder_id">
                                        <SelectValue placeholder="Seleccione carpeta..." />
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
                            <div className="flex gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    Crear titular
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
