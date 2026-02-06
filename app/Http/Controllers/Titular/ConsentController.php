<?php

namespace App\Http\Controllers\Titular;

use App\Http\Controllers\Controller;
use App\Models\Consent;
use App\Models\Titular;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsentController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'consents' => ['required', 'array'],
            'consents.*.consent_id' => ['required', 'integer', 'exists:consents,id'],
            'consents.*.version' => ['required', 'string'],
        ]);

        /** @var Titular $titular */
        $titular = auth()->guard('titular')->user();
        $accepted = $titular->consents_accepted ?? [];

        foreach ($request->input('consents') as $item) {
            $consent = Consent::find($item['consent_id']);
            if (! $consent) {
                continue;
            }
            $accepted[] = [
                'consent_id' => $consent->id,
                'consent_title' => $consent->title,
                'version' => $item['version'],
                'accepted_at' => now()->toIso8601String(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ];
        }

        $titular->update(['consents_accepted' => $accepted]);

        return response()->json(['message' => 'Consentimientos registrados']);
    }
}
