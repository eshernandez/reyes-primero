<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTitularNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        $titular = $this->route('titulare');

        return $titular && $this->user()?->can('view', $titular);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:65535'],
            'mark_as_returned' => ['boolean'],
        ];
    }
}
