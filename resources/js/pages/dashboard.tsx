import { Head, Link } from '@inertiajs/react';
import { FolderOpen, FolderTree, Users } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { index as foldersIndex } from '@/routes/folders';
import { index as projectsIndex } from '@/routes/projects';
import { index as titularesIndex } from '@/routes/titulares';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
];

type Props = {
    stats: {
        projects_count: number;
        folders_count: number;
        titulares_count: number;
    };
};

export default function Dashboard({ stats }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Proyectos</CardTitle>
                            <FolderOpen className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.projects_count}</div>
                            <p className="text-xs text-muted-foreground">Proyectos activos</p>
                            <Link href={projectsIndex().url} className="mt-2 inline-block text-sm text-primary hover:underline">
                                Ver proyectos →
                            </Link>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Carpetas</CardTitle>
                            <FolderTree className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.folders_count}</div>
                            <p className="text-xs text-muted-foreground">Plantillas de carpeta</p>
                            <Link href={foldersIndex().url} className="mt-2 inline-block text-sm text-primary hover:underline">
                                Ver carpetas →
                            </Link>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Titulares</CardTitle>
                            <Users className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.titulares_count}</div>
                            <p className="text-xs text-muted-foreground">Total titulares</p>
                            <Link href={titularesIndex().url} className="mt-2 inline-block text-sm text-primary hover:underline">
                                Ver titulares →
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
