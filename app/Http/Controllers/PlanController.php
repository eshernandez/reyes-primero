<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePlanRequest;
use App\Http\Requests\UpdatePlanRequest;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Plan::class);

        $plans = Plan::query()
            ->withCount('aportes')
            ->with('creator:id,name')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('plans/index', [
            'plans' => $plans,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Plan::class);

        return Inertia::render('plans/create');
    }

    public function store(StorePlanRequest $request): RedirectResponse
    {
        Plan::query()->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('plans.index')->with('success', 'Plan creado correctamente.');
    }

    public function show(Plan $plan): Response
    {
        $this->authorize('view', $plan);

        $plan->loadCount('aportes')->load('creator:id,name');

        return Inertia::render('plans/show', [
            'plan' => $plan,
        ]);
    }

    public function edit(Plan $plan): Response
    {
        $this->authorize('update', $plan);

        return Inertia::render('plans/edit', [
            'plan' => $plan,
        ]);
    }

    public function update(UpdatePlanRequest $request, Plan $plan): RedirectResponse
    {
        $plan->update($request->validated());

        return redirect()->route('plans.index')->with('success', 'Plan actualizado correctamente.');
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        $this->authorize('delete', $plan);

        $plan->delete();

        return redirect()->route('plans.index')->with('success', 'Plan eliminado correctamente.');
    }
}
