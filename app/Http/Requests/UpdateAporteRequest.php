<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAporteRequest extends FormRequest
{
    public function authorize(): bool
    {
        $aporte = $this->route('aporte');

        return $aporte && $this->user()?->can('update', $aporte);
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('estado') === 'rechazado') {
            $this->merge(['plan_id' => null]);
        }
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'plan_id' => ['required_if:estado,aprobado', 'nullable', 'integer', 'exists:plans,id'],
            'estado' => ['required', 'string', 'in:aprobado,rechazado'],
        ];
    }
}
