<?php

namespace App\Http\Controllers;

use App\Models\Aporte;
use App\Services\PrivateFileServe;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AporteSoporteController extends Controller
{
    public function __invoke(Request $request, Aporte $aporte): BinaryFileResponse|StreamedResponse
    {
        if (auth()->guard('web')->check()) {
            $this->authorize('view', $aporte);
        } elseif (auth()->guard('titular')->check()) {
            if ($aporte->titular_id !== auth()->guard('titular')->id()) {
                abort(403);
            }
        } else {
            abort(401);
        }

        if (! $aporte->soporte_path) {
            abort(404);
        }

        $response = PrivateFileServe::response($aporte->soporte_path, $aporte->soporte_path);
        if ($response === null) {
            abort(404);
        }

        return $response;
    }
}
