import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicFormField, type FieldDef } from '@/components/dynamic-form-field';
import { dashboard } from '@/routes';
import { index as titularesIndex, show } from '@/routes/titulares';
import type { BreadcrumbItem } from '@/types';

function getFieldEditRoleLabel(field: FieldDef): string | null {
    if (field.type === 'section') return null;
    if (field.visible_only_for_admin) return 'Solo visible para administrador';
    if (field.editable_by_both) return 'Editable por ambos';
    if (field.filled_by_admin) return 'Editable por administrador';
    return 'Lo diligencia el titular';
}

type FolderSection = { name: string; order: number; fields: FieldDef[] };

type Props = {
    titular: { id: number; nombre: string; data: Record<string, unknown> };
    sections: FolderSection[];
};

const dataEditUrl = (id: number) => `/titulares/${id}/data`;

const breadcrumbs = (titular: { id: number; nombre: string }): BreadcrumbItem[] => [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Titulares', href: titularesIndex().url },
    { title: titular.nombre, href: show.url(titular.id) },
    { title: 'Editar datos de carpeta', href: '#' },
];

export default function TitularDataEdit({ titular, sections }: Props) {
    const form = useForm({
        data: { ...(titular.data as Record<string, string | number>) },
    });

    const setDataField = (key: string, value: string | number | File | null) => {
        form.setData('data', { ...form.data.data, [key]: value ?? '' });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(titular)}>
            <Head title={`Editar datos: ${titular.nombre}`} />
            <div className="mx-auto max-w-3xl flex flex-col gap-4 rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Editar datos de la carpeta</CardTitle>
                        <CardDescription>
                            Los campos con etiqueta &quot;Editable por administrador&quot; o &quot;Editable por ambos&quot;
                            se pueden editar aquí. Los marcados &quot;Lo diligencia el titular&quot; son solo lectura.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.put(dataEditUrl(titular.id));
                            }}
                            className="space-y-6"
                        >
                            {(sections ?? []).map((section, idx) => (
                                <Card key={idx} className="border-2">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">{section.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {[...(section.fields ?? [])]
                                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                            .map((field, fieldIdx) => {
                                                const editRoleLabel = getFieldEditRoleLabel(field);
                                                const adminCanEdit =
                                                    field.type !== 'section' &&
                                                    (field.filled_by_admin === true || field.editable_by_both === true);
                                                return (
                                                    <div key={field.field_name ?? `section-${idx}-${fieldIdx}`} className="space-y-1">
                                                        {editRoleLabel && (
                                                            <Badge
                                                                variant={adminCanEdit ? 'default' : 'secondary'}
                                                                className="text-xs font-normal"
                                                            >
                                                                {editRoleLabel}
                                                            </Badge>
                                                        )}
                                                        <DynamicFormField
                                                            field={field}
                                                            value={
                                                                field.type === 'section'
                                                                    ? undefined
                                                                    : field.type === 'file'
                                                                      ? typeof form.data.data[field.field_name as string] ===
                                                                        'string'
                                                                        ? form.data.data[field.field_name as string]
                                                                        : undefined
                                                                      : form.data.data[field.field_name as string]
                                                            }
                                                            onChange={(v) => {
                                                                if (field.type === 'section') return;
                                                                setDataField(field.field_name as string, v ?? null);
                                                            }}
                                                            error={
                                                                field.type === 'section'
                                                                    ? undefined
                                                                    : (form.errors as Record<string, string>)[
                                                                          field.field_name as string
                                                                      ]
                                                            }
                                                            disabled={!adminCanEdit}
                                                            fileDownloadUrl={
                                                                field.type === 'file'
                                                                    ? (path) =>
                                                                          `/titulares/${titular.id}/file?path=${encodeURIComponent(path)}`
                                                                    : undefined
                                                            }
                                                        />
                                                    </div>
                                                );
                                            })}
                                    </CardContent>
                                </Card>
                            ))}
                            <div className="flex gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    Guardar datos
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={show.url(titular.id)}>Volver al titular</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
