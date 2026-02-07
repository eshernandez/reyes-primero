import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import InputError from '@/components/input-error';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Usuario = {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
};

type Props = { usuario: Usuario };

const breadcrumbs = (usuario: Usuario): BreadcrumbItem[] => [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Usuarios', href: '/usuarios' },
    { title: usuario.name, href: '#' },
];

const ROLES = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'auxiliar', label: 'Auxiliar' },
];

export default function UsuariosEdit({ usuario }: Props) {
    const form = useForm({
        name: usuario.name,
        email: usuario.email,
        password: '',
        password_confirmation: '',
        role: usuario.role,
        is_active: usuario.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(`/usuarios/${usuario.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(usuario)}>
            <Head title={`Editar: ${usuario.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Editar usuario</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre *</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={form.errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    required
                                />
                                <InputError message={form.errors.email} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Nueva contraseña (dejar en blanco para no cambiar)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)}
                                    autoComplete="new-password"
                                />
                                <InputError message={form.errors.password} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirmar nueva contraseña</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={form.data.password_confirmation}
                                    onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Rol *</Label>
                                    <Select
                                        value={form.data.role}
                                        onValueChange={(v) => form.setData('role', v)}
                                    >
                                        <SelectTrigger id="role">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map((r) => (
                                                <SelectItem key={r.value} value={r.value}>
                                                    {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.role} />
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <Checkbox
                                        id="is_active"
                                        checked={form.data.is_active}
                                        onCheckedChange={(checked) =>
                                            form.setData('is_active', Boolean(checked))
                                        }
                                    />
                                    <Label htmlFor="is_active" className="font-normal">
                                        Activo
                                    </Label>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    Guardar cambios
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/usuarios">Cancelar</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
