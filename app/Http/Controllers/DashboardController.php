<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Titular;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if ($user->isAuxiliar()) {
            $projectIds = $user->assignedProjects()->pluck('projects.id');
            $projectsCount = Project::query()->whereIn('id', $projectIds)->count();
            $titularesCount = Titular::query()->whereIn('project_id', $projectIds)->count();
        } else {
            $projectsCount = Project::query()->count();
            $titularesCount = Titular::query()->count();
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'projects_count' => $projectsCount,
                'titulares_count' => $titularesCount,
            ],
        ]);
    }
}
