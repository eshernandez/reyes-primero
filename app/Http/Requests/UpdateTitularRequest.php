<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTitularRequest extends FormRequest
{
    public function authorize(): bool
    {
        $titular = $this->route('titulare');

        return $titular && $this->user()?->can('update', $titular);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255'],
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'folder_id' => ['required', 'integer', 'exists:folders,id'],
            'status' => ['nullable', 'string', 'in:en_proceso,aceptado,rechazado,devuelto'],
            'is_active' => ['boolean'],
        ];
    }
}
