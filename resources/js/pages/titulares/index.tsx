import { Head, Link, router } from '@inertiajs/react';
import { Eye, FileSpreadsheet, Mail, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDebouncedFilterFields } from '@/hooks/use-debounced-filter-fields';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, type PaginationLink } from '@/components/pagination';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    invitation_sent_at: string | null;
    data?: Record<string, unknown>;
    project: { id: number; title: string };
    folder: { id: number; name: string; version: string };
};

type ProjectOption = { id: number; title: string };
type FolderOption = { id: number; name: string; version: string };

type Filters = {
    search?: string;
    project_id?: string;
    folder_id?: string;
    status?: string;
    completitud?: string;
    completitud_min?: string;
    completitud_max?: string;
    telefono?: string;
};

type Props = {
    titulares: { data: Titular[]; links: PaginationLink[]; current_page: number; last_page: number };
    projectsForFilter: ProjectOption[];
    foldersForFilter: FolderOption[];
    filters: Filters;
    statusLabels: Record<string, string>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Titulares', href: titularesIndex().url },
];

const COMPLETITUD_OPTIONS = [
    { value: 'all', label: 'Cualquier completitud' },
    { value: '0-25', label: '0-25%' },
    { value: '26-50', label: '26-50%' },
    { value: '51-75', label: '51-75%' },
    { value: '76-100', label: '76-100%' },
];

