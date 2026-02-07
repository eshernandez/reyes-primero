<?php

namespace App\Http\Controllers\Titular;

use App\Http\Controllers\Controller;
use App\Models\Titular;
use App\Services\PrivateFileServe;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileController extends Controller
{
    public function __invoke(Request $request): BinaryFileResponse|StreamedResponse
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

        $response = PrivateFileServe::response($path, $path);
        if ($response === null) {
            abort(404);
        }

        return $response;
    }
}
