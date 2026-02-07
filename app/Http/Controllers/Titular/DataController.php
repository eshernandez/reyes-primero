<?php

namespace App\Http\Controllers\Titular;

use App\Http\Controllers\Controller;
use App\Models\Titular;
use App\Services\TitularDataService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DataController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var Titular $titular */
        $titular = auth()->guard('titular')->user();
        $titular->load('folder');

        $data = $request->input('data', []);
        if (is_string($data)) {
            $decoded = json_decode($data, true);
            $data = is_array($decoded) ? $decoded : [];
        }
        if (! is_array($data)) {
            $data = [];
        }

        $service = new TitularDataService;
        $adminOnlyKeys = $service->getVisibleOnlyForAdminFieldNames($titular);
        foreach ($adminOnlyKeys as $key) {
            unset($data[$key]);
        }

        $files = $request->allFiles();
        if ($files !== []) {
            $data = $service->processFileUploads($titular, $data, $files);
        }

        $result = $service->validateAndMergeData($titular, $data);

        if (! $result['valid']) {
            return response()->json(['message' => 'Validation failed', 'errors' => $result['errors']], 422);
        }

        $titular->update([
            'data' => $result['data'],
            'completion_percentage' => $service->calculateCompletionPercentage($titular),
        ]);

        return response()->json([
            'message' => 'Datos guardados correctamente',
            'completion_percentage' => $titular->completion_percentage,
        ]);
    }
}
