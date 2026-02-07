<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use App\Models\Project;
use App\Models\Titular;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InformeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $titularesPorEstado = Titular::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $titularesPorProyecto = Project::query()
            ->withCount('titulares')
            ->orderByDesc('titulares_count')
            ->limit(10)
            ->get();

        $projectsForFilter = Project::query()->orderBy('title')->get(['id', 'title']);
        $foldersForFilter = Folder::query()->orderBy('name')->get(['id', 'name', 'version']);

        return Inertia::render('informes/index', [
            'stats' => [
                'proyectos' => Project::query()->count(),
                'carpetas' => Folder::query()->count(),
                'titulares' => Titular::query()->count(),
                'usuarios' => User::query()->count(),
            ],
            'titularesPorEstado' => $titularesPorEstado,
            'titularesPorProyecto' => $titularesPorProyecto,
            'statusLabels' => Titular::statusLabels(),
            'projectsForFilter' => $projectsForFilter,
            'foldersForFilter' => $foldersForFilter,
        ]);
    }
}
