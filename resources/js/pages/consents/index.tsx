import { Head, Link, router } from '@inertiajs/react';
import { FileCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, type PaginationLink } from '@/components/pagination';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { dashboard } from '@/routes';
import { create, destroy, edit, index as consentsIndex } from '@/routes/consents';
import type { BreadcrumbItem } from '@/types';

type Consent = {
    id: number;
    title: string;
    version: string;
    is_active: boolean;
    folders_count: number;
    creator?: { id: number; name: string } | null;
};

type Props = {
    consents: { data: Consent[]; links: PaginationLink[]; current_page: number; last_page: number };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Consentimientos', href: consentsIndex().url },
];

export default function ConsentsIndex({ consents }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Consentimientos" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold">Consentimientos</h1>
                    <Button asChild>
                        <Link href={create().url}>
                            <Plus className="mr-2 size-4" />
                            Nuevo consentimiento
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheck className="size-5" />
                            Consentimientos informados
                        </CardTitle>
                        <CardDescription>
                            Textos de consentimiento que los titulares deben aceptar al acceder a su carpeta. Se
                            asocian a las carpetas en la configuración de cada una.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {consents.data.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay consentimientos creados.</p>
                        ) : (
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="p-3 text-left font-medium">Título</th>
                                            <th className="p-3 text-left font-medium">Versión</th>
                                            <th className="p-3 text-left font-medium">Estado</th>
                                            <th className="p-3 text-left font-medium">Carpetas</th>
                                            <th className="p-3 text-left font-medium">Creado por</th>
                                            <th className="w-10 p-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {consents.data.map((c) => (
                                            <tr key={c.id} className="border-b last:border-0">
                                                <td className="p-3 font-medium">{c.title}</td>
                                                <td className="p-3 text-muted-foreground">{c.version}</td>
                                                <td className="p-3">
                                                    <Badge variant={c.is_active ? 'default' : 'secondary'}>
                                                        {c.is_active ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-muted-foreground">{c.folders_count}</td>
                                                <td className="p-3 text-muted-foreground">{c.creator?.name ?? '-'}</td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="size-8" asChild>
                                                                    <Link href={edit.url(c.id)} aria-label="Editar">
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
                                                                    aria-label="Eliminar"
                                                                    onClick={() => {
                                                                        if (window.confirm('¿Eliminar este consentimiento?')) {
                                                                            router.delete(destroy.url(c.id));
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Eliminar</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {consents.last_page > 1 && (
                            <div className="mt-4 flex justify-center">
                                <Pagination links={consents.links} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
