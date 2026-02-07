<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTitularAporteRequest;
use App\Http\Requests\StoreTitularRequest;
use App\Http\Requests\UpdateAporteRequest;
use App\Http\Requests\UpdateTitularRequest;
use App\Models\Aporte;
use App\Models\Folder;
use App\Models\Plan;
use App\Models\Project;
use App\Models\Titular;
use App\Services\TitularAuthService;
use App\Services\TitularDataService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TitularController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Titular::class);

        $query = Titular::query()
            ->with(['project:id,title', 'folder:id,name,version'])
            ->withCount([]);

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

        $titulares = $query->latest()->paginate(15)->withQueryString();

        $projectsForFilter = $request->user()->isAuxiliar()
            ? $request->user()->assignedProjects()->orderBy('title')->get(['projects.id', 'projects.title'])
            : Project::query()->orderBy('title')->get(['id', 'title']);

        $foldersForFilter = Folder::query()->orderBy('name')->get(['id', 'name', 'version']);

        return Inertia::render('titulares/index', [
            'titulares' => $titulares,
            'projectsForFilter' => $projectsForFilter,
            'foldersForFilter' => $foldersForFilter,
            'filters' => $request->only(['search', 'project_id', 'folder_id', 'status', 'completitud', 'completitud_min', 'completitud_max', 'telefono']),
            'statusLabels' => Titular::statusLabels(),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Titular::class);

        $projects = $request->user()->isAuxiliar()
            ? $request->user()->assignedProjects()->orderBy('title')->get()
            : Project::query()->orderBy('title')->get();
        $folders = Folder::query()->orderBy('name')->get(['id', 'name', 'version']);

        return Inertia::render('titulares/create', [
            'projects' => $projects,
            'folders' => $folders,
        ]);
    }

    public function store(StoreTitularRequest $request): RedirectResponse
    {
        $folder = Folder::query()->findOrFail($request->input('folder_id'));
        $authService = new TitularAuthService;

        Titular::query()->create([
            'nombre' => $request->input('nombre'),
            'access_code' => $authService->generateAccessCode(),
            'unique_url' => $authService->generateUniqueUrl(),
            'project_id' => $request->input('project_id'),
            'folder_id' => $request->input('folder_id'),
            'folder_version' => $folder->version,
            'data' => [],
            'consents_accepted' => [],
            'completion_percentage' => 0,
            'status' => Titular::STATUS_EN_PROCESO,
            'is_active' => true,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('titulares.index')->with('success', 'Titular creado correctamente.');
    }

    public function show(Titular $titulare): Response
    {
        $this->authorize('view', $titulare);

        $titulare->load([
            'project',
            'folder',
            'creator:id,name',
            'notes' => fn ($q) => $q->with('author:id,name')->latest(),
            'aportes' => fn ($q) => $q->with(['plan:id,nombre', 'approvedByUser:id,name'])->latest(),
        ]);
        $sections = $titulare->folder->getSections();
        $plans = Plan::query()->orderBy('nombre')->get(['id', 'nombre', 'valor_ingreso', 'fecha_cierre']);

        return Inertia::render('titulares/show', [
            'titular' => $titulare,
            'sections' => $sections,
            'statusLabels' => Titular::statusLabels(),
            'aportes' => $titulare->aportes,
            'aporteEstadoLabels' => Aporte::estadoLabels(),
            'plans' => $plans,
        ]);
    }

    public function storeAporte(StoreTitularAporteRequest $request, Titular $titulare): RedirectResponse
    {
        $aporte = Aporte::query()->create([
            'titular_id' => $titulare->id,
            'fecha_consignacion' => $request->validated('fecha_consignacion'),
            'nro_recibo' => $request->validated('nro_recibo'),
            'valor' => $request->validated('valor'),
            'plan_id' => $request->validated('plan_id'),
            'verific_antecedentes' => $request->validated('verific_antecedentes'),
            'observaciones' => $request->validated('observaciones'),
            'estado' => Aporte::ESTADO_PENDIENTE,
        ]);

        $file = $request->file('soporte');
        if ($file) {
            $ext = $file->getClientOriginalExtension() ?: $file->guessExtension();
            $filename = 'soporte_'.now()->format('YmdHis').'.'.$ext;
            $path = $file->storeAs('aportes/'.$aporte->id, $filename, config('filesystems.private_disk'));
            $aporte->update(['soporte_path' => $path]);
        }

        return redirect()->route('titulares.show', $titulare)->with('success', 'Aporte agregado correctamente.');
    }

    public function updateAporte(UpdateAporteRequest $request, Titular $titulare, Aporte $aporte): RedirectResponse
    {
        if ($aporte->titular_id !== $titulare->id) {
            abort(404);
        }
        $this->authorize('update', $aporte);

        $aporte->update([
            'plan_id' => $request->validated('estado') === 'aprobado' ? $request->validated('plan_id') : null,
            'estado' => $request->validated('estado'),
            'verific_antecedentes' => $request->validated('verific_antecedentes'),
            'observaciones' => $request->validated('observaciones'),
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);

        $message = $request->validated('estado') === 'aprobado'
            ? 'Aporte aprobado y asociado al plan.'
            : 'Aporte rechazado.';

        return redirect()->route('titulares.show', $titulare)->with('success', $message);
    }

    public function regenerateAccessCode(Titular $titulare): RedirectResponse
    {
        $this->authorize('update', $titulare);

        $authService = new TitularAuthService;
        $titulare->update(['access_code' => $authService->generateAccessCode()]);

        return redirect()->route('titulares.show', $titulare)->with('success', 'Código de 6 dígitos generado. El anterior deja de ser válido.');
    }

    public function regenerateUniqueUrl(Titular $titulare): RedirectResponse
    {
        $this->authorize('update', $titulare);

        $authService = new TitularAuthService;
        $titulare->update(['unique_url' => $authService->generateUniqueUrl()]);

        return redirect()->route('titulares.show', $titulare)->with('success', 'Nueva URL de acceso generada. La anterior deja de ser válida.');
    }

    public function updateStatus(Request $request, Titular $titulare): RedirectResponse
    {
        $this->authorize('update', $titulare);

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in([
                Titular::STATUS_EN_PROCESO,
                Titular::STATUS_ACEPTADO,
                Titular::STATUS_RECHAZADO,
                Titular::STATUS_DEVUELTO,
                Titular::STATUS_REVISION,
            ])],
        ]);

        $titulare->update(['status' => $validated['status']]);

        return redirect()->route('titulares.show', $titulare)->with('success', 'Estado actualizado.');
    }

    public function edit(Request $request, Titular $titulare): Response
    {
        $this->authorize('update', $titulare);

        $projects = $request->user()->isAuxiliar()
            ? $request->user()->assignedProjects()->orderBy('title')->get()
            : Project::query()->orderBy('title')->get();
        $folders = Folder::query()->orderBy('name')->get(['id', 'name', 'version']);

        return Inertia::render('titulares/edit', [
            'titular' => $titulare,
            'projects' => $projects,
            'folders' => $folders,
            'statusLabels' => Titular::statusLabels(),
        ]);
    }

    public function update(UpdateTitularRequest $request, Titular $titulare): RedirectResponse
    {
        $folder = Folder::query()->find($request->input('folder_id'));
        $data = [
            'nombre' => $request->input('nombre'),
            'project_id' => $request->input('project_id'),
            'folder_id' => $request->input('folder_id'),
            'is_active' => $request->boolean('is_active', true),
        ];
        if ($folder) {
            $data['folder_version'] = $folder->version;
        }
        if ($request->has('status')) {
            $data['status'] = $request->input('status');
        }
        $titulare->update($data);

        return redirect()->route('titulares.index')->with('success', 'Titular actualizado correctamente.');
    }

    public function destroy(Titular $titulare): RedirectResponse
    {
        $this->authorize('delete', $titulare);

        $titulare->delete();

        return redirect()->route('titulares.index')->with('success', 'Titular desactivado correctamente.');
    }

    public function editData(Titular $titulare): Response
    {
        $this->authorize('update', $titulare);

        $titulare->load(['project', 'folder']);
        $sections = $titulare->folder->getSections();

        return Inertia::render('titulares/data-edit', [
            'titular' => [
                'id' => $titulare->id,
                'nombre' => $titulare->nombre,
                'data' => $titulare->data ?? [],
            ],
            'sections' => $sections,
        ]);
    }

    public function updateData(Request $request, Titular $titulare): RedirectResponse
    {
        $this->authorize('update', $titulare);

        $data = $request->input('data', []);
        if (! is_array($data)) {
            $data = [];
        }

        $service = new TitularDataService;
        $allowedKeys = $service->getAdminEditableFieldNames($titulare);
        $filtered = array_intersect_key($data, array_flip($allowedKeys));

        $current = $titulare->data ?? [];
        $merged = array_merge($current, $filtered);

        $result = $service->validateAndMergeData($titulare, $merged);

        if (! $result['valid']) {
            return redirect()
                ->route('titulares.data.edit', $titulare)
                ->withErrors($result['errors'])
                ->withInput();
        }

        $titulare->update([
            'data' => $result['data'],
            'completion_percentage' => $service->calculateCompletionPercentage($titulare),
        ]);

        return redirect()
            ->route('titulares.show', $titulare)
            ->with('success', 'Datos de la carpeta actualizados correctamente.');
    }
}
