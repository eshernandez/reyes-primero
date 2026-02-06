<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTitularRequest;
use App\Http\Requests\UpdateTitularRequest;
use App\Models\Folder;
use App\Models\Project;
use App\Models\Titular;
use App\Services\TitularAuthService;
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

        $titulares = $query->latest()->paginate(15)->withQueryString();

        $projectsForFilter = $request->user()->isAuxiliar()
            ? $request->user()->assignedProjects()->orderBy('title')->get(['projects.id', 'projects.title'])
            : Project::query()->orderBy('title')->get(['id', 'title']);

        return Inertia::render('titulares/index', [
            'titulares' => $titulares,
            'projectsForFilter' => $projectsForFilter,
            'filters' => $request->only(['search', 'project_id']),
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

        $titulare->load(['project', 'folder', 'creator:id,name', 'notes' => fn ($q) => $q->with('author:id,name')->latest()]);
        $sections = $titulare->folder->getSections();

        return Inertia::render('titulares/show', [
            'titular' => $titulare,
            'sections' => $sections,
            'statusLabels' => Titular::statusLabels(),
        ]);
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
}
