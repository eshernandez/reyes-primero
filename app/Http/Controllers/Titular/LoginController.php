<?php

namespace App\Http\Controllers\Titular;

use App\Http\Controllers\Controller;
use App\Models\Titular;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('titular/login');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'access_code' => ['required', 'string', 'size:6'],
        ]);

        $key = 'titular-login:'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return back()->withErrors(['access_code' => __('Demasiados intentos. Intente de nuevo en un minuto.')]);
        }

        $titular = Titular::query()
            ->where('access_code', $request->input('access_code'))
            ->where('is_active', true)
            ->first();

        if (! $titular) {
            RateLimiter::hit($key, 60);

            return back()->withErrors(['access_code' => __('Código de acceso inválido.')]);
        }

        RateLimiter::clear($key);
        auth()->guard('titular')->login($titular);
        $titular->update(['last_access' => now()]);

        return redirect()->route('titular.dashboard');
    }

    public function destroy(Request $request): RedirectResponse
    {
        auth()->guard('titular')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('titular.login');
    }
}
