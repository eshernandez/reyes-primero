import { Head, Link, useForm } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

export default function TitularAporteCreate() {
    const form = useForm({
        valor: '',
        soporte: null as File | null,
    });

    return (
        <div className="min-h-svh bg-background">
            <Head title="Nuevo aporte" />
            <header className="border-b bg-card">
                <div className="flex h-14 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2 font-medium">
                        <AppLogoIcon className="size-11 object-contain" />
                        <span>Reyes Primero</span>
                    </Link>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/titular/aportes">Mis aportes</Link>
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-xl p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Registrar aporte</CardTitle>
                        <CardDescription>
                            Indique el valor del aporte y adjunte el soporte (PDF o imagen). El
                            administrador revisará y aprobará los datos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post('/titular/aportes');
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="valor">Valor del aporte *</Label>
                                <Input
                                    id="valor"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.data.valor}
                                    onChange={(e) => form.setData('valor', e.target.value)}
                                    required
                                />
                                <InputError message={form.errors.valor} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="soporte">Soporte (PDF o imagen) *</Label>
                                <Input
                                    id="soporte"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        form.setData('soporte', file ?? null);
                                    }}
                                    required
                                />
                                <InputError message={form.errors.soporte} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    Enviar aporte
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/titular/aportes">Cancelar</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
