<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFolderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $folder = $this->route('folder');

        return $folder && $this->user()?->can('update', $folder);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:65535'],
            'version' => ['required', 'string', 'max:50'],
            'fields' => ['required', 'array'],
            'fields.fields' => ['required_without:fields.sections', 'array'],
            'fields.sections' => ['required_without:fields.fields', 'array'],
            'is_default' => ['boolean'],
        ];
    }
}
