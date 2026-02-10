import { useEffect, useRef, useState } from 'react';

const DEFAULT_DELAY_MS = 450;

/**
 * Hook para campos de filtro que se aplican con debounce (p. ej. búsqueda por texto).
 * Los campos indicados en debouncedKeys actualizan la URL solo tras dejar de escribir.
 *
 * @param debouncedKeys - Claves del objeto filters que son inputs de texto y deben ir con debounce
 * @param filters - Objeto de filtros actual (viene de props/URL)
 * @param onApply - Callback al aplicar filtros (normalmente router.get con los filtros mergeados)
 * @param options - delayMs: milisegundos de espera (default 450)
 */
export function useDebouncedFilterFields<T extends Record<string, string | undefined>>(
    debouncedKeys: (keyof T)[],
    filters: T,
    onApply: (merged: T) => void,
    options: { delayMs?: number } = {}
): {
    fieldValues: Record<keyof T, string>;
    setFieldValue: (key: keyof T, value: string) => void;
    applyFilters: (overrides: Partial<T>) => void;
} {
    const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
    const filtersRef = useRef(filters);
    filtersRef.current = filters;

    const getInitialValues = (): Record<keyof T, string> => {
        const out = {} as Record<keyof T, string>;
        for (const k of debouncedKeys) {
            const v = filters[k];
            out[k] = (v ?? '') as string;
        }
        return out;
    };

    const [fieldValues, setFieldValuesState] = useState<Record<keyof T, string>>(getInitialValues);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setFieldValue = (key: keyof T, value: string) => {
        setFieldValuesState((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        setFieldValuesState(getInitialValues());
    }, [JSON.stringify(debouncedKeys.map((k) => filters[k] ?? ''))]);

    const applyFilters = (overrides: Partial<T>) => {
        const merged = {
            ...filtersRef.current,
            ...Object.fromEntries(
                debouncedKeys.map((k) => [k, (fieldValues[k] as string)?.trim() || undefined])
            ),
            ...overrides,
        } as T;
        const cleaned = Object.fromEntries(
            Object.entries(merged).filter(([, v]) => v !== undefined && v !== '')
        ) as T;
        onApply(cleaned);
    };

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            debounceRef.current = null;
            const current = filtersRef.current;
            const allSame = debouncedKeys.every(
                (k) => ((fieldValues[k] as string)?.trim() || undefined) === (current[k] ?? '')
            );
            if (allSame) return;
            const next = {
                ...filtersRef.current,
                ...Object.fromEntries(
                    debouncedKeys.map((k) => [k, (fieldValues[k] as string)?.trim() || undefined])
                ),
            } as T;
            const cleaned = Object.fromEntries(
                Object.entries(next).filter(([, v]) => v !== undefined && v !== '')
            ) as T;
            onApply(cleaned);
        }, delayMs);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, debouncedKeys.map((k) => fieldValues[k]));

    return { fieldValues, setFieldValue, applyFilters };
}
