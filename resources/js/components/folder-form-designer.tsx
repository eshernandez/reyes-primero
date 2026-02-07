import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const FIELD_TYPES = [
    { value: 'text', label: 'Texto' },
    { value: 'textarea', label: 'Área de texto' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Fecha' },
    { value: 'datetime', label: 'Fecha y hora' },
    { value: 'select', label: 'Lista (select)' },
    { value: 'file', label: 'Archivo' },
    { value: 'section', label: 'Título de sección (solo texto)' },
] as const;

export type DesignerField = {
    id: string;
    field_name: string;
    label: string;
    type: string;
    required: boolean;
    filled_by_admin: boolean;
    editable_by_both: boolean;
    visible_only_for_admin: boolean;
    help_text: string;
    order: number;
    options?: string[];
    validation?: string[];
};

export type DesignerSection = {
    id: string;
    name: string;
    order: number;
    fields: DesignerField[];
};

function slugFromLabel(label: string): string {
    return label
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 80) || 'campo';
}

function nextId(): string {
    return `_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Parse backend folder.fields (sections or flat fields) into designer state */
export function parseFolderFieldsToDesigner(fields: Record<string, unknown> | null): DesignerSection[] {
    if (!fields || typeof fields !== 'object') return [];
    const sections = fields.sections as Array<{ name?: string; order?: number; fields?: unknown[] }> | undefined;
    if (Array.isArray(sections) && sections.length > 0) {
        return sections.map((sec, si) => ({
            id: nextId(),
            name: String(sec.name ?? 'Sección'),
            order: Number(sec.order ?? si),
            fields: (sec.fields ?? []).map((f: Record<string, unknown>, fi: number) => ({
                id: nextId(),
                field_name: String(f.field_name ?? slugFromLabel(String(f.label ?? 'campo'))),
                label: String(f.label ?? 'Campo'),
                type: String(f.type ?? 'text'),
                required: Boolean(f.required),
                filled_by_admin: Boolean(f.filled_by_admin),
                editable_by_both: Boolean(f.editable_by_both),
                visible_only_for_admin: Boolean(f.visible_only_for_admin),
                help_text: String(f.help_text ?? ''),
                order: Number(f.order ?? fi),
                options: Array.isArray(f.options) ? f.options.map(String) : undefined,
                validation: Array.isArray(f.validation) ? f.validation.map(String) : undefined,
            })),
        }));
    }
    const flat = (fields.fields ?? fields) as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(flat) && flat.length > 0) {
        return [
            {
                id: nextId(),
                name: 'Datos',
                order: 0,
                fields: flat.map((f, i) => ({
                    id: nextId(),
                    field_name: String(f.field_name ?? slugFromLabel(String(f.label ?? 'campo'))),
                    label: String(f.label ?? 'Campo'),
                    type: String(f.type ?? 'text'),
                    required: Boolean(f.required),
                    filled_by_admin: Boolean(f.filled_by_admin),
                    editable_by_both: Boolean(f.editable_by_both),
                    visible_only_for_admin: Boolean(f.visible_only_for_admin),
                    help_text: String(f.help_text ?? ''),
                    order: Number(f.order ?? i),
                    options: Array.isArray(f.options) ? f.options.map(String) : undefined,
                    validation: Array.isArray(f.validation) ? f.validation.map(String) : undefined,
                })),
            },
        ];
    }
    return [];
}

/** Build backend fields payload from designer state */
export function buildFieldsFromDesigner(
    sections: DesignerSection[],
    version: string,
): Record<string, unknown> {
    return {
        version,
        last_modified: new Date().toISOString(),
        sections: sections.map((sec) => ({
            name: sec.name,
            order: sec.order,
            fields: sec.fields.map((f, idx) => {
                const out: Record<string, unknown> = {
                    field_name: f.type === 'section' ? `_section_${sec.order}_${idx}` : f.field_name,
                    label: f.label,
                    type: f.type,
                    required: f.required,
                    filled_by_admin: f.type === 'section' ? false : f.filled_by_admin,
                    editable_by_both: f.type === 'section' ? false : f.editable_by_both,
                    visible_only_for_admin: f.type === 'section' ? false : f.visible_only_for_admin,
                    help_text: f.help_text || null,
                    order: f.order,
                };
                if (f.type === 'select' && f.options?.length) out.options = f.options;
                if (f.type === 'file' && f.validation?.length) out.validation = f.validation;
                return out;
            }),
        })),
    };
}

type FolderFormDesignerProps = {
    sections: DesignerSection[];
    onChange: (sections: DesignerSection[]) => void;
};

export function FolderFormDesigner({ sections, onChange }: FolderFormDesignerProps) {
    const setSections = (updater: (prev: DesignerSection[]) => DesignerSection[]) => {
        onChange(updater(sections));
    };

    const addSection = () => {
        setSections((prev) => [
            ...prev,
            { id: nextId(), name: 'Nueva sección', order: prev.length, fields: [] },
        ]);
    };

    const updateSection = (sectionId: string, patch: Partial<DesignerSection>) => {
        setSections((prev) =>
            prev.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
        );
    };

    const removeSection = (sectionId: string) => {
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
    };

    const moveSection = (sectionId: string, dir: -1 | 1) => {
        setSections((prev) => {
            const i = prev.findIndex((s) => s.id === sectionId);
            if (i < 0 || (dir < 0 && i === 0) || (dir > 0 && i === prev.length - 1)) return prev;
            const j = i + dir;
            const next = [...prev];
            [next[i], next[j]] = [next[j], next[i]];
            return next.map((s, idx) => ({ ...s, order: idx }));
        });
    };

    const addField = (sectionId: string) => {
        setSections((prev) =>
            prev.map((s) => {
                if (s.id !== sectionId) return s;
                const order = s.fields.length;
                return {
                    ...s,
                    fields: [
                        ...s.fields,
                        {
                            id: nextId(),
                            field_name: `campo_${order + 1}`,
                            label: 'Nuevo campo',
                            type: 'text',
                            required: false,
                            filled_by_admin: false,
                            editable_by_both: false,
                            visible_only_for_admin: false,
                            help_text: '',
                            order,
                        },
                    ],
                };
            }),
        );
    };

    const updateField = (sectionId: string, fieldId: string, patch: Partial<DesignerField>) => {
        setSections((prev) =>
            prev.map((s) => {
                if (s.id !== sectionId) return s;
                return {
                    ...s,
                    fields: s.fields.map((f) =>
                        f.id === fieldId ? { ...f, ...patch } : f,
                    ),
                };
            }),
        );
    };

    const removeField = (sectionId: string, fieldId: string) => {
        setSections((prev) =>
            prev.map((s) => {
                if (s.id !== sectionId) return s;
                return { ...s, fields: s.fields.filter((f) => f.id !== fieldId) };
            }),
        );
    };

    const moveField = (sectionId: string, fieldId: string, dir: -1 | 1) => {
        setSections((prev) =>
            prev.map((s) => {
                if (s.id !== sectionId) return s;
                const i = s.fields.findIndex((f) => f.id === fieldId);
                if (i < 0 || (dir < 0 && i === 0) || (dir > 0 && i === s.fields.length - 1)) return s;
                const j = i + dir;
                const fields = [...s.fields];
                [fields[i], fields[j]] = [fields[j], fields[i]];
                return { ...s, fields: fields.map((f, idx) => ({ ...f, order: idx })) };
            }),
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Diseñador del formulario</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                    <Plus className="mr-2 size-4" />
                    Añadir sección
                </Button>
            </div>

            {sections.length === 0 && (
                <p className="rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                    No hay secciones. Añada una sección y luego campos dentro de ella.
                </p>
            )}

            {sections.map((section, sectionIndex) => (
                <Collapsible key={section.id} defaultOpen>
                    <Card>
                        <CardHeader className="space-y-2 py-3">
                            <div className="flex items-center gap-2">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="flex flex-1 justify-start gap-2">
                                        <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                                        <ChevronDown className="size-4 shrink-0" />
                                        <span className="font-medium">{section.name || 'Sección sin nombre'}</span>
                                        <span className="text-muted-foreground">({section.fields.length} campos)</span>
                                    </Button>
                                </CollapsibleTrigger>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => moveSection(section.id, -1)}
                                    disabled={sectionIndex === 0}
                                >
                                    <ChevronUp className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => moveSection(section.id, 1)}
                                    disabled={sectionIndex === sections.length - 1}
                                >
                                    <ChevronDown className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 text-destructive"
                                    onClick={() => removeSection(section.id)}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CollapsibleContent>
                            <CardContent className="space-y-4 border-t pt-4">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Nombre de la sección</Label>
                                        <Input
                                            value={section.name}
                                            onChange={(e) => updateSection(section.id, { name: e.target.value })}
                                            placeholder="Ej: Identificación"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="button" variant="outline" size="sm" onClick={() => addField(section.id)}>
                                        <Plus className="mr-2 size-4" />
                                        Añadir campo
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {section.fields.length === 0 && (
                                        <p className="text-sm text-muted-foreground">Sin campos. Añada uno arriba.</p>
                                    )}
                                    {section.fields.map((field, fieldIndex) => (
                                        <div
                                            key={field.id}
                                            className="rounded-lg border bg-muted/20 p-4 space-y-3"
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className="flex shrink-0 gap-1 pt-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => moveField(section.id, field.id, -1)}
                                                        disabled={fieldIndex === 0}
                                                    >
                                                        <ChevronUp className="size-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => moveField(section.id, field.id, 1)}
                                                        disabled={fieldIndex === section.fields.length - 1}
                                                    >
                                                        <ChevronDown className="size-4" />
                                                    </Button>
                                                </div>
                                                <div className="min-w-0 flex-1 space-y-3">
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label>Etiqueta</Label>
                                                            <Input
                                                                value={field.label}
                                                                onChange={(e) => {
                                                                    const label = e.target.value;
                                                                    updateField(section.id, field.id, {
                                                                        label,
                                                                        field_name: field.type === 'section' ? '' : (field.field_name || slugFromLabel(label)),
                                                                    });
                                                                }}
                                                                placeholder="Ej: Nombres"
                                                            />
                                                        </div>
                                                        {field.type !== 'section' && (
                                                            <div className="space-y-2">
                                                                <Label>Nombre interno (slug)</Label>
                                                                <Input
                                                                    value={field.field_name}
                                                                    onChange={(e) => updateField(section.id, field.id, { field_name: e.target.value })}
                                                                    placeholder="nombres"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Tipo</Label>
                                                            <Select
                                                                value={field.type}
                                                                onValueChange={(v) => updateField(section.id, field.id, { type: v })}
                                                            >
                                                                <SelectTrigger className="w-[180px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {FIELD_TYPES.map((t) => (
                                                                        <SelectItem key={t.value} value={t.value}>
                                                                            {t.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        {field.type !== 'section' && (
                                                            <>
                                                                <div className="flex items-center gap-2 pt-6">
                                                                    <Checkbox
                                                                        id={`req-${field.id}`}
                                                                        checked={field.required}
                                                                        onCheckedChange={(c) =>
                                                                            updateField(section.id, field.id, { required: Boolean(c) })
                                                                        }
                                                                    />
                                                                    <Label htmlFor={`req-${field.id}`} className="font-normal">Requerido</Label>
                                                                </div>
                                                                <div className="space-y-2 pt-1">
                                                                    <Label className="text-xs text-muted-foreground">Quién puede editar</Label>
                                                                    <div className="flex flex-wrap gap-3">
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name={`edit-by-${field.id}`}
                                                                                checked={!field.filled_by_admin && !field.editable_by_both}
                                                                                onChange={() =>
                                                                                    updateField(section.id, field.id, {
                                                                                        filled_by_admin: false,
                                                                                        editable_by_both: false,
                                                                                    })
                                                                                }
                                                                                className="size-4"
                                                                            />
                                                                            <span className="text-sm">Lo diligencia el titular</span>
                                                                        </label>
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name={`edit-by-${field.id}`}
                                                                                checked={field.filled_by_admin && !field.editable_by_both}
                                                                                onChange={() =>
                                                                                    updateField(section.id, field.id, {
                                                                                        filled_by_admin: true,
                                                                                        editable_by_both: false,
                                                                                    })
                                                                                }
                                                                                className="size-4"
                                                                            />
                                                                            <span className="text-sm">Lo diligencia el administrador</span>
                                                                        </label>
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name={`edit-by-${field.id}`}
                                                                                checked={field.editable_by_both}
                                                                                onChange={() =>
                                                                                    updateField(section.id, field.id, {
                                                                                        filled_by_admin: false,
                                                                                        editable_by_both: true,
                                                                                    })
                                                                                }
                                                                                className="size-4"
                                                                            />
                                                                            <span className="text-sm">Editable por ambos</span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 pt-2">
                                                                    <Checkbox
                                                                        id={`visible-admin-${field.id}`}
                                                                        checked={field.visible_only_for_admin}
                                                                        onCheckedChange={(c) =>
                                                                            updateField(section.id, field.id, { visible_only_for_admin: Boolean(c) })
                                                                        }
                                                                    />
                                                                    <Label htmlFor={`visible-admin-${field.id}`} className="font-normal text-muted-foreground">
                                                                        Solo visible para administrador
                                                                    </Label>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    {field.type !== 'section' && (
                                                        <div className="space-y-2">
                                                            <Label>Texto de ayuda (opcional)</Label>
                                                            <Input
                                                                value={field.help_text}
                                                                onChange={(e) => updateField(section.id, field.id, { help_text: e.target.value })}
                                                                placeholder="Instrucción para el usuario"
                                                            />
                                                        </div>
                                                    )}
                                                    {field.type === 'select' && (
                                                        <div className="space-y-2">
                                                            <Label>Opciones (separadas por coma)</Label>
                                                            <Input
                                                                value={(field.options ?? []).join(', ')}
                                                                onChange={(e) =>
                                                                    updateField(section.id, field.id, {
                                                                        options: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                                                                    })
                                                                }
                                                                placeholder="Ej: Opción A, Opción B"
                                                            />
                                                        </div>
                                                    )}
                                                    {field.type === 'file' && (
                                                        <div className="space-y-2">
                                                            <Label>Validación (ej: mimes:pdf,jpg max:10240)</Label>
                                                            <Input
                                                                value={(field.validation ?? []).filter((v) => v !== 'file').join(' ')}
                                                                onChange={(e) =>
                                                                    updateField(section.id, field.id, {
                                                                        validation: ['file', ...e.target.value.split(/\s+/).filter(Boolean)],
                                                                    })
                                                                }
                                                                placeholder="mimes:pdf,jpg,jpeg,png max:10240"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="shrink-0 text-destructive"
                                                    onClick={() => removeField(section.id, field.id)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
            ))}
        </div>
    );
}
