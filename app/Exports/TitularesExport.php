<?php

namespace App\Exports;

use App\Models\Titular;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class TitularesExport implements FromCollection, WithHeadings, WithMapping
{
    /**
     * @param  Collection<int, Titular>  $titulares
     */
    public function __construct(
        private readonly Collection $titulares
    ) {}

    /**
     * @return Collection<int, Titular>
     */
    public function collection(): Collection
    {
        return $this->titulares;
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'Id',
            'Nombre',
            'Proyecto',
            'Carpeta',
            'Completitud %',
            'Estado',
            'Activo',
            'Último acceso',
            'Nombres',
            'Apellidos',
            'Correo electrónico',
            'Celular',
        ];
    }

    /**
     * @param  Titular  $titular
     * @return array<int, string|int|null>
     */
    public function map($titular): array
    {
        $data = $titular->data ?? [];
        $statusLabels = Titular::statusLabels();

        return [
            $titular->id,
            $titular->nombre,
            $titular->project?->title ?? '',
            $titular->folder?->name ?? '',
            $titular->completion_percentage,
            $statusLabels[$titular->status] ?? $titular->status,
            $titular->is_active ? 'Sí' : 'No',
            $titular->last_access?->format('d/m/Y H:i') ?? '',
            $data['nombres'] ?? '',
            $data['apellidos'] ?? '',
            $data['correo_electronico'] ?? '',
            $data['celular'] ?? '',
        ];
    }
}
