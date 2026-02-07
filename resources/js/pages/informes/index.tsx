import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { FileBarChart, FileDown, FolderOpen, FolderTree, Users, UserCog } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Informes', href: '#' },
];

type ProjectOption = { id: number; title: string };
type FolderOption = { id: number; name: string; version: string };

type Props = {
    stats: {
        proyectos: number;
        carpetas: number;
        titulares: number;
        usuarios: number;
    };
    titularesPorEstado: Record<string, number>;
    titularesPorProyecto: { id: number; title: string; titulares_count: number }[];
    statusLabels: Record<string, string>;
    projectsForFilter: ProjectOption[];
    foldersForFilter: FolderOption[];
};

const STAT_CARDS = [
    { key: 'proyectos', label: 'Proyectos', icon: FolderOpen },
    { key: 'carpetas', label: 'Carpetas', icon: FolderTree },
    { key: 'titulares', label: 'Titulares', icon: Users },
    { key: 'usuarios', label: 'Usuarios', icon: UserCog },
] as const;

const EXPORT_URL = '/informes/titulares/excel';
const EXPORT_APORTES_URL = '/informes/titulares/aportes-excel';

export default function InformesIndex({
    stats,
    titularesPorEstado,
    titularesPorProyecto,
    statusLabels,
    projectsForFilter,
    foldersForFilter,
}: Props) {
    const [projectId, setProjectId] = useState<string>('');
    const [folderId, setFolderId] = useState<string>('');
    const [status, setStatus] = useState<string>('');

    const buildExportParams = () => {
        const params = new URLSearchParams();
        if (projectId && projectId !== 'all') params.set('project_id', projectId);
        if (folderId && folderId !== 'all') params.set('folder_id', folderId);
        if (status && status !== 'all') params.set('status', status);
        return params.toString();
    };

    const handleDownload = (e: React.FormEvent) => {
        e.preventDefault();
        const qs = buildExportParams();
        window.location.href = qs ? `${EXPORT_URL}?${qs}` : EXPORT_URL;
    };

    const handleDownloadAportes = (e: React.FormEvent) => {
        e.preventDefault();
        const qs = buildExportParams();
        window.location.href = qs ? `${EXPORT_APORTES_URL}?${qs}` : EXPORT_APORTES_URL;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Informes" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <h1 className="text-2xl font-semibold">Informes</h1>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileDown className="size-5" />
                            Exportar titulares a Excel
                        </CardTitle>
                        <CardDescription>
                            Elija los filtros y descargue los datos de titulares en un archivo Excel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleDownload}
                            className="flex flex-wrap items-end gap-4"
                        >
                            <div className="min-w-[200px]">
                                <Label className="text-xs">Proyecto</Label>
                                <Select value={projectId} onValueChange={setProjectId}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Todos los proyectos" />
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
                                <Select value={folderId} onValueChange={setFolderId}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Todas las carpetas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las carpetas</SelectItem>
                                        {foldersForFilter.map((f) => (
                                            <SelectItem key={f.id} value={String(f.id)}>
                                                {f.name} (v{f.version})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="min-w-[200px]">
                                <Label className="text-xs">Estado</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Todos los estados" />
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
                            <Button type="submit">
                                <FileDown className="mr-2 size-4" />
                                Descargar Excel
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileDown className="size-5" />
                            Exportar titulares con aportes y planes
                        </CardTitle>
                        <CardDescription>
                            Descargue un Excel con los titulares y sus aportes (valor, estado, plan asociado). Use los
                            mismos filtros de arriba y pulse el botón.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleDownloadAportes} className="flex flex-wrap items-end gap-4">
                            <div className="min-w-[200px]">
                                <Label className="text-xs">Proyecto</Label>
                                <Select value={projectId} onValueChange={setProjectId}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Todos los proyectos" />
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
                                <Select value={folderId} onValueChange={setFolderId}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Todas las carpetas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las carpetas</SelectItem>
                                        {foldersForFilter.map((f) => (
                                            <SelectItem key={f.id} value={String(f.id)}>
                                                {f.name} (v{f.version})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="min-w-[200px]">
                                <Label className="text-xs">Estado</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Todos los estados" />
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
                            <Button type="submit" variant="secondary">
                                <FileDown className="mr-2 size-4" />
                                Descargar Excel (aportes y planes)
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {STAT_CARDS.map(({ key, label, icon: Icon }) => (
                        <Card key={key}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                                <Icon className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats[key]}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileBarChart className="size-5" />
                                Titulares por estado
                            </CardTitle>
                            <CardDescription>
                                Cantidad de titulares en cada estado de revisión.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {Object.keys(titularesPorEstado).length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay datos.</p>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(titularesPorEstado).map(([status, total]) => (
                                        <div
                                            key={status}
                                            className="flex items-center justify-between rounded-md border p-2 text-sm"
                                        >
                                            <span>{statusLabels[status] ?? status}</span>
                                            <span className="font-medium">{total}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Titulares por proyecto</CardTitle>
                            <CardDescription>
                                Proyectos con más titulares (top 10).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {titularesPorProyecto.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay proyectos.</p>
                            ) : (
                                <div className="space-y-2">
                                    {titularesPorProyecto.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between rounded-md border p-2 text-sm"
                                        >
                                            <Link
                                                href={`/titulares?project_id=${p.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {p.title}
                                            </Link>
                                            <span className="text-muted-foreground">{p.titulares_count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
