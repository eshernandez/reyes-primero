import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { edit, index as projectsIndex } from '@/routes/projects';
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

type Props = { project: Project };

const breadcrumbs = (project: Project): BreadcrumbItem[] => [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Proyectos', href: projectsIndex().url },
    { title: project.title, href: '#' },
];

export default function ProjectShow({ project }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs(project)}>
            <Head title={project.title} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">{project.title}</h1>
                    <Button asChild>
                        <Link href={edit.url(project.id)}>Editar</Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles</CardTitle>
                        <CardDescription>
                            Estado: {project.status === 'activo' ? 'Activo' : 'Inactivo'} · {project.titulares_count} titulares
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {project.description && (
                            <p className="text-sm text-muted-foreground">{project.description}</p>
                        )}
                        <p className="text-sm">
                            <span className="font-medium">Valor de ingreso:</span> {project.valor_ingreso}
                        </p>
                        {project.fecha_inicio && (
                            <p className="text-sm">
                                <span className="font-medium">Fecha inicio:</span> {project.fecha_inicio}
                            </p>
                        )}
                        {project.fecha_fin && (
                            <p className="text-sm">
                                <span className="font-medium">Fecha fin:</span> {project.fecha_fin}
                            </p>
                        )}
                        {project.creator && (
                            <p className="text-sm text-muted-foreground">
                                Creado por: {project.creator.name}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
