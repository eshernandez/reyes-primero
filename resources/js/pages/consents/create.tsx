import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import { dashboard } from '@/routes';
import { index as consentsIndex, store } from '@/routes/consents';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Consentimientos', href: consentsIndex().url },
    { title: 'Nuevo', href: '#' },
];

export default function ConsentCreate() {
    const form = useForm({
        title: '',
        content: '',
        version: '1.0',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(store().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nuevo consentimiento" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Nuevo consentimiento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título *</Label>
                                <Input
                                    id="title"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    required
                                />
                                <InputError message={form.errors.title} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Contenido *</Label>
                                <textarea
                                    id="content"
                                    value={form.data.content}
                                    onChange={(e) => form.setData('content', e.target.value)}
                                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    rows={10}
                                    required
                                />
                                <InputError message={form.errors.content} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="version">Versión *</Label>
                                    <Input
                                        id="version"
                                        value={form.data.version}
                                        onChange={(e) => form.setData('version', e.target.value)}
                                        placeholder="1.0"
                                    />
                                    <InputError message={form.errors.version} />
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
                                    Crear consentimiento
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={consentsIndex().url}>Cancelar</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
