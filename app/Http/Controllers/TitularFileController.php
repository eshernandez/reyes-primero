<?php

namespace App\Http\Controllers;

use App\Models\Titular;
use App\Services\PrivateFileServe;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TitularFileController extends Controller
{
    public function __invoke(Request $request, Titular $titulare): BinaryFileResponse|StreamedResponse
    {
        $this->authorize('view', $titulare);

        $path = $request->query('path');
        if (! is_string($path) || $path === '') {
            abort(404);
        }
        $path = trim($path);
        if (str_contains($path, '..')) {
            abort(404);
        }
        $prefix = 'titulares/'.$titulare->id.'/';
        if (! str_starts_with($path, $prefix)) {
            abort(404);
        }

        $response = PrivateFileServe::response($path, $path);
        if ($response === null) {
            abort(404);
        }

        return $response;
    }
}
