<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceHttpsInProduction
{
    /**
     * En producción, fuerza que la petición se vea como HTTPS para que
     * route(), url() y la paginación generen URLs https (evita Mixed Content).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('production') && ! $request->secure()) {
            $request->server->set('HTTPS', 'on');
            $request->server->set('SERVER_PORT', '443');
            $request->server->set('HTTP_X_FORWARDED_PROTO', 'https');
        }

        return $next($request);
    }
}
