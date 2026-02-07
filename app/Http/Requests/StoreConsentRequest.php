<?php

namespace App\Http\Requests;

use App\Models\Consent;
use Illuminate\Foundation\Http\FormRequest;

class StoreConsentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Consent::class) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'version' => ['required', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ];
    }
}
