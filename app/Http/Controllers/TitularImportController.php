<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportTitularesRequest;
use App\Imports\TitularesImport;
use App\Models\Folder;
use App\Models\Project;
use App\Models\Titular;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class TitularImportController extends Controller
{
    public function template(): HttpResponse
    {
        $this->authorize('create', Titular::class);

        $headers = ['nombre', 'nombres', 'apellidos', 'correo_electronico', 'celular'];
        $csv = implode(',', array_map(fn ($h) => '"'.str_replace('"', '""', $h).'"', $headers))."\n";
        $csv .= '"Ejemplo Uno","Ejemplo","Uno","ejemplo@correo.com","3001234567"'."\n";

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="plantilla_importacion_titulares.csv"',
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Titular::class);

        $projects = $request->user()->isAuxiliar()
            ? $request->user()->assignedProjects()->orderBy('title')->get()
            : Project::query()->orderBy('title')->get();
        $folders = Folder::query()->orderBy('name')->get(['id', 'name', 'version']);

        return Inertia::render('titulares/import', [
            'projects' => $projects,
            'folders' => $folders,
        ]);
    }

    public function store(ImportTitularesRequest $request): RedirectResponse
    {
        if ($request->user()->isAuxiliar()) {
            $allowed = $request->user()->assignedProjects()->pluck('projects.id');
            if (! $allowed->contains($request->input('project_id'))) {
                return redirect()->route('titulares.import.create')->with('error', 'No tiene permiso para importar en ese proyecto.');
            }
        }

        $folder = Folder::query()->findOrFail($request->input('folder_id'));

        $import = new TitularesImport(
            $request->integer('project_id'),
            $request->integer('folder_id'),
            $request->user()->id,
            $folder
        );

        Excel::import($import, $request->file('file'));

        $message = "Importación completada: {$import->created} titular(es) creado(s).";
        if (count($import->errors) > 0) {
            $message .= ' Errores en '.count($import->errors).' fila(s): '.collect($import->errors)
                ->take(5)
                ->map(fn ($e) => "fila {$e['row']}: {$e['message']}")
                ->implode('; ');
            if (count($import->errors) > 5) {
                $message .= ' (y otras).';
            }
        }

        return redirect()->route('titulares.import.create')->with('success', $message);
    }
}
