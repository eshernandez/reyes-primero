<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConsentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $consent = $this->route('consent');

        return $consent && $this->user()?->can('update', $consent);
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
