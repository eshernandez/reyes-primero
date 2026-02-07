<?php

namespace App\Services;

use App\Models\Titular;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;

class TitularDataService
{
    /**
     * Build validation rules from folder fields (excluding file type for JSON payload).
     *
     * @param  array<int, array<string, mixed>>  $fields
     * @return array<string, array<int, string>>
     */
    public function buildRulesFromFields(array $fields): array
    {
        $rules = [];

        foreach ($fields as $field) {
            $type = $field['type'] ?? 'text';
            if ($type === 'section' || $type === 'file') {
                continue;
            }
            $name = $field['field_name'] ?? null;
            if (! $name) {
                continue;
            }
            $fieldRules = $field['validation'] ?? [];
            if (is_array($fieldRules)) {
                $rules[$name] = $fieldRules;
            }
        }

        return $rules;
    }

    /**
     * Completion is 100% when all fields (required and optional) have a value.
     */
    public function calculateCompletionPercentage(Titular $titular): int
    {
        $fields = $titular->folder->getFieldsArray();
        $data = $titular->data ?? [];
        $total = 0;
        $filled = 0;

        foreach ($fields as $field) {
            if (($field['type'] ?? 'text') === 'section') {
                continue;
            }
            if (! empty($field['visible_only_for_admin'])) {
                continue;
            }
            $name = $field['field_name'] ?? null;
            if (! $name) {
                continue;
            }
            $total++;
            $value = $data[$name] ?? null;
            $hasValue = $value !== null && $value !== '';
            if ($hasValue) {
                $filled++;
            }
        }

        if ($total === 0) {
            return 100;
        }

        return (int) round(($filled / $total) * 100);
    }

    /**
     * Store uploaded files for file-type fields and merge paths into data.
     *
     * @param  array<string, mixed>  $data
     * @param  array<string, UploadedFile>  $files
     * @return array<string, mixed>
     */
    public function processFileUploads(Titular $titular, array $data, array $files): array
    {
        $fields = $titular->folder->getFieldsArray();
        $dir = 'titulares/'.$titular->id;
        $merged = $data;

        foreach ($fields as $field) {
            $type = $field['type'] ?? 'text';
            if ($type !== 'file') {
                continue;
            }
            $name = $field['field_name'] ?? null;
            if ($name === null || ! isset($files[$name]) || ! $files[$name] instanceof UploadedFile) {
                continue;
            }
            $file = $files[$name];
            $validation = $field['validation'] ?? [];
            $rules = array_filter(array_merge(['file'], $validation), fn ($r) => is_string($r));
            $validator = Validator::make([$name => $file], [$name => $rules]);
            if ($validator->fails()) {
                continue;
            }
            $ext = $file->getClientOriginalExtension() ?: $file->guessExtension();
            $filename = $name.'_'.now()->format('YmdHis').'.'.($ext ?? 'bin');
            $path = $file->storeAs($dir, $filename, 'local');
            if ($path !== false) {
                $merged[$name] = $path;
            }
        }

        return $merged;
    }

    /**
     * Field names that the admin can edit (diligenciado por administrador, editable por ambos, or solo visible administrador).
     *
     * @return list<string>
     */
    public function getAdminEditableFieldNames(Titular $titular): array
    {
        $fields = $titular->folder->getFieldsArray();
        $names = [];
        foreach ($fields as $field) {
            if (($field['type'] ?? 'text') === 'section') {
                continue;
            }
            $name = $field['field_name'] ?? null;
            if ($name === null) {
                continue;
            }
            $filledByAdmin = ! empty($field['filled_by_admin']);
            $editableByBoth = ! empty($field['editable_by_both']);
            $visibleOnlyForAdmin = ! empty($field['visible_only_for_admin']);
            if ($filledByAdmin || $editableByBoth || $visibleOnlyForAdmin) {
                $names[] = $name;
            }
        }

        return $names;
    }

    /**
     * Field names that are visible only for admin (titular must not send or change these).
     *
     * @return list<string>
     */
    public function getVisibleOnlyForAdminFieldNames(Titular $titular): array
    {
        $fields = $titular->folder->getFieldsArray();
        $names = [];
        foreach ($fields as $field) {
            if (($field['type'] ?? 'text') === 'section') {
                continue;
            }
            $name = $field['field_name'] ?? null;
            if ($name !== null && ! empty($field['visible_only_for_admin'])) {
                $names[] = $name;
            }
        }

        return $names;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{valid: bool, data: array<string, mixed>, errors: array<string, list<string>>}
     */
    public function validateAndMergeData(Titular $titular, array $data): array
    {
        $fields = $titular->folder->getFieldsArray();
        $rules = $this->buildRulesFromFields($fields);

        $validator = Validator::make($data, $rules);

        if ($validator->fails()) {
            return [
                'valid' => false,
                'data' => $titular->data ?? [],
                'errors' => $validator->errors()->toArray(),
            ];
        }

        $current = $titular->data ?? [];
        $merged = array_merge($current, $validator->validated());

        // Preserve file field values from $data (paths set by processFileUploads or sent by client)
        foreach ($fields as $field) {
            if (($field['type'] ?? 'text') === 'file') {
                $name = $field['field_name'] ?? null;
                if ($name !== null && array_key_exists($name, $data)) {
                    $merged[$name] = $data[$name];
                }
            }
        }

        return [
            'valid' => true,
            'data' => $merged,
            'errors' => [],
        ];
    }
}
