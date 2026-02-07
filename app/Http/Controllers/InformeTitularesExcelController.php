<?php

namespace App\Http\Controllers;

use App\Exports\TitularesExport;
use App\Models\Titular;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class InformeTitularesExcelController extends Controller
{
    /**
     * Export titulares to Excel with optional filters (project_id, folder_id, status, search, etc.).
     */
    public function __invoke(Request $request): BinaryFileResponse|Response
    {
        $this->authorize('viewAny', User::class);

        $query = Titular::query()
            ->with(['project:id,title', 'folder:id,name,version']);

        if ($request->user()->isAuxiliar()) {
            $projectIds = $request->user()->assignedProjects()->pluck('projects.id');
            $query->whereIn('project_id', $projectIds);
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->input('project_id'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('nombre', 'like', "%{$search}%");
        }
        if ($request->filled('folder_id')) {
            $query->where('folder_id', $request->input('folder_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('completitud_min') || $request->filled('completitud_max')) {
            $completitudMin = (int) $request->input('completitud_min', 0);
            $completitudMax = (int) $request->input('completitud_max', 100);
            $completitudMin = max(0, min(100, $completitudMin));
            $completitudMax = max(0, min(100, $completitudMax));
            if ($request->filled('completitud_min') && $request->filled('completitud_max')) {
                $query->whereBetween('completion_percentage', [
                    min($completitudMin, $completitudMax),
                    max($completitudMin, $completitudMax),
                ]);
            } elseif ($request->filled('completitud_min')) {
                $query->where('completion_percentage', '>=', $completitudMin);
            } else {
                $query->where('completion_percentage', '<=', $completitudMax);
            }
        } elseif ($request->filled('completitud')) {
            $range = $request->input('completitud');
            if ($range === '0-25') {
                $query->whereBetween('completion_percentage', [0, 25]);
            } elseif ($range === '26-50') {
                $query->whereBetween('completion_percentage', [26, 50]);
            } elseif ($range === '51-75') {
                $query->whereBetween('completion_percentage', [51, 75]);
            } elseif ($range === '76-100') {
                $query->whereBetween('completion_percentage', [76, 100]);
            }
        }
        if ($request->filled('telefono')) {
            $telefono = $request->input('telefono');
            $query->where('data->celular', 'like', "%{$telefono}%");
        }

        $titulares = $query->orderBy('id')->get();
        $filename = 'titulares-'.now()->format('Y-m-d-His').'.xlsx';

        return Excel::download(new TitularesExport($titulares), $filename);
    }
}
