<?php

namespace App\Http\Controllers;

use App\Models\Aporte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AporteSoporteController extends Controller
{
    public function __invoke(Request $request, Aporte $aporte): BinaryFileResponse
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

        if (! $aporte->soporte_path || ! Storage::disk('local')->exists($aporte->soporte_path)) {
            abort(404);
        }

        $fullPath = Storage::disk('local')->path($aporte->soporte_path);
        $mime = Storage::disk('local')->mimeType($aporte->soporte_path) ?: 'application/octet-stream';

        return response()->file($fullPath, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="'.basename($aporte->soporte_path).'"',
        ]);
    }
}
