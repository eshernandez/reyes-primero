import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, User } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import { create, destroy, edit, index as titularesIndex, show } from '@/routes/titulares';
import type { BreadcrumbItem } from '@/types';

type Titular = {
    id: number;
    nombre: string;
    access_code: string;
    completion_percentage: number;
    status: string;
    is_active: boolean;
    last_access: string | null;
    data?: Record<string, unknown>;
    project: { id: number; title: string };
    folder: { id: number; name: string; version: string };
};

type ProjectOption = { id: number; title: string };

type Props = {
    titulares: { data: Titular[]; links: unknown[]; current_page: number; last_page: number };
    projectsForFilter: ProjectOption[];
    filters: { search?: string; project_id?: string };
    statusLabels: Record<string, string>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Titulares', href: titularesIndex().url },
];

export default function TitularesIndex({ titulares, projectsForFilter, filters, statusLabels }: Props) {
    const applyFilters = (newFilters: { search?: string; project_id?: string }) => {
        router.get(titularesIndex().url, newFilters, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Titulares" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold">Titulares</h1>
                    <Button asChild>
                        <Link href={create().url}>
                            <Plus className="mr-2 size-4" />
                            Nuevo titular
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-4">
                            <div className="min-w-[200px]">
                                <Label className="text-xs">Buscar por nombre</Label>
                                <Input
                                    placeholder="Nombre..."
                                    value={filters.search ?? ''}
                                    onChange={(e) => applyFilters({ ...filters, search: e.target.value || undefined })}
                                    className="mt-1"
                                />
                            </div>
                            <div className="min-w-[200px]">
                                <Label className="text-xs">Proyecto</Label>
                                <Select
                                    value={filters.project_id ?? 'all'}
                                    onValueChange={(v) =>
                                        applyFilters({ ...filters, project_id: v === 'all' ? undefined : v })
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los proyectos</SelectItem>
                                        {projectsForFilter.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px]">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="p-3 text-left font-medium">Nombre</th>
                                <th className="p-3 text-left font-medium">Nombres</th>
                                <th className="p-3 text-left font-medium">Apellidos</th>
                                <th className="p-3 text-left font-medium">Correo</th>
                                <th className="p-3 text-left font-medium">Celular</th>
                                <th className="p-3 text-left font-medium">Proyecto</th>
                                <th className="p-3 text-left font-medium">Carpeta</th>
                                <th className="p-3 text-center font-medium">Completitud</th>
                                <th className="p-3 text-left font-medium">Revisión</th>
                                <th className="p-3 text-left font-medium">Cuenta</th>
                                <th className="w-10 p-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {titulares.data.map((t) => (
                                <tr key={t.id} className="border-b last:border-0">
                                    <td className="p-3">
                                        <Link href={show.url(t.id)} className="font-medium hover:underline">
                                            {t.nombre}
                                        </Link>
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {t.data?.nombres != null && t.data.nombres !== '' ? String(t.data.nombres) : '-'}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {t.data?.apellidos != null && t.data.apellidos !== '' ? String(t.data.apellidos) : '-'}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {t.data?.correo_electronico != null && t.data.correo_electronico !== '' ? String(t.data.correo_electronico) : '-'}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {t.data?.celular != null && t.data.celular !== '' ? String(t.data.celular) : '-'}
                                    </td>
                                    <td className="p-3">{t.project?.title ?? '-'}</td>
                                    <td className="p-3">
                                        {t.folder?.name ?? '-'} (v{t.folder?.version ?? '-'})
                                    </td>
                                    <td className="p-3 text-center">{t.completion_percentage}%</td>
                                    <td className="p-3">
                                        <span className="text-muted-foreground">
                                            {statusLabels[t.status] ?? t.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={
                                                t.is_active ? 'text-green-600' : 'text-muted-foreground'
                                            }
                                        >
                                            {t.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    ⋮
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={show.url(t.id)}>
                                                        <User className="mr-2 size-4" />
                                                        Ver
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={edit.url(t.id)}>
                                                        <Pencil className="mr-2 size-4" />
                                                        Editar
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        href={destroy.url(t.id)}
                                                        method="delete"
                                                        as="button"
                                                        className="w-full text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 size-4" />
                                                        Desactivar
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {titulares.data.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <p className="text-muted-foreground">No hay titulares.</p>
                            <Button asChild className="mt-4">
                                <Link href={create().url}>Crear primer titular</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
