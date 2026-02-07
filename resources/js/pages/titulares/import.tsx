import { Head, Link, useForm } from '@inertiajs/react';
import { FileSpreadsheet, Upload } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import InputError from '@/components/input-error';
import { dashboard } from '@/routes';
import { index as titularesIndex } from '@/routes/titulares';
import type { BreadcrumbItem } from '@/types';

type Project = { id: number; title: string };
type Folder = { id: number; name: string; version: string };

type Props = {
    projects: Project[];
    folders: Folder[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Titulares', href: titularesIndex().url },
    { title: 'Importar', href: '#' },
];

export default function TitularesImport({ projects, folders }: Props) {
    const form = useForm({
        project_id: '',
        folder_id: '',
        file: null as File | null,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Importar titulares" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="size-5" />
                            Importación pasiva de titulares
                        </CardTitle>
                        <CardDescription>
                            Suba un archivo Excel o CSV con una fila de encabezados. La primera columna (o columna
                            &quot;Nombre&quot;) debe ser el nombre del titular. El resto de columnas se cargarán como
                            datos de la carpeta si coinciden con los nombres de los campos (ej.: nombres, apellidos,
                            correo_electronico, celular).{' '}
                            <Link
                                href="/titulares/import/template"
                                className="font-medium text-primary underline hover:no-underline"
                            >
                                Descargar plantilla CSV
                            </Link>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post('/titulares/import');
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="project_id">Proyecto *</Label>
                                <Select
                                    value={form.data.project_id || 'all'}
                                    onValueChange={(v) => form.setData('project_id', v === 'all' ? '' : v)}
                                    required
                                >
                                    <SelectTrigger id="project_id">
                                        <SelectValue placeholder="Seleccione proyecto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Seleccione proyecto</SelectItem>
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.project_id} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="folder_id">Carpeta *</Label>
                                <Select
                                    value={form.data.folder_id || 'all'}
                                    onValueChange={(v) => form.setData('folder_id', v === 'all' ? '' : v)}
                                    required
                                >
                                    <SelectTrigger id="folder_id">
                                        <SelectValue placeholder="Seleccione carpeta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Seleccione carpeta</SelectItem>
                                        {folders.map((f) => (
                                            <SelectItem key={f.id} value={String(f.id)}>
                                                {f.name} (v{f.version})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.folder_id} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file">Archivo (Excel o CSV) *</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)}
                                    required
                                />
                                <InputError message={form.errors.file} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    <Upload className="mr-2 size-4" />
                                    {form.processing ? 'Importando...' : 'Importar'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={titularesIndex().url}>Cancelar</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
