<?php

namespace App\Exports;

use App\Models\Aporte;
use App\Models\Titular;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class TitularesConAportesExport implements FromCollection, WithHeadings, WithMapping
{
    /**
     * @param  Collection<int, array{titular: Titular, aporte: \App\Models\Aporte|null}>
     */
    public function __construct(
        private readonly Collection $rows
    ) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'Id titular',
            'Nombre titular',
            'Proyecto',
            'Carpeta',
            'Completitud %',
            'Estado titular',
            'Id aporte',
            'Valor aporte',
            'Estado aporte',
            'Plan',
            'Fecha aprobación',
        ];
    }

    /**
     * @param  array{titular: Titular, aporte: \App\Models\Aporte|null}  $row
     * @return array<int, string|int|null>
     */
    public function map($row): array
    {
        $titular = $row['titular'];
        $aporte = $row['aporte'];
        $data = $titular->data ?? [];
        $statusLabels = Titular::statusLabels();
        $aporteEstadoLabels = Aporte::estadoLabels();

        return [
            $titular->id,
            $titular->nombre,
            $titular->project?->title ?? '',
            $titular->folder?->name ?? '',
            $titular->completion_percentage,
            $statusLabels[$titular->status] ?? $titular->status,
            $aporte?->id ?? '',
            $aporte !== null ? (string) $aporte->valor : '',
            $aporte !== null ? ($aporteEstadoLabels[$aporte->estado] ?? $aporte->estado) : '',
            $aporte?->plan?->nombre ?? '',
            $aporte?->approved_at?->format('d/m/Y H:i') ?? '',
        ];
    }
}
