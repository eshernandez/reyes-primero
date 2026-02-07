import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import type { BreadcrumbItem } from '@/types';

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
};

type Props = {
    users: { data: UserRow[]; links: PaginationLink[]; current_page: number; last_page: number };
    canManageUsers: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Usuarios', href: '/usuarios' },
];

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    auxiliar: 'Auxiliar',
};

export default function UsuariosIndex({ users, canManageUsers }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold">Usuarios</h1>
                    {canManageUsers && (
                        <Button asChild>
                            <Link href="/usuarios/create">
                                <Plus className="mr-2 size-4" />
                                Nuevo usuario
                            </Link>
                        </Button>
                    )}
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Gestión de usuarios
                        </CardTitle>
                        <CardDescription>
                            Usuarios con acceso al panel de administración. Solo Super Admin puede crear, editar o
                            eliminar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {users.data.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay usuarios.</p>
                        ) : (
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="p-3 text-left font-medium">Nombre</th>
                                            <th className="p-3 text-left font-medium">Correo</th>
                                            <th className="p-3 text-left font-medium">Rol</th>
                                            <th className="p-3 text-left font-medium">Estado</th>
                                            {canManageUsers && <th className="w-10 p-3" />}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.data.map((u) => (
                                            <tr key={u.id} className="border-b last:border-0">
                                                <td className="p-3 font-medium">{u.name}</td>
                                                <td className="p-3 text-muted-foreground">{u.email}</td>
                                                <td className="p-3">{ROLE_LABELS[u.role] ?? u.role}</td>
                                                <td className="p-3">
                                                    <Badge variant={u.is_active ? 'default' : 'secondary'}>
                                                        {u.is_active ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </td>
                                                {canManageUsers && (
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="size-8" asChild>
                                                                        <Link href={`/usuarios/${u.id}/edit`} aria-label="Editar">
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
                                                                            if (
                                                                                window.confirm(
                                                                                    '¿Eliminar este usuario?'
                                                                                )
                                                                            ) {
                                                                                router.delete(`/usuarios/${u.id}`);
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
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {users.last_page > 1 && (
                            <div className="mt-4 flex justify-center">
                                <Pagination links={users.links} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
