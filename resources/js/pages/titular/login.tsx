import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { useAppearance } from '@/hooks/use-appearance';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function TitularLogin() {
    const { updateAppearance } = useAppearance();
    useEffect(() => {
        updateAppearance('light');
    }, [updateAppearance]);

    const form = useForm({ access_code: '' });

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <Head title="Acceso Titular - Reyes Primero" />
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href="/"
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
                            </div>
                        </Link>
                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">Reyes Primero</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                Ingrese el código de 6 dígitos que le fue proporcionado
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post('/titular/login');
                        }}
                        className="flex flex-col gap-6"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="access_code">Código de acceso</Label>
                            <Input
                                id="access_code"
                                type="text"
                                value={form.data.access_code}
                                onChange={(e) => form.setData('access_code', e.target.value)}
                                required
                                maxLength={6}
                                minLength={6}
                                autoComplete="one-time-code"
                                placeholder="000000"
                                className="text-center text-lg tracking-[0.5em]"
                            />
                            <InputError message={form.errors.access_code} />
                        </div>
                        <Button type="submit" className="w-full" disabled={form.processing}>
                            {form.processing ? <Spinner className="size-4" /> : 'Acceder'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
