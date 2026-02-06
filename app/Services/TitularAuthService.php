<?php

namespace App\Services;

use App\Models\Titular;
use Illuminate\Support\Str;

class TitularAuthService
{
    /**
     * Generate a unique 6-digit access code for a titular.
     */
    public function generateAccessCode(): string
    {
        do {
            $code = (string) random_int(100000, 999999);
        } while (Titular::query()->where('access_code', $code)->exists());

        return $code;
    }

    /**
     * Generate a unique URL token for direct access.
     */
    public function generateUniqueUrl(): string
    {
        do {
            $token = Str::random(32);
        } while (Titular::query()->where('unique_url', $token)->exists());

        return $token;
    }
}
