<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFolderRequest;
use App\Http\Requests\UpdateFolderRequest;
use App\Models\Folder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FolderController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Folder::class);

        $folders = Folder::query()
            ->withCount('titulares')
            ->with('creator:id,name')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('folders/index', [
            'folders' => $folders,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Folder::class);

        return Inertia::render('folders/create');
    }

    public function store(StoreFolderRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $fields = $validated['fields'];
        if (! isset($fields['version'])) {
            $fields['version'] = $validated['version'];
        }
        if (! isset($fields['last_modified'])) {
            $fields['last_modified'] = now()->toIso8601String();
        }

        Folder::query()->create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'version' => $validated['version'],
            'fields' => $fields,
            'versions_history' => null,
            'is_default' => $validated['is_default'] ?? false,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('folders.index')->with('success', 'Carpeta creada correctamente.');
    }

    public function show(Folder $folder): Response
    {
        $this->authorize('view', $folder);

        $folder->loadCount('titulares')->load('creator:id,name');

        return Inertia::render('folders/show', [
            'folder' => $folder,
        ]);
    }

    public function edit(Folder $folder): Response
    {
        $this->authorize('update', $folder);

        return Inertia::render('folders/edit', [
            'folder' => $folder,
        ]);
    }

    public function update(UpdateFolderRequest $request, Folder $folder): RedirectResponse
    {
        $validated = $request->validated();
        $fields = $validated['fields'];
        if (! isset($fields['version'])) {
            $fields['version'] = $validated['version'];
        }
        $fields['last_modified'] = now()->toIso8601String();

        $folder->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'version' => $validated['version'],
            'fields' => $fields,
            'is_default' => $validated['is_default'] ?? false,
        ]);

        return redirect()->route('folders.index')->with('success', 'Carpeta actualizada correctamente.');
    }

    public function destroy(Folder $folder): RedirectResponse
    {
        $this->authorize('delete', $folder);

        $folder->delete();

        return redirect()->route('folders.index')->with('success', 'Carpeta desactivada correctamente.');
    }
}
