<?php

namespace App\Imports;

use App\Models\Folder;
use App\Models\Titular;
use App\Services\TitularAuthService;
use App\Services\TitularDataService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class TitularesImport implements ToCollection, WithHeadingRow
{
    public int $created = 0;

    /** @var array<int, array{row: int, message: string}> */
    public array $errors = [];

    public function __construct(
        private readonly int $projectId,
        private readonly int $folderId,
        private readonly int $createdBy,
        private readonly Folder $folder
    ) {}

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     */
    public function collection(Collection $rows): void
    {
        $authService = new TitularAuthService;
        $dataService = new TitularDataService;
        $fieldNames = $this->getDataFieldNames();
        $rowNumber = 2;

        foreach ($rows as $row) {
            $rowArray = $row instanceof \Illuminate\Support\Collection ? $row->all() : (array) $row;
            $nombre = $this->extractNombre($rowArray);

            if ($nombre === null || trim((string) $nombre) === '') {
                $this->errors[] = ['row' => $rowNumber, 'message' => 'Nombre vacío o faltante.'];

                $rowNumber++;

                continue;
            }

            $data = $this->extractData($rowArray, $fieldNames);

            try {
                $titular = Titular::query()->create([
                    'nombre' => trim((string) $nombre),
                    'access_code' => $authService->generateAccessCode(),
                    'unique_url' => $authService->generateUniqueUrl(),
                    'project_id' => $this->projectId,
                    'folder_id' => $this->folderId,
                    'folder_version' => $this->folder->version,
                    'data' => $data,
                    'consents_accepted' => [],
                    'completion_percentage' => 0,
                    'status' => Titular::STATUS_EN_PROCESO,
                    'is_active' => true,
                    'created_by' => $this->createdBy,
                ]);

                $titular->completion_percentage = $dataService->calculateCompletionPercentage($titular);
                $titular->saveQuietly();

                $this->created++;
            } catch (\Throwable $e) {
                $this->errors[] = ['row' => $rowNumber, 'message' => $e->getMessage()];
            }

            $rowNumber++;
        }
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function extractNombre(array $row): mixed
    {
        $keys = ['nombre', 'name', 'titular', 'nombre_completo'];
        foreach ($keys as $key) {
            if (isset($row[$key]) && (string) $row[$key] !== '') {
                return $row[$key];
            }
        }

        return $row[array_key_first($row)] ?? null;
    }

    /**
     * @return list<string>
     */
    private function getDataFieldNames(): array
    {
        $names = [];
        foreach ($this->folder->getFieldsArray() as $field) {
            $name = $field['field_name'] ?? null;
            if (is_string($name) && $name !== '') {
                $names[] = $name;
            }
        }

        return $names;
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  list<string>  $allowedFieldNames
     * @return array<string, mixed>
     */
    private function extractData(array $row, array $allowedFieldNames): array
    {
        $data = [];
        $nombreKeys = ['nombre', 'name', 'titular', 'nombre_completo'];

        foreach ($row as $key => $value) {
            if ($value === null || (string) $value === '') {
                continue;
            }
            $normalized = $this->normalizeHeaderKey((string) $key);
            if (in_array($normalized, $nombreKeys, true)) {
                continue;
            }
            if ($allowedFieldNames !== [] && ! in_array($normalized, $allowedFieldNames, true)) {
                continue;
            }
            $data[$normalized] = is_scalar($value) ? trim((string) $value) : $value;
        }

        return $data;
    }

    private function normalizeHeaderKey(string $key): string
    {
        $key = str_replace(['-', ' '], '_', mb_strtolower($key));

        return preg_replace('/[^a-z0-9_]/', '', $key) ?? $key;
    }
}
