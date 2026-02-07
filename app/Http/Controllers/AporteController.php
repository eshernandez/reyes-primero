<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAporteRequest;
use App\Models\Aporte;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AporteController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Aporte::class);

        $query = Aporte::query()
            ->with(['titular:id,nombre,project_id', 'plan:id,nombre', 'approvedByUser:id,name'])
            ->latest();

        if ($request->user()->isAuxiliar()) {
            $projectIds = $request->user()->assignedProjects()->pluck('projects.id');
            $query->whereHas('titular', fn ($q) => $q->whereIn('project_id', $projectIds));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }
        if ($request->filled('plan_id')) {
            $query->where('plan_id', $request->integer('plan_id'));
        }

        $aportes = $query->paginate(15)->withQueryString();
        $plans = Plan::query()->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('aportes/index', [
            'aportes' => $aportes,
            'plans' => $plans,
            'estadoLabels' => Aporte::estadoLabels(),
            'filters' => $request->only(['estado', 'plan_id']),
        ]);
    }

    public function show(Aporte $aporte): Response
    {
        $this->authorize('view', $aporte);

        $aporte->load(['titular.project:id,title', 'plan:id,nombre', 'approvedByUser:id,name']);
        $plans = Plan::query()->orderBy('nombre')->get(['id', 'nombre', 'valor_ingreso', 'fecha_cierre']);

        return Inertia::render('aportes/show', [
            'aporte' => $aporte,
            'plans' => $plans,
            'estadoLabels' => Aporte::estadoLabels(),
        ]);
    }

    public function update(UpdateAporteRequest $request, Aporte $aporte): RedirectResponse
    {
        $aporte->update([
            'plan_id' => $request->validated('estado') === 'aprobado' ? $request->validated('plan_id') : null,
            'estado' => $request->validated('estado'),
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);

        $message = $request->validated('estado') === 'aprobado'
            ? 'Aporte aprobado y asociado al plan.'
            : 'Aporte rechazado.';

        return redirect()->route('aportes.show', $aporte)->with('success', $message);
    }
}
