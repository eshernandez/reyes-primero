import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { edit, index as foldersIndex } from '@/routes/folders';
import type { BreadcrumbItem } from '@/types';

type Folder = {
    id: number;
    name: string;
    description: string | null;
    version: string;
    fields: Record<string, unknown>;
    is_default: boolean;
    titulares_count: number;
    creator?: { id: number; name: string } | null;
};

type Props = { folder: Folder };

const breadcrumbs = (folder: Folder): BreadcrumbItem[] => [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Carpetas', href: foldersIndex().url },
    { title: folder.name, href: '#' },
];

type Section = { name: string; order: number; fields: Array<Record<string, unknown>> };

function getSectionsFromFolder(fields: Record<string, unknown> | undefined): Section[] {
    if (!fields || typeof fields !== 'object') return [];
    const sections = fields.sections as Section[] | undefined;
    if (Array.isArray(sections) && sections.length > 0) {
        return [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    const flat = fields.fields as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(flat) && flat.length > 0) {
        return [{ name: 'Datos', order: 0, fields: flat }];
    }
    return [];
}

export default function FolderShow({ folder }: Props) {
    const sections = getSectionsFromFolder(folder.fields as Record<string, unknown> | undefined);
    const totalFields = sections.reduce((n, s) => n + (s.fields?.length ?? 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs(folder)}>
            <Head title={folder.name} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">{folder.name}</h1>
                    <Button asChild>
                        <Link href={edit.url(folder.id)}>Editar</Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles</CardTitle>
                        <CardDescription>
                            Versión {folder.version}
                            {folder.is_default ? ' · Por defecto' : ''} · {folder.titulares_count}{' '}
                            titulares
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {folder.description && (
                            <p className="text-sm text-muted-foreground">{folder.description}</p>
                        )}
                        {folder.creator && (
                            <p className="text-sm text-muted-foreground">
                                Creado por: {folder.creator.name}
                            </p>
                        )}
                        {totalFields > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium">Campos ({totalFields})</h3>
                                {sections.map((sec, idx) => (
                                    <div key={idx}>
                                        {sections.length > 1 && (
                                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                {sec.name}
                                            </p>
                                        )}
                                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                                            {[...(sec.fields ?? [])]
                                                .sort(
                                                    (a, b) =>
                                                        (Number(a.order) ?? 0) - (Number(b.order) ?? 0),
                                                )
                                                .map((f, i) => (
                                                    <li key={i}>
                                                        {(f.label as string) ?? (f.field_name as string)}{' '}
                                                        ({f.type as string})
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
