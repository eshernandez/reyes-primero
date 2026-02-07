<?php

namespace App\Http\Requests;

use App\Models\Titular;
use Illuminate\Foundation\Http\FormRequest;

class ImportTitularesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Titular::class) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'folder_id' => ['required', 'integer', 'exists:folders,id'],
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ];
    }
}
