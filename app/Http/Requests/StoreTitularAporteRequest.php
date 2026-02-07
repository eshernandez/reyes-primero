<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTitularAporteRequest extends FormRequest
{
    public function authorize(): bool
    {
        $titulare = $this->route('titulare');

        return $titulare && $this->user()?->can('update', $titulare);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'fecha_consignacion' => ['nullable', 'date'],
            'nro_recibo' => ['nullable', 'string', 'max:255'],
            'valor' => ['required', 'numeric', 'min:0'],
            'plan_id' => ['nullable', 'integer', 'exists:plans,id'],
            'verific_antecedentes' => ['nullable', 'string', 'max:255'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
            'soporte' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }
}
