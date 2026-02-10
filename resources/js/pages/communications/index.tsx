import { Head, router, useForm } from '@inertiajs/react';
import { Eye, Mail, RefreshCw, Send } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, type PaginationLink } from '@/components/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { dashboard } from '@/routes';
import { index as titularesIndex } from '@/routes/titulares';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';

type Communication = {
    id: number;
    type: string;
    to_email: string;
    subject: string;
    body?: string | null;
    status: string;
    sent_at: string | null;
    error_message: string | null;
    created_at: string;
    user: { id: number; name: string } | null;
    titular: { id: number; nombre: string } | null;
};

type Props = {
    communications: { data: Communication[]; links: PaginationLink[]; current_page: number; last_page: number };
    communicationDetail: Communication | null;
    filters: { type?: string; status?: string; search?: string };
    typeLabels: Record<string, string>;
    statusLabels: Record<string, string>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Titulares', href: titularesIndex().url },
    { title: 'Comunicaciones', href: '#' },
];

export default function CommunicationsIndex({
    communications,
    communicationDetail,
    filters,
    typeLabels,
    statusLabels,
}: Props) {
    const [resending, setResending] = useState(false);
    const form = useForm({
        to_email: '',
        subject: '',
        body: '',
    });

    const applyFilters = (newFilters: Record<string, string | undefined>) => {
        router.get('/communications', newFilters, { preserveState: true });
    };

    const openDetail = (id: number) => {
        router.get('/communications', { ...filters, communication_id: id }, { preserveState: true });
    };

    const closeDetail = () => {
        router.get('/communications', filters, { preserveState: true });
    };

    const handleResend = (id: number) => {
        setResending(true);
        router.post(`/communications/${id}/resend`, {}, {
            preserveScroll: true,
            onFinish: () => setResending(false),
            onSuccess: () => closeDetail(),
        });
    };

    const handleSendCustom = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/communications', { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        pending: 'secondary',
        sent: 'default',
        failed: 'destructive',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comunicaciones" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <h1 className="text-2xl font-semibold">Comunicaciones</h1>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="size-5" />
                            Enviar comunicación
                        </CardTitle>
                        <CardDescription>
                            Envíe un correo a cualquier destinatario. No está ligado a un titular.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSendCustom} className="space-y-4 max-w-xl">
                            <div>
                                <Label htmlFor="to_email">Correo destinatario</Label>
                                <Input
                                    id="to_email"
                                    type="email"
                                    value={form.data.to_email}
                                    onChange={(e) => form.setData('to_email', e.target.value)}
                                    className="mt-1"
                                    placeholder="correo@ejemplo.com"
                                />
                                <InputError message={form.errors.to_email} />
                            </div>
                            <div>
                                <Label htmlFor="subject">Asunto</Label>
                                <Input
                                    id="subject"
                                    value={form.data.subject}
                                    onChange={(e) => form.setData('subject', e.target.value)}
                                    className="mt-1"
                                    placeholder="Asunto del mensaje"
                                />
                                <InputError message={form.errors.subject} />
                            </div>
                            <div>
                                <Label htmlFor="body">Mensaje</Label>
                                <textarea
                                    id="body"
                                    rows={4}
                                    value={form.data.body}
                                    onChange={(e) => form.setData('body', e.target.value)}
                                    className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[200px]"
                                    placeholder="Escriba el contenido del correo..."
                                />
                                <InputError message={form.errors.body} />
                            </div>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Enviando…' : 'Enviar correo'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="size-5" />
                            Historial de comunicaciones
                        </CardTitle>
                        <CardDescription>
                            Invitaciones a carpeta y comunicaciones enviadas. Estado de cada envío.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Input
                                placeholder="Buscar por correo o asunto..."
                                value={filters.search ?? ''}
                                onChange={(e) =>
                                    applyFilters({ ...filters, search: e.target.value || undefined })
                                }
                                className="max-w-[240px]"
                            />
                            <Select
                                value={filters.type ?? 'all'}
                                onValueChange={(v) =>
                                    applyFilters({ ...filters, type: v === 'all' ? undefined : v })
                                }
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los tipos</SelectItem>
                                    {Object.entries(typeLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.status ?? 'all'}
                                onValueChange={(v) =>
                                    applyFilters({ ...filters, status: v === 'all' ? undefined : v })
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    {Object.entries(statusLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm min-w-[750px]">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="p-3 text-left font-medium">Tipo</th>
                                        <th className="p-3 text-left font-medium">Destinatario</th>
                                        <th className="p-3 text-left font-medium">Asunto</th>
                                        <th className="p-3 text-left font-medium">Estado</th>
                                        <th className="p-3 text-left font-medium">Enviado</th>
                                        <th className="p-3 text-left font-medium">Enviado por</th>
                                        <th className="w-10 p-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {communications.data.map((c) => (
                                        <tr key={c.id} className="border-b last:border-0">
                                            <td className="p-3">{typeLabels[c.type] ?? c.type}</td>
                                            <td className="p-3">{c.to_email}</td>
                                            <td className="p-3 max-w-[200px] truncate" title={c.subject}>
                                                {c.subject}
                                            </td>
                                            <td className="p-3">
                                                <Badge variant={statusVariant[c.status] ?? 'secondary'}>
                                                    {statusLabels[c.status] ?? c.status}
                                                </Badge>
                                                {c.error_message && (
                                                    <p className="mt-1 text-xs text-destructive max-w-[200px] truncate" title={c.error_message}>
                                                        {c.error_message}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {c.sent_at ? new Date(c.sent_at).toLocaleString() : '-'}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {c.user?.name ?? '-'}
                                            </td>
                                            <td className="p-3">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openDetail(c.id)}
                                                    aria-label="Ver detalle"
                                                >
                                                    <Eye className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {communications.data.length === 0 && (
                            <p className="text-sm text-muted-foreground py-4">No hay comunicaciones.</p>
                        )}

                        {communications.last_page > 1 && (
                            <div className="flex justify-center pt-2">
                                <Pagination links={communications.links} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={!!communicationDetail} onOpenChange={(open) => !open && closeDetail()}>
                    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                        {communicationDetail && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Detalle de la comunicación</DialogTitle>
                                    <DialogDescription>
                                        Datos del mensaje y estado del envío.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="grid gap-2 text-sm">
                                        <p><span className="font-medium text-muted-foreground">Tipo:</span>{' '}{typeLabels[communicationDetail.type] ?? communicationDetail.type}</p>
                                        <p><span className="font-medium text-muted-foreground">Destinatario:</span>{' '}{communicationDetail.to_email}</p>
                                        <p><span className="font-medium text-muted-foreground">Asunto:</span>{' '}{communicationDetail.subject}</p>
                                        {communicationDetail.body != null && communicationDetail.body !== '' && (
                                            <div>
                                                <span className="font-medium text-muted-foreground">Cuerpo del mensaje:</span>
                                                <pre className="mt-1 whitespace-pre-wrap rounded border bg-muted/50 p-3 text-xs max-h-40 overflow-y-auto">{communicationDetail.body}</pre>
                                            </div>
                                        )}
                                        <p><span className="font-medium text-muted-foreground">Estado:</span>{' '}
                                            <Badge variant={statusVariant[communicationDetail.status] ?? 'secondary'}>
                                                {statusLabels[communicationDetail.status] ?? communicationDetail.status}
                                            </Badge>
                                        </p>
                                        <p><span className="font-medium text-muted-foreground">Fecha de envío:</span>{' '}
                                            {communicationDetail.sent_at ? new Date(communicationDetail.sent_at).toLocaleString() : '-'}
                                        </p>
                                        <p><span className="font-medium text-muted-foreground">Creado:</span>{' '}{new Date(communicationDetail.created_at).toLocaleString()}</p>
                                        <p><span className="font-medium text-muted-foreground">Enviado por:</span>{' '}{communicationDetail.user?.name ?? '-'}</p>
                                        {communicationDetail.titular && (
                                            <p><span className="font-medium text-muted-foreground">Titular:</span>{' '}{communicationDetail.titular.nombre}</p>
                                        )}
                                    </div>
                                    {communicationDetail.error_message && (
                                        <div className="rounded border border-destructive/50 bg-destructive/10 p-3">
                                            <p className="text-sm font-medium text-destructive">Logs / Error del envío</p>
                                            <pre className="mt-1 whitespace-pre-wrap text-xs text-destructive">{communicationDetail.error_message}</pre>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={closeDetail}>
                                        Cerrar
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => handleResend(communicationDetail.id)}
                                        disabled={resending}
                                    >
                                        <RefreshCw className={`mr-2 size-4 ${resending ? 'animate-spin' : ''}`} />
                                        {resending ? 'Reenviando…' : 'Reenviar correo'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
