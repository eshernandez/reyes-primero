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
import { Pagination, type PaginationLink } from '@/components/pagination';
import { dashboard } from '@/routes';
import { create, destroy, edit, index } from '@/routes/folders';
import type { BreadcrumbItem } from '@/types';

type Folder = {
    id: number;
    name: string;
    description: string | null;
    version: string;
    is_default: boolean;
    titulares_count: number;
    creator?: { id: number; name: string } | null;
};

type Props = {
    folders: { data: Folder[]; links: PaginationLink[]; current_page: number; last_page: number };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Carpetas', href: index().url },
];

export default function FoldersIndex({ folders }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Carpetas" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Carpetas</h1>
                    <Button asChild>
                        <Link href={create().url}>
                            <Plus className="mr-2 size-4" />
                            Nueva carpeta
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {folders.data.map((folder) => (
                        <Card key={folder.id}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div>
                                    <CardTitle className="text-base">
                                        <Link
                                            href={`/folders/${folder.id}`}
                                            className="hover:underline"
                                        >
                                            {folder.name}
                                        </Link>
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">
                                        {folder.description || 'Sin descripción'}
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
                                            <Link href={edit.url(folder.id)}>
                                                <Pencil className="mr-2 size-4" />
                                                Editar
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={destroy.url(folder.id)}
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
                                    <span>{folder.titulares_count} titulares</span>
                                    <span>
                                        v{folder.version}
                                        {folder.is_default ? ' · Por defecto' : ''}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {folders.data.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <p className="text-muted-foreground">No hay carpetas.</p>
                            <Button asChild className="mt-4">
                                <Link href={create().url}>Crear primera carpeta</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {folders.last_page > 1 && (
                    <div className="flex justify-center pt-4">
                        <Pagination links={folders.links} />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
