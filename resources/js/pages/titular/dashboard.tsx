import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { useAppearance } from '@/hooks/use-appearance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DynamicFormField, type FieldDef } from '@/components/dynamic-form-field';
import { Spinner } from '@/components/ui/spinner';

type ConsentRequired = { id: number; title: string; content: string; version: string };
type ConsentAccepted = { consent_id: number; version?: string };

type FolderSection = { name: string; order: number; fields: FieldDef[] };

type Props = {
    titular: { id: number; nombre: string; data: Record<string, unknown>; completion_percentage: number; folder_version: string };
    folder: { id: number; name: string; version: string; sections: FolderSection[] };
    project: { id: number; title: string };
    consentsRequired: ConsentRequired[];
    consentsAccepted: ConsentAccepted[];
};

function allConsentsAccepted(required: ConsentRequired[], accepted: ConsentAccepted[]): boolean {
    if (required.length === 0) return true;
    const acceptedIds = new Set(accepted.map((a) => a.consent_id));
    return required.every((c) => acceptedIds.has(c.id));
}

export default function TitularDashboard({
    titular,
    folder,
    project,
    consentsRequired,
    consentsAccepted,
}: Props) {
    const { updateAppearance } = useAppearance();
    useEffect(() => {
        updateAppearance('light');
    }, [updateAppearance]);

    const [formData, setFormData] = useState<Record<string, string | number>>(() => ({
        ...(titular.data as Record<string, string | number>),
    }));
    const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
    const [saveErrors, setSaveErrors] = useState<Record<string, string[]>>({});
    const [consentChecked, setConsentChecked] = useState<Record<number, boolean>>({});
    const [consentSubmitting, setConsentSubmitting] = useState(false);

    const mustAcceptConsents = consentsRequired.length > 0 && !allConsentsAccepted(consentsRequired, consentsAccepted);

    const sections = folder.sections ?? [{ name: 'Datos', order: 0, fields: [] }];

    const getCsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const handleSave = useCallback(async () => {
        setSaveStatus('saving');
        setSaveErrors({});
        try {
            const hasFiles = Object.keys(pendingFiles).length > 0;
            let res: Response;
            if (hasFiles) {
                const formDataToSend = new FormData();
                formDataToSend.append('_method', 'PUT');
                formDataToSend.append('data', JSON.stringify(formData));
                for (const [key, file] of Object.entries(pendingFiles)) {
                    formDataToSend.append(key, file);
                }
                res = await fetch('/titular/data', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': getCsrfToken(),
                    },
                    credentials: 'include',
                    body: formDataToSend,
                });
            } else {
                res = await fetch('/titular/data', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': getCsrfToken(),
                    },
                    credentials: 'include',
                    body: JSON.stringify({ data: formData }),
                });
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setSaveStatus('error');
                setSaveErrors(data.errors ?? {});
                return;
            }
            setSaveStatus('ok');
            setPendingFiles({});
            router.reload({ only: ['titular'] });
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
            setSaveStatus('error');
        }
    }, [formData, pendingFiles]);

    const handleAcceptConsents = useCallback(async () => {
        const toAccept = consentsRequired.filter((c) => consentChecked[c.id]);
        if (toAccept.length === 0) return;
        setConsentSubmitting(true);
        try {
            const res = await fetch('/titular/consents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify({
                    consents: toAccept.map((c) => ({ consent_id: c.id, version: c.version })),
                }),
            });
            if (res.ok) router.reload();
        } finally {
            setConsentSubmitting(false);
        }
    }, [consentsRequired, consentChecked]);

    const canAcceptConsents = consentsRequired.every((c) => consentChecked[c.id]);

    return (
        <div className="min-h-svh bg-background">
            <Head title={`Mi Carpeta - ${titular.nombre}`} />
            <header className="border-b bg-card">
                <div className="flex h-14 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2 font-medium">
                        <AppLogoIcon className="size-8 fill-current text-[var(--foreground)]" />
                        <span>Reyes Primero</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Bienvenido, {titular.nombre}</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => router.post('/titular/logout')}>
                            Cerrar sesión
                        </Button>
                    </div>
                </div>
            </header>

            <Dialog open={mustAcceptConsents} onOpenChange={() => {}}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Consentimientos informados</DialogTitle>
                        <DialogDescription>
                            Debe leer y aceptar los siguientes consentimientos para continuar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {consentsRequired.map((consent) => (
                            <div key={consent.id} className="space-y-2 rounded-lg border p-4">
                                <h4 className="font-medium">{consent.title}</h4>
                                <div
                                    className="prose prose-sm max-h-48 overflow-y-auto text-sm dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: consent.content }}
                                />
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={consentChecked[consent.id] ?? false}
                                        onChange={(e) =>
                                            setConsentChecked((prev) => ({ ...prev, [consent.id]: e.target.checked }))
                                        }
                                    />
                                    <span className="text-sm">He leído y acepto este consentimiento</span>
                                </label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAcceptConsents} disabled={!canAcceptConsents || consentSubmitting}>
                            {consentSubmitting ? <Spinner className="size-4" /> : 'Aceptar todos y continuar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <main className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-semibold">Mi Carpeta Personal</h1>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Proyecto</CardTitle>
                        <CardDescription>{project.title}</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Completitud</CardTitle>
                        <CardDescription>Carpeta: {folder.name} (v{folder.version})</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${titular.completion_percentage}%` }}
                            />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{titular.completion_percentage}% completado</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Datos</CardTitle>
                        <CardDescription>Complete los campos según se indica</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {sections.map((section, idx) => (
                            <Card key={idx} className="border-2">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{section.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {[...section.fields]
                                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                        .map((field, fieldIdx) => (
                                            <DynamicFormField
                                                key={field.field_name ?? `section-${idx}-${fieldIdx}`}
                                                field={field}
                                                value={field.type === 'section' ? undefined : formData[field.field_name as string]}
                                                onChange={(v) => {
                                                    if (field.type === 'section') return;
                                                    if (v instanceof File) {
                                                        setPendingFiles((prev) => ({ ...prev, [field.field_name as string]: v }));
                                                    } else if (v === null) {
                                                        setPendingFiles((prev) => {
                                                            const next = { ...prev };
                                                            delete next[field.field_name as string];
                                                            return next;
                                                        });
                                                    } else {
                                                        setFormData((prev) => ({ ...prev, [field.field_name as string]: v }));
                                                    }
                                                }}
                                                error={field.type === 'section' ? undefined : saveErrors[field.field_name as string]?.[0]}
                                            />
                                        ))}
                                </CardContent>
                            </Card>
                        ))}
                        <div className="flex items-center gap-4 pt-4">
                            <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
                                {saveStatus === 'saving' ? <Spinner className="size-4" /> : 'Guardar cambios'}
                            </Button>
                            {saveStatus === 'ok' && (
                                <span className="text-sm text-green-600">Guardado correctamente</span>
                            )}
                            {saveStatus === 'error' && (
                                <span className="text-sm text-destructive">Error al guardar. Revise los campos.</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
