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
            'valor' => ['required', 'numeric', 'min:0'],
            'soporte' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }
}
