<?php

namespace App\Http\Controllers\Titular;

use App\Http\Controllers\Controller;
use App\Models\Titular;
use App\Services\TitularDataService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        /** @var Titular $titular */
        $titular = auth()->guard('titular')->user();
        $titular->load(['folder', 'project', 'notes' => fn ($q) => $q->with('author:id,name')->latest()]);

        $completionPercentage = (new TitularDataService)->calculateCompletionPercentage($titular);
        if ($titular->completion_percentage !== $completionPercentage) {
            $titular->update(['completion_percentage' => $completionPercentage]);
        }

        $folder = $titular->folder;
        $sections = $folder->getSections();
        $consentsRequired = $folder->consents()->where('is_active', true)->orderByPivot('order')->get();

        $notes = $titular->notes->map(fn ($n) => [
            'id' => $n->id,
            'body' => $n->body,
            'created_at' => $n->created_at->toIso8601String(),
            'completed_at' => $n->completed_at?->toIso8601String(),
            'author' => $n->author ? ['id' => $n->author->id, 'name' => $n->author->name] : ['id' => 0, 'name' => 'Administrador'],
        ])->all();

        return Inertia::render('titular/dashboard', [
            'titular' => [
                'id' => $titular->id,
                'nombre' => $titular->nombre,
                'data' => $titular->data ?? [],
                'completion_percentage' => $titular->completion_percentage,
                'folder_version' => $titular->folder_version,
            ],
            'notes' => $notes,
            'folder' => [
                'id' => $folder->id,
                'name' => $folder->name,
                'version' => $folder->version,
                'sections' => $sections,
            ],
            'project' => [
                'id' => $titular->project->id,
                'title' => $titular->project->title,
            ],
            'consentsRequired' => $consentsRequired->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'content' => $c->content,
                'version' => $c->version,
            ]),
            'consentsAccepted' => $titular->consents_accepted ?? [],
        ]);
    }
}
