import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import {
    FolderFormDesigner,
    buildFieldsFromDesigner,
    parseFolderFieldsToDesigner,
    type DesignerSection,
} from '@/components/folder-form-designer';
import { dashboard } from '@/routes';
import { index as foldersIndex } from '@/routes/folders';
import { store } from '@/routes/folders';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Carpetas', href: foldersIndex().url },
    { title: 'Nueva', href: '#' },
];

const initialSections: DesignerSection[] = [
    { id: '_init_1', name: 'Datos', order: 0, fields: [] },
];

export default function FolderCreate() {
    const [designerSections, setDesignerSections] = useState<DesignerSection[]>(initialSections);
    const sectionsRef = useRef(designerSections);
    useEffect(() => {
        sectionsRef.current = designerSections;
    }, [designerSections]);

    const form = useForm({
        name: '',
        description: '',
        version: '1.0',
        is_default: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const sections = sectionsRef.current;
        const fields = buildFieldsFromDesigner(sections, form.data.version);
        form.transform((data) => ({ ...data, fields }));
        form.post(store().url);
    };

    const rawFieldsError =
        form.errors.fields ??
        (form.errors as Record<string, string | string[]>)['fields.sections'] ??
        (form.errors as Record<string, string | string[]>)['fields.fields'];
    const fieldsError = Array.isArray(rawFieldsError) ? rawFieldsError[0] : (rawFieldsError as string);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nueva carpeta" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Nueva carpeta</CardTitle>
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
                                <Label htmlFor="description">Descripción</Label>
                                <textarea
                                    id="description"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    rows={3}
                                />
                                <InputError message={form.errors.description} />
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
                                        id="is_default"
                                        checked={form.data.is_default}
                                        onCheckedChange={(checked) =>
                                            form.setData('is_default', Boolean(checked))
                                        }
                                    />
                                    <Label htmlFor="is_default" className="font-normal">
                                        Carpeta por defecto
                                    </Label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <FolderFormDesigner sections={designerSections} onChange={setDesignerSections} />
                                <InputError message={fieldsError} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    Crear carpeta
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={foldersIndex().url}>Cancelar</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
