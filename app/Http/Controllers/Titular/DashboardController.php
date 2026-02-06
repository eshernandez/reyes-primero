<?php

namespace App\Http\Controllers\Titular;

use App\Http\Controllers\Controller;
use App\Models\Titular;
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
        $titular->load(['folder', 'project']);

        $folder = $titular->folder;
        $sections = $folder->getSections();
        $consentsRequired = $folder->consents()->where('is_active', true)->orderByPivot('order')->get();

        return Inertia::render('titular/dashboard', [
            'titular' => [
                'id' => $titular->id,
                'nombre' => $titular->nombre,
                'data' => $titular->data ?? [],
                'completion_percentage' => $titular->completion_percentage,
                'folder_version' => $titular->folder_version,
            ],
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
