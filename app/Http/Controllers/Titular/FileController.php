<?php

namespace App\Http\Controllers\Titular;

use App\Http\Controllers\Controller;
use App\Models\Titular;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class FileController extends Controller
{
    public function __invoke(Request $request): BinaryFileResponse
    {
        /** @var Titular $titular */
        $titular = auth()->guard('titular')->user();
        $path = $request->query('path');
        if (! is_string($path) || $path === '') {
            abort(404);
        }
        $path = trim($path);
        if (str_contains($path, '..')) {
            abort(404);
        }
        $prefix = 'titulares/'.$titular->id.'/';
        if (! str_starts_with($path, $prefix)) {
            abort(404);
        }
        if (! Storage::disk('local')->exists($path)) {
            abort(404);
        }
        $fullPath = Storage::disk('local')->path($path);
        $mime = Storage::disk('local')->mimeType($path) ?: 'application/octet-stream';

        return response()->file($fullPath, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="'.basename($path).'"',
        ]);
    }
}
