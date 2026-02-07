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

export type FieldDef = {
    field_name?: string;
    label: string;
    type: string;
    required?: boolean;
    filled_by_admin?: boolean;
    editable_by_both?: boolean;
    visible_only_for_admin?: boolean;
    options?: string[];
    help_text?: string | null;
    order?: number;
};

type Props = {
    field: FieldDef;
    value: string | number | undefined;
    onChange: (value: string | number | File | null) => void;
    error?: string;
    disabled?: boolean;
    /** Leyenda cuando el campo es solo lectura (ej. "Campo no editable. Lo diligencia el administrador.") */
    readOnlyLegend?: string;
    /** URL para enlace "Ver archivo" en campos tipo file (ej. admin: /titulares/:id/file?path=...) */
    fileDownloadUrl?: (path: string) => string;
};

type FileFieldProps = {
    field: FieldDef;
    value: string | undefined;
    onChange: (value: string | File | null) => void;
    error?: string;
    disabled?: boolean;
    readOnlyLegend?: string;
    fileDownloadUrl?: (path: string) => string;
};

function normalizeValue(v: string | number | undefined): string {
    if (v === undefined || v === null) return '';
    return String(v);
}

function FileFormField({ field, value, onChange, error, disabled = false, readOnlyLegend, fileDownloadUrl }: FileFieldProps) {
    const id = `field-${field.field_name}`;
    const currentPath = value ?? '';
    const href = currentPath && fileDownloadUrl ? fileDownloadUrl(currentPath) : null;

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <div className="flex flex-col gap-2">
                <Input
                    id={id}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        onChange(file ?? null);
                    }}
                    required={field.required && !currentPath}
                    disabled={disabled}
                    className="cursor-pointer"
                />
                {href && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Archivo actual:</span>
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                        >
                            Ver archivo
                        </a>
                    </div>
                )}
            </div>
            {field.help_text && (
                <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            <InputError message={error} />
            {readOnlyLegend && (
                <p className="text-xs text-muted-foreground italic">{readOnlyLegend}</p>
            )}
        </div>
    );
}

export function DynamicFormField({
    field,
    value,
    onChange,
    error,
    disabled = false,
    readOnlyLegend,
    fileDownloadUrl,
}: Props) {
    const id = `field-${field.field_name ?? 'section'}`;
    const displayValue = normalizeValue(value);

    if (field.type === 'section') {
        return (
            <div className="rounded-lg border bg-muted/40 px-4 py-3">
                <h4 className="text-base font-semibold">{field.label}</h4>
            </div>
        );
    }

    if (field.type === 'textarea') {
        return (
            <div className="space-y-2">
                <Label htmlFor={id}>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                </Label>
                <textarea
                    id={id}
                    value={displayValue}
                    onChange={(e) => onChange(e.target.value)}
                    required={field.required}
                    disabled={disabled}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                />
                {field.help_text && (
                    <p className="text-xs text-muted-foreground">{field.help_text}</p>
                )}
                <InputError message={error} />
                {readOnlyLegend && (
                    <p className="text-xs text-muted-foreground italic">{readOnlyLegend}</p>
                )}
            </div>
        );
    }

    if (field.type === 'select' && field.options?.length) {
        return (
            <div className="space-y-2">
                <Label htmlFor={id}>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                </Label>
                <Select
                    value={displayValue}
                    onValueChange={(v) => onChange(v)}
                    required={field.required}
                    disabled={disabled}
                >
                    <SelectTrigger id={id}>
                        <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {field.help_text && (
                    <p className="text-xs text-muted-foreground">{field.help_text}</p>
                )}
                <InputError message={error} />
                {readOnlyLegend && (
                    <p className="text-xs text-muted-foreground italic">{readOnlyLegend}</p>
                )}
            </div>
        );
    }

    if (field.type === 'number') {
        return (
            <div className="space-y-2">
                <Label htmlFor={id}>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                </Label>
                <Input
                    id={id}
                    type="number"
                    step="any"
                    value={displayValue}
                    onChange={(e) => onChange(e.target.value)}
                    required={field.required}
                    disabled={disabled}
                />
                {field.help_text && (
                    <p className="text-xs text-muted-foreground">{field.help_text}</p>
                )}
                <InputError message={error} />
                {readOnlyLegend && (
                    <p className="text-xs text-muted-foreground italic">{readOnlyLegend}</p>
                )}
            </div>
        );
    }

    if (field.type === 'date' || field.type === 'datetime') {
        return (
            <div className="space-y-2">
                <Label htmlFor={id}>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                </Label>
                <Input
                    id={id}
                    type={field.type === 'datetime' ? 'datetime-local' : 'date'}
                    value={displayValue}
                    onChange={(e) => onChange(e.target.value)}
                    required={field.required}
                    disabled={disabled}
                />
                {field.help_text && (
                    <p className="text-xs text-muted-foreground">{field.help_text}</p>
                )}
                <InputError message={error} />
                {readOnlyLegend && (
                    <p className="text-xs text-muted-foreground italic">{readOnlyLegend}</p>
                )}
            </div>
        );
    }

    if (field.type === 'file') {
        return (
            <FileFormField
                field={field}
                value={typeof value === 'string' ? value : undefined}
                onChange={onChange}
                error={error}
                disabled={disabled}
                readOnlyLegend={readOnlyLegend}
                fileDownloadUrl={fileDownloadUrl ?? ((path) => `/titular/file?path=${encodeURIComponent(path)}`)}
            />
        );
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Input
                id={id}
                type={field.type === 'email' ? 'email' : 'text'}
                value={displayValue}
                onChange={(e) => onChange(e.target.value)}
                required={field.required}
                disabled={disabled}
            />
            {field.help_text && (
                <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            <InputError message={error} />
            {readOnlyLegend && (
                <p className="text-xs text-muted-foreground italic">{readOnlyLegend}</p>
            )}
        </div>
    );
}
