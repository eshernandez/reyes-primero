<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreConsentRequest;
use App\Http\Requests\UpdateConsentRequest;
use App\Models\Consent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsentController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Consent::class);

        $consents = Consent::query()
            ->withCount('folders')
            ->with('creator:id,name')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('consents/index', [
            'consents' => $consents,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Consent::class);

        return Inertia::render('consents/create');
    }

    public function store(StoreConsentRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Consent::query()->create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'version' => $validated['version'],
            'is_active' => $validated['is_active'] ?? true,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('consents.index')->with('success', 'Consentimiento creado correctamente.');
    }

    public function edit(Consent $consent): Response
    {
        $this->authorize('update', $consent);

        return Inertia::render('consents/edit', [
            'consent' => $consent,
        ]);
    }

    public function update(UpdateConsentRequest $request, Consent $consent): RedirectResponse
    {
        $validated = $request->validated();

        $consent->update([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'version' => $validated['version'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('consents.index')->with('success', 'Consentimiento actualizado correctamente.');
    }

    public function destroy(Consent $consent): RedirectResponse
    {
        $this->authorize('delete', $consent);

        $consent->delete();

        return redirect()->route('consents.index')->with('success', 'Consentimiento eliminado correctamente.');
    }
}
