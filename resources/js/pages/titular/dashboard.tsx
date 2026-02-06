import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { DynamicFormField, type FieldDef } from '@/components/dynamic-form-field';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type ConsentRequired = { id: number; title: string; content: string; version: string };
type ConsentAccepted = { consent_id: number; version?: string };

type FolderSection = { name: string; order: number; fields: FieldDef[] };

type Note = {
    id: number;
    body: string;
    created_at: string | null;
    completed_at: string | null;
    author: { id: number; name: string };
};

type Props = {
    titular: { id: number; nombre: string; data: Record<string, unknown>; completion_percentage: number; folder_version: string };
    folder: { id: number; name: string; version: string; sections: FolderSection[] };
    project: { id: number; title: string };
    consentsRequired: ConsentRequired[];
    consentsAccepted: ConsentAccepted[];
    notes?: Note[];
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
    notes = [],
}: Props) {
    const { updateAppearance } = useAppearance();
    useEffect(() => {
        updateAppearance('light');
    }, [updateAppearance]);

    const [notesOpen, setNotesOpen] = useState(false);
    const [notesState, setNotesState] = useState<Note[]>(notes);
    const [completionPercentage, setCompletionPercentage] = useState(titular.completion_percentage);
    const [completingNoteId, setCompletingNoteId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Record<string, string | number>>(() => ({
        ...(titular.data as Record<string, string | number>),
    }));
    const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
    const [saveErrors, setSaveErrors] = useState<Record<string, string[]>>({});
    const [consentChecked, setConsentChecked] = useState<Record<number, boolean>>({});
    const [consentSubmitting, setConsentSubmitting] = useState(false);

    useEffect(() => {
        setNotesState(notes);
    }, [notes]);
    useEffect(() => {
        setCompletionPercentage(titular.completion_percentage);
    }, [titular.completion_percentage]);

    const mustAcceptConsents = consentsRequired.length > 0 && !allConsentsAccepted(consentsRequired, consentsAccepted);

    const sections = folder.sections ?? [{ name: 'Datos', order: 0, fields: [] }];

    const handleCompleteNote = useCallback(async (noteId: number) => {
        setCompletingNoteId(noteId);
        try {
            const res = await fetch(`/titular/notes/${noteId}/complete`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setNotesState((prev) =>
                    prev.map((n) =>
                        n.id === noteId ? { ...n, completed_at: data.completed_at ?? null } : n,
                    ),
                );
            }
        } finally {
            setCompletingNoteId(null);
        }
    }, []);

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
            if (typeof data.completion_percentage === 'number') {
                setCompletionPercentage(data.completion_percentage);
            }
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
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{completionPercentage}% completado</p>
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

            {/* Notas del administrador: icono flotante */}
            <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
                <SheetTrigger asChild>
                    <Button
                        size="icon"
                        variant="default"
                        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
                        aria-label="Ver observaciones del administrador"
                    >
                        <MessageSquare className="size-6" />
                        {notesState.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                                {notesState.length}
                            </span>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Observaciones del administrador</SheetTitle>
                        <SheetDescription>
                            Comentarios o correcciones sobre sus documentos. Revise y actualice su información según se indique.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-1 py-4">
                        {notesState.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay observaciones por ahora.</p>
                        ) : (
                            <ul className="space-y-3">
                                {notesState.map((note) => (
                                    <li
                                        key={note.id}
                                        className={`rounded-lg border p-3 text-sm ${note.completed_at ? 'bg-muted/30 opacity-90' : 'bg-muted/40'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex shrink-0 items-center pt-0.5">
                                                <Checkbox
                                                    id={`note-${note.id}`}
                                                    checked={Boolean(note.completed_at)}
                                                    disabled={completingNoteId === note.id}
                                                    onCheckedChange={() => handleCompleteNote(note.id)}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <Label
                                                    htmlFor={`note-${note.id}`}
                                                    className="cursor-pointer text-xs font-normal text-muted-foreground"
                                                >
                                                    Marcar como atendida
                                                </Label>
                                                <p className={`mt-1 whitespace-pre-wrap ${note.completed_at ? 'line-through text-muted-foreground' : ''}`}>
                                                    {note.body}
                                                </p>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    {note.author.name} · {note.created_at ? new Date(note.created_at).toLocaleString() : ''}
                                                    {note.completed_at != null ? (
                                                        <> · Atendida {new Date(note.completed_at).toLocaleString()}</>
                                                    ) : null}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
