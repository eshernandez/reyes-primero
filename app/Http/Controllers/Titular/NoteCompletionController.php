<?php

namespace App\Http\Controllers\Titular;

use App\Http\Controllers\Controller;
use App\Models\TitularNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteCompletionController extends Controller
{
    public function __invoke(Request $request, int $noteId): JsonResponse
    {
        /** @var \App\Models\Titular $titular */
        $titular = auth()->guard('titular')->user();

        $note = TitularNote::query()
            ->where('id', $noteId)
            ->where('titular_id', $titular->id)
            ->firstOrFail();

        $note->update(['completed_at' => $note->completed_at ? null : now()]);

        $titular->update(['status' => \App\Models\Titular::STATUS_REVISION]);

        return response()->json([
            'completed_at' => $note->fresh()->completed_at?->toIso8601String(),
            'status' => $titular->fresh()->status,
        ]);
    }
}
