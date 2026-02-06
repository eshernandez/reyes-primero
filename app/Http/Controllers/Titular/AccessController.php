<?php

namespace App\Http\Controllers\Titular;

use App\Http\Controllers\Controller;
use App\Models\Titular;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AccessController extends Controller
{
    public function __invoke(Request $request, string $uniqueUrl): RedirectResponse
    {
        $titular = Titular::query()
            ->where('unique_url', $uniqueUrl)
            ->where('is_active', true)
            ->firstOrFail();

        auth()->guard('titular')->login($titular);
        $titular->update(['last_access' => now()]);

        return redirect()->route('titular.dashboard');
    }
}