export default function TitularesIndex({ titulares, projectsForFilter, foldersForFilter, filters, statusLabels }: Props) {
    const [inviteOpen, setInviteOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [includeAlreadyInvited, setIncludeAlreadyInvited] = useState(false);
    const [inviting, setInviting] = useState(false);

    const { fieldValues, setFieldValue, applyFilters } = useDebouncedFilterFields<Filters>(
        ['search', 'telefono'],
        filters,
        (merged) => router.get(titularesIndex().url, merged, { preserveState: true }),
        { delayMs: 750 }
    );

    const openInviteModal = () => {
        setSelectedIds(titulares.data.map((t) => t.id));
        setIncludeAlreadyInvited(false);
        setInviteOpen(true);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const selectAllPage = () => {
        setSelectedIds(titulares.data.map((t) => t.id));
    };

    const deselectAll = () => {
        setSelectedIds([]);
    };

    const submitInvitations = () => {
        if (selectedIds.length === 0) return;
        setInviting(true);
        router.post('/titulares/send-invitations', {
            titular_ids: selectedIds,
            include_already_invited: includeAlreadyInvited,
        }, {
            preserveScroll: true,
            onFinish: () => setInviting(false),
            onSuccess: () => setInviteOpen(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Titulares" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold">Titulares</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={openInviteModal} type="button">
                            <Mail className="mr-2 size-4" />
                            Invitar
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/titulares/import/create">
                                <FileSpreadsheet className="mr-2 size-4" />
                                Importar
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={create().url}>
                                <Plus className="mr-2 size-4" />
                                Nuevo titular
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-4">
                            <div className="min-w-[200px]">
                                <Label className="text-xs">Buscar por nombre</Label>
                                <Input
                                    placeholder="Nombre..."
                                    value={fieldValues.search ?? ''}
                                    onChange={(e) => setFieldValue('search', e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div className="min-w-[200px]">
                                <Label className="text-xs">Teléfono</Label>
                                <Input
                                    placeholder="Celular..."
                                    value={fieldValues.telefono ?? ''}
                                    onChange={(e) => setFieldValue('telefono', e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div className="min-w-[200px]">
                                <Label className="text-xs">Proyecto</Label>
                                <Select
                                    value={filters.project_id ?? 'all'}
                                    onValueChange={(v) =>
                                        applyFilters({ project_id: v === 'all' ? undefined : v })
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
                            <div className="min-w-[200px]">
                                <Label className="text-xs">Carpeta</Label>
                                <Select
                                    value={filters.folder_id ?? 'all'}
                                    onValueChange={(v) =>
                                        applyFilters({ folder_id: v === 'all' ? undefined : v })
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Todas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las carpetas</SelectItem>
                                        {(foldersForFilter ?? []).map((f) => (
                                            <SelectItem key={f.id} value={String(f.id)}>
                                                {f.name} (v{f.version})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="min-w-[200px]">
                                <Label className="text-xs">Completitud (rango)</Label>
                                <Select
                                    value={filters.completitud ?? 'all'}
                                    onValueChange={(v) =>
                                        applyFilters({
                                            completitud: v === 'all' ? undefined : v,
                                            completitud_min: undefined,
                                            completitud_max: undefined,
                                        })
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Cualquier completitud" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COMPLETITUD_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="min-w-[100px]">
                                <Label className="text-xs">Completitud mín. %</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="0"
                                    value={filters.completitud_min ?? ''}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/\D/g, '');
                                        const n = v === '' ? undefined : Math.min(100, Math.max(0, parseInt(v, 10) || 0));
                                        applyFilters({
                                            completitud_min: n !== undefined ? String(n) : undefined,
                                            completitud: n !== undefined && n > 0 ? undefined : filters.completitud,
                                        });
                                    }}
                                    className="mt-1"
                                />
                            </div>
                            <div className="min-w-[100px]">
                                <Label className="text-xs">Completitud máx. %</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="100"
                                    value={filters.completitud_max ?? ''}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/\D/g, '');
                                        const n = v === '' ? undefined : Math.min(100, Math.max(0, parseInt(v, 10) || 0));
                                        applyFilters({
                                            completitud_max: n !== undefined ? String(n) : undefined,
                                            completitud: n !== undefined && n < 100 ? undefined : filters.completitud,
                                        });
                                    }}
                                    className="mt-1"
                                />
                            </div>
                            <div className="min-w-[200px]">
                                <Label className="text-xs">Revisión</Label>
                                <Select
                                    value={filters.status ?? 'all'}
                                    onValueChange={(v) =>
                                        applyFilters({ status: v === 'all' ? undefined : v })
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        {Object.entries(statusLabels).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
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
                                        <div className="flex items-center gap-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8" asChild>
                                                        <Link href={show.url(t.id)} aria-label="Ver">
                                                            <Eye className="size-4" />
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Ver</TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8" asChild>
                                                        <Link href={edit.url(t.id)} aria-label="Editar">
                                                            <Pencil className="size-4" />
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Editar</TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-destructive hover:text-destructive"
                                                        aria-label="Desactivar"
                                                        onClick={() => router.delete(destroy.url(t.id))}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Desactivar</TooltipContent>
                                            </Tooltip>
                                        </div>
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

                {titulares.last_page > 1 && (
                    <div className="flex justify-center pt-4">
                        <Pagination links={titulares.links} />
                    </div>
                )}

                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Invitar titulares por correo</DialogTitle>
                            <DialogDescription>
                                Seleccione los titulares a los que desea enviar la invitación a su carpeta privada. Solo se enviará a quienes tengan correo en su carpeta.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={selectAllPage}>
                                    Seleccionar todos (página actual)
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
                                    Quitar selección
                                </Button>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="include-already"
                                    checked={includeAlreadyInvited}
                                    onCheckedChange={(c) => setIncludeAlreadyInvited(!!c)}
                                />
                                <Label htmlFor="include-already" className="text-sm font-normal cursor-pointer">
                                    Incluir ya invitados (reenviar invitación)
                                </Label>
                            </div>
                            <div className="max-h-[240px] overflow-y-auto rounded border p-2 space-y-2">
                                {titulares.data.map((t) => (
                                    <div key={t.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`invite-${t.id}`}
                                            checked={selectedIds.includes(t.id)}
                                            onCheckedChange={() => toggleSelect(t.id)}
                                        />
                                        <Label htmlFor={`invite-${t.id}`} className="flex-1 cursor-pointer text-sm font-normal truncate">
                                            {t.nombre}
                                            {t.data?.correo_electronico ? '' : ' (sin correo)'}
                                            {t.invitation_sent_at ? ' · Ya invitado' : ''}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="button" onClick={submitInvitations} disabled={selectedIds.length === 0 || inviting}>
                                {inviting ? 'Enviando…' : `Enviar a ${selectedIds.length} titular(es)`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
