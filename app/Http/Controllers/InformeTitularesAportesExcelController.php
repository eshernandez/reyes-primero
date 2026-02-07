<?php

namespace App\Http\Controllers;

use App\Exports\TitularesConAportesExport;
use App\Models\Titular;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class InformeTitularesAportesExcelController extends Controller
{
    public function __invoke(Request $request): BinaryFileResponse
    {
        $this->authorize('viewAny', User::class);

        $query = Titular::query()
            ->with(['project:id,title', 'folder:id,name,version', 'aportes' => fn ($q) => $q->with('plan:id,nombre')->latest()]);

        if ($request->user()->isAuxiliar()) {
            $projectIds = $request->user()->assignedProjects()->pluck('projects.id');
            $query->whereIn('project_id', $projectIds);
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->input('project_id'));
        }
        if ($request->filled('folder_id')) {
            $query->where('folder_id', $request->input('folder_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $titulares = $query->orderBy('id')->get();

        $rows = new Collection;
        foreach ($titulares as $titular) {
            if ($titular->aportes->isEmpty()) {
                $rows->push(['titular' => $titular, 'aporte' => null]);
            } else {
                foreach ($titular->aportes as $aporte) {
                    $rows->push(['titular' => $titular, 'aporte' => $aporte]);
                }
            }
        }

        $filename = 'titulares-aportes-planes-'.now()->format('Y-m-d-His').'.xlsx';

        return Excel::download(new TitularesConAportesExport($rows), $filename);
    }
}
