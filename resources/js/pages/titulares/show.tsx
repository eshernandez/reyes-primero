import { Head, Link, router, useForm } from '@inertiajs/react';
import { Download, FileText, Key, Link2, MessageSquare, Plus, Send } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { dashboard } from '@/routes';
import { edit, index as titularesIndex } from '@/routes/titulares';
import type { BreadcrumbItem } from '@/types';

type Section = { name: string; order: number; fields: Array<{ field_name?: string; label: string; type?: string }> };

type Note = {
    id: number;
    body: string;
    created_at: string;
    author: { id: number; name: string };
};

type Plan = { id: number; nombre: string; valor_ingreso: string; fecha_cierre: string | null };
type Aporte = {
    id: number;
    fecha_consignacion?: string | null;
    nro_recibo?: string | null;
    valor: string;
    estado: string;
    created_at: string;
    soporte_path?: string | null;
    verific_antecedentes?: string | null;
    observaciones?: string | null;
    approved_at?: string | null;
    plan: { id: number; nombre: string } | null;
    approved_by_user: { id: number; name: string } | null;
};

type Titular = {
    id: number;
    nombre: string;
    access_code: string;
    unique_url: string;
    folder_version: string;
    completion_percentage: number;
    status: string;
    is_active: boolean;
    last_access: string | null;
    data?: Record<string, unknown>;
    project: { id: number; title: string };
    folder: { id: number; name: string; version: string };
    creator?: { id: number; name: string } | null;
    notes?: Note[];
    aportes?: Aporte[];
};

type Props = {
    titular: Titular;
    sections: Section[];
    statusLabels?: Record<string, string>;
    aportes?: Aporte[];
    aporteEstadoLabels?: Record<string, string>;
    plans?: Plan[];
};

const breadcrumbs = (titular: Titular): BreadcrumbItem[] => [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Titulares', href: titularesIndex().url },
    { title: titular.nombre, href: '#' },
];

function fileDownloadUrl(titularId: number, path: string): string {
    return `/titulares/${titularId}/file?path=${encodeURIComponent(path)}`;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    en_proceso: 'secondary',
    aceptado: 'default',
    rechazado: 'destructive',
    devuelto: 'outline',
    revision: 'secondary',
};

