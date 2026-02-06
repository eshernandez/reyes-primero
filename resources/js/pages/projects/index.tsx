import { Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { dashboard } from '@/routes';
import { create, destroy, edit, index } from '@/routes/projects';
import type { BreadcrumbItem } from '@/types';

type Project = {
    id: number;
    title: string;
    description: string | null;
    valor_ingreso: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    status: string;
    titulares_count: number;
    creator?: { id: number; name: string } | null;
};

type Props = {
    projects: { data: Project[]; links: unknown[]; current_page: number; last_page: number };
    filters: { search?: string; status?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Proyectos', href: index().url },
];

export default function ProjectsIndex({ projects }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Proyectos" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Proyectos</h1>
                    <Button asChild>
                        <Link href={create().url}>
                            <Plus className="mr-2 size-4" />
                            Nuevo proyecto
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.data.map((project) => (
                        <Card key={project.id}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div>
                                    <CardTitle className="text-base">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="hover:underline"
                                        >
                                            {project.title}
                                        </Link>
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">
                                        {project.description || 'Sin descripción'}
                                    </CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-8">
                                            ⋮
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={edit.url(project.id)}>
                                                <Pencil className="mr-2 size-4" />
                                                Editar
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={destroy.url(project.id)}
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
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>{project.titulares_count} titulares</span>
                                    <span
                                        className={
                                            project.status === 'activo'
                                                ? 'text-green-600'
                                                : 'text-muted-foreground'
                                        }
                                    >
                                        {project.status === 'activo' ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {projects.data.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <p className="text-muted-foreground">No hay proyectos.</p>
                            <Button asChild className="mt-4">
                                <Link href={create().url}>Crear primer proyecto</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