export default function TitularShow({ titular, sections, statusLabels = {}, aportes = [], aporteEstadoLabels = {}, plans = [] }: Props) {
    const accessUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/titular/access/${titular.unique_url}`;
    const data = titular.data ?? {};
    const notes = titular.notes ?? [];
    const status = titular.status ?? 'en_proceso';
    const [notesOpen, setNotesOpen] = useState(false);
    const [gestionarAporte, setGestionarAporte] = useState<Aporte | null>(null);
    const [addAporteOpen, setAddAporteOpen] = useState(false);

    const noteForm = useForm({
        body: '',
        mark_as_returned: false,
    });

    const addAporteForm = useForm({
        fecha_consignacion: '',
        nro_recibo: '',
        valor: '',
        plan_id: '' as number | '',
        verific_antecedentes: '',
        observaciones: '',
        soporte: null as File | null,
    });

    const gestionarForm = useForm({
        plan_id: '' as number | '',
        estado: 'aprobado' as 'aprobado' | 'rechazado',
        verific_antecedentes: '',
        observaciones: '',
    });

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        noteForm.post(`/titulares/${titular.id}/notes`, {
            preserveScroll: true,
            onSuccess: () => {
                noteForm.reset('body');
                noteForm.setData('mark_as_returned', false);
            },
        });
    };

    const handleStatusChange = (value: string) => {
        router.patch(`/titulares/${titular.id}/status`, { status: value }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(titular)}>
            <Head title={titular.nombre} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">{titular.nombre}</h1>
                    <div className="flex items-center gap-2">
                        <Select
                            value={status}
                            onValueChange={handleStatusChange}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(statusLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setNotesOpen(true)}
                            className="relative"
                        >
                            <MessageSquare className="mr-2 size-4" />
                            Notas
                            {notes.length > 0 && (
                                <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                                    {notes.length}
                                </span>
                            )}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/titulares/${titular.id}/data`}>Editar datos de carpeta</Link>
                        </Button>
                        <Button asChild>
                            <Link href={edit.url(titular.id)}>Editar</Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Acceso</CardTitle>
                        <CardDescription>Código y URL para que el titular ingrese a su carpeta</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Código de 6 dígitos (contraseña)</p>
                                <p className="mt-1 font-mono text-lg">{titular.access_code}</p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (window.confirm('¿Generar un nuevo código? El actual dejará de funcionar.')) {
                                        router.post(`/titulares/${titular.id}/regenerate-code`);
                                    }
                                }}
                            >
                                <Key className="mr-2 size-4" />
                                Generar nuevo código
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-muted-foreground">URL de acceso directo</p>
                                <p className="mt-1 break-all font-mono text-sm">{accessUrl}</p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                onClick={() => {
                                    if (window.confirm('¿Generar una nueva URL? La actual dejará de funcionar.')) {
                                        router.post(`/titulares/${titular.id}/regenerate-url`);
                                    }
                                }}
                            >
                                <Link2 className="mr-2 size-4" />
                                Generar nueva URL
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detalles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm">
                            <span className="font-medium">Proyecto:</span> {titular.project?.title ?? '-'}
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Carpeta:</span> {titular.folder?.name ?? '-'} (v
                            {titular.folder_version})
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Completitud:</span> {titular.completion_percentage}%
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Estado:</span>{' '}
                            <Badge variant={statusVariant[status] ?? 'secondary'}>
                                {statusLabels[status] ?? status}
                            </Badge>
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Cuenta:</span>{' '}
                            {titular.is_active ? 'Activo' : 'Inactivo'}
                        </p>
                        {titular.last_access && (
                            <p className="text-sm text-muted-foreground">
                                Último acceso: {new Date(titular.last_access).toLocaleString()}
                            </p>
                        )}
                        {titular.creator && (
                            <p className="text-sm text-muted-foreground">
                                Creado por: {titular.creator.name}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Aportes del titular</CardTitle>
                        <CardDescription>
                            Aportes registrados por el titular. Gestione cada uno en esta misma página.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!aportes || aportes.length === 0 ? (
                            <div className="flex flex-col items-start gap-3">
                                <p className="text-sm text-muted-foreground">Este titular aún no tiene aportes registrados.</p>
                                <Button type="button" variant="outline" size="sm" onClick={() => setAddAporteOpen(true)}>
                                    <Plus className="mr-2 size-4" />
                                    Agregar aporte
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="overflow-x-auto rounded-md border">
                                    <table className="w-full min-w-[800px] text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="p-3 text-left font-medium">Fecha consignación</th>
                                                <th className="p-3 text-left font-medium">Nro. recibo</th>
                                                <th className="p-3 text-left font-medium">Valor recibo</th>
                                                <th className="p-3 text-left font-medium">Programa o campaña</th>
                                                <th className="p-3 text-left font-medium">Verific. antecedentes</th>
                                                <th className="p-3 text-left font-medium">Observaciones</th>
                                                <th className="p-3 text-left font-medium">Estado</th>
                                                <th className="p-3 text-right font-medium">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aportes.map((aporte) => (
                                                <tr key={aporte.id} className="border-b last:border-0">
                                                    <td className="p-3 text-muted-foreground">
                                                        {aporte.fecha_consignacion
                                                            ? new Date(aporte.fecha_consignacion).toLocaleDateString()
                                                            : '—'}
                                                    </td>
                                                    <td className="p-3">{aporte.nro_recibo ?? '—'}</td>
                                                    <td className="p-3">{aporte.valor}</td>
                                                    <td className="p-3">{aporte.plan?.nombre ?? '—'}</td>
                                                    <td className="p-3 max-w-[120px] truncate" title={aporte.verific_antecedentes ?? ''}>
                                                        {aporte.verific_antecedentes ?? '—'}
                                                    </td>
                                                    <td className="p-3 max-w-[160px] truncate" title={aporte.observaciones ?? ''}>
                                                        {aporte.observaciones ?? '—'}
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge
                                                            variant={
                                                                aporte.estado === 'aprobado'
                                                                    ? 'default'
                                                                    : aporte.estado === 'rechazado'
                                                                      ? 'destructive'
                                                                      : 'secondary'
                                                            }
                                                        >
                                                            {aporteEstadoLabels[aporte.estado] ?? aporte.estado}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setGestionarAporte(aporte);
                                                                gestionarForm.setData({
                                                                    plan_id: aporte.plan?.id ?? '',
                                                                    estado: (aporte.estado === 'aprobado' || aporte.estado === 'rechazado' ? aporte.estado : 'aprobado') as 'aprobado' | 'rechazado',
                                                                    verific_antecedentes: aporte.verific_antecedentes ?? '',
                                                                    observaciones: aporte.observaciones ?? '',
                                                                });
                                                            }}
                                                        >
                                                            <FileText className="mr-1 size-4" />
                                                            Ver / Gestionar
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => setAddAporteOpen(true)}>
                                    <Plus className="mr-2 size-4" />
                                    Agregar aporte
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {sections.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos de la carpeta</CardTitle>
                            <CardDescription>
                                Información diligenciada por el titular en su carpeta privada
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {sections.map((section, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h3 className="text-sm font-semibold border-b pb-2">{section.name}</h3>
                                    <dl className="grid gap-2 sm:grid-cols-2">
                                        {section.fields
                                            .filter((f) => f.type !== 'section')
                                            .map((field, fieldIdx) => {
                                                const key = field.field_name ?? `field-${fieldIdx}`;
                                                const value = data[key];
                                                const isEmpty = value === undefined || value === null || value === '';
                                                return (
                                                    <div key={key} className="space-y-0.5">
                                                        <dt className="text-xs font-medium text-muted-foreground">
                                                            {field.label}
                                                        </dt>
                                                        <dd className="text-sm">
                                                            {field.type === 'file' && value ? (
                                                                <a
                                                                    href={fileDownloadUrl(titular.id, String(value))}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary underline"
                                                                >
                                                                    Ver archivo
                                                                </a>
                                                            ) : isEmpty ? (
                                                                <span className="text-muted-foreground">—</span>
                                                            ) : (
                                                                String(value)
                                                            )}
                                                        </dd>
                                                    </div>
                                                );
                                            })}
                                    </dl>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modal: Gestionar aporte */}
            <Dialog open={!!gestionarAporte} onOpenChange={(open) => !open && setGestionarAporte(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Aporte {gestionarAporte ? `#${gestionarAporte.id}` : ''}</DialogTitle>
                        <DialogDescription>Detalle y aprobación del aporte</DialogDescription>
                    </DialogHeader>
                    {gestionarAporte && (
                        <div className="space-y-4">
                            <div className="space-y-2 text-sm">
                                {gestionarAporte.fecha_consignacion && (
                                    <p>
                                        <span className="font-medium text-muted-foreground">Fecha consignación:</span>{' '}
                                        {new Date(gestionarAporte.fecha_consignacion).toLocaleDateString()}
                                    </p>
                                )}
                                {gestionarAporte.nro_recibo && (
                                    <p>
                                        <span className="font-medium text-muted-foreground">Nro. recibo:</span>{' '}
                                        {gestionarAporte.nro_recibo}
                                    </p>
                                )}
                                <p>
                                    <span className="font-medium text-muted-foreground">Valor recibo:</span>{' '}
                                    {gestionarAporte.valor}
                                </p>
                                {gestionarAporte.plan && (
                                    <p>
                                        <span className="font-medium text-muted-foreground">Programa o campaña:</span>{' '}
                                        {gestionarAporte.plan.nombre}
                                    </p>
                                )}
                                {gestionarAporte.verific_antecedentes && (
                                    <p>
                                        <span className="font-medium text-muted-foreground">Verific. antecedentes:</span>{' '}
                                        {gestionarAporte.verific_antecedentes}
                                    </p>
                                )}
                                {gestionarAporte.observaciones && (
                                    <p>
                                        <span className="font-medium text-muted-foreground">Observaciones:</span>{' '}
                                        {gestionarAporte.observaciones}
                                    </p>
                                )}
                                <p>
                                    <span className="font-medium text-muted-foreground">Estado:</span>{' '}
                                    <Badge
                                        variant={
                                            gestionarAporte.estado === 'aprobado'
                                                ? 'default'
                                                : gestionarAporte.estado === 'rechazado'
                                                  ? 'destructive'
                                                  : 'secondary'
                                        }
                                    >
                                        {aporteEstadoLabels[gestionarAporte.estado] ?? gestionarAporte.estado}
                                    </Badge>
                                </p>
                                {gestionarAporte.approved_at && gestionarAporte.approved_by_user && (
                                    <p className="text-muted-foreground">
                                        Aprobado por {gestionarAporte.approved_by_user.name} el{' '}
                                        {new Date(gestionarAporte.approved_at).toLocaleString()}
                                    </p>
                                )}
                                <p className="text-muted-foreground">
                                    Registrado: {new Date(gestionarAporte.created_at).toLocaleString()}
                                </p>
                                {gestionarAporte.soporte_path && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={`/aportes/${gestionarAporte.id}/soporte`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Download className="mr-2 size-4" />
                                            Ver soporte
                                        </a>
                                    </Button>
                                )}
                            </div>
                            {gestionarAporte.estado === 'pendiente' && plans.length > 0 && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        gestionarForm.put(
                                            `/titulares/${titular.id}/aportes/${gestionarAporte.id}`,
                                            { onSuccess: () => setGestionarAporte(null) },
                                        );
                                    }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label>Plan (obligatorio si aprueba)</Label>
                                        <Select
                                            value={gestionarForm.data.plan_id ? String(gestionarForm.data.plan_id) : 'all'}
                                            onValueChange={(v) =>
                                                gestionarForm.setData('plan_id', v === 'all' ? '' : Number(v))
                                            }
                                            required={gestionarForm.data.estado === 'aprobado'}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un plan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {plans.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.nombre} (valor: {p.valor_ingreso}
                                                        {p.fecha_cierre ? `, cierre: ${p.fecha_cierre}` : ''})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={gestionarForm.errors.plan_id} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Acción</Label>
                                        <Select
                                            value={gestionarForm.data.estado}
                                            onValueChange={(v) =>
                                                gestionarForm.setData('estado', v as 'aprobado' | 'rechazado')
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="aprobado">Aprobado</SelectItem>
                                                <SelectItem value="rechazado">Rechazado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={gestionarForm.errors.estado} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gestionar-verific">Verific. antecedentes</Label>
                                        <Input
                                            id="gestionar-verific"
                                            value={gestionarForm.data.verific_antecedentes}
                                            onChange={(e) =>
                                                gestionarForm.setData('verific_antecedentes', e.target.value)
                                            }
                                            placeholder="Ej: Sí / No"
                                        />
                                        <InputError message={gestionarForm.errors.verific_antecedentes} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gestionar-observ">Observaciones</Label>
                                        <textarea
                                            id="gestionar-observ"
                                            value={gestionarForm.data.observaciones}
                                            onChange={(e) => gestionarForm.setData('observaciones', e.target.value)}
                                            placeholder="Observaciones del aporte"
                                            className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                            rows={3}
                                        />
                                        <InputError message={gestionarForm.errors.observaciones} />
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setGestionarAporte(null)}
                                        >
                                            Cerrar
                                        </Button>
                                        <Button type="submit" disabled={gestionarForm.processing}>
                                            Guardar
                                        </Button>
                                    </DialogFooter>
                                </form>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal: Agregar aporte */}
            <Dialog open={addAporteOpen} onOpenChange={setAddAporteOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Agregar aporte</DialogTitle>
                        <DialogDescription>
                            Registre un nuevo aporte para este titular. El soporte es opcional.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            addAporteForm.post(`/titulares/${titular.id}/aportes`, {
                                forceFormData: true,
                                onSuccess: () => {
                                    setAddAporteOpen(false);
                                    addAporteForm.reset();
                                },
                            });
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="aporte-fecha">Fecha consignación</Label>
                            <Input
                                id="aporte-fecha"
                                type="date"
                                value={addAporteForm.data.fecha_consignacion}
                                onChange={(e) => addAporteForm.setData('fecha_consignacion', e.target.value)}
                            />
                            <InputError message={addAporteForm.errors.fecha_consignacion} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="aporte-nro">Nro. recibo</Label>
                            <Input
                                id="aporte-nro"
                                value={addAporteForm.data.nro_recibo}
                                onChange={(e) => addAporteForm.setData('nro_recibo', e.target.value)}
                                placeholder="Número de recibo"
                            />
                            <InputError message={addAporteForm.errors.nro_recibo} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="aporte-valor">Valor recibo (obligatorio)</Label>
                            <Input
                                id="aporte-valor"
                                type="number"
                                step="0.01"
                                min={0}
                                value={addAporteForm.data.valor}
                                onChange={(e) => addAporteForm.setData('valor', e.target.value)}
                                required
                            />
                            <InputError message={addAporteForm.errors.valor} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="aporte-plan">Programa o campaña (plan)</Label>
                            <Select
                                value={addAporteForm.data.plan_id ? String(addAporteForm.data.plan_id) : 'all'}
                                onValueChange={(v) =>
                                    addAporteForm.setData('plan_id', v === 'all' ? '' : Number(v))
                                }
                            >
                                <SelectTrigger id="aporte-plan">
                                    <SelectValue placeholder="Seleccione un plan (opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={addAporteForm.errors.plan_id} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="aporte-verific">Verific. antecedentes</Label>
                            <Input
                                id="aporte-verific"
                                value={addAporteForm.data.verific_antecedentes}
                                onChange={(e) =>
                                    addAporteForm.setData('verific_antecedentes', e.target.value)
                                }
                                placeholder="Ej: Sí / No"
                            />
                            <InputError message={addAporteForm.errors.verific_antecedentes} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="aporte-observ">Observaciones</Label>
                            <textarea
                                id="aporte-observ"
                                value={addAporteForm.data.observaciones}
                                onChange={(e) => addAporteForm.setData('observaciones', e.target.value)}
                                placeholder="Observaciones"
                                className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                rows={3}
                            />
                            <InputError message={addAporteForm.errors.observaciones} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="aporte-soporte">Soporte (opcional, PDF o imagen)</Label>
                            <input
                                id="aporte-soporte"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) =>
                                    addAporteForm.setData('soporte', e.target.files?.[0] ?? null)
                                }
                                className="flex w-full text-sm file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
                            />
                            <InputError message={addAporteForm.errors.soporte} />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAddAporteOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={addAporteForm.processing}>
                                Agregar aporte
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Floating notes button and panel */}
            <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
                <SheetTrigger asChild>
                    <Button
                        size="icon"
                        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
                        aria-label="Ver notas y comentarios"
                    >
                        <MessageSquare className="size-6" />
                        {notes.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                {notes.length}
                            </span>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Notas y comentarios</SheetTitle>
                        <SheetDescription>
                            Comentarios sobre documentos del titular. Al marcar como devuelto, el titular verá que debe
                            atender observaciones.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 space-y-4 overflow-y-auto px-1">
                        {notes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aún no hay notas. Agregue la primera abajo.</p>
                        ) : (
                            <ul className="space-y-3">
                                {notes.map((note) => (
                                    <li
                                        key={note.id}
                                        className="rounded-lg border bg-muted/40 p-3 text-sm"
                                    >
                                        <p className="whitespace-pre-wrap">{note.body}</p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {note.author.name} · {new Date(note.created_at).toLocaleString()}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <form onSubmit={handleAddNote} className="space-y-3 border-t pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="note-body">Nueva nota</Label>
                                <textarea
                                    id="note-body"
                                    value={noteForm.data.body}
                                    onChange={(e) => noteForm.setData('body', e.target.value)}
                                    placeholder="Ej: El correo no es válido. Falta subir el documento de identidad."
                                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    rows={3}
                                    required
                                />
                                {noteForm.errors.body && (
                                    <p className="text-xs text-destructive">{noteForm.errors.body}</p>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="mark_returned"
                                    checked={noteForm.data.mark_as_returned}
                                    onCheckedChange={(checked) =>
                                        noteForm.setData('mark_as_returned', Boolean(checked))
                                    }
                                />
                                <Label htmlFor="mark_returned" className="text-sm font-normal">
                                    Marcar titular como devuelto (debe atender observaciones)
                                </Label>
                            </div>
                            <Button type="submit" disabled={noteForm.processing} className="w-full">
                                <Send className="mr-2 size-4" />
                                Agregar nota
                            </Button>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
