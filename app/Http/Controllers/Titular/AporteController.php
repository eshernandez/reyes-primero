<?php

namespace App\Http\Controllers\Titular;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAporteRequest;
use App\Models\Aporte;
use App\Models\Titular;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AporteController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('titular/aportes/create');
    }

    public function index(Request $request): Response
    {
        /** @var Titular $titular */
        $titular = auth()->guard('titular')->user();

        $aportes = $titular->aportes()
            ->with('plan:id,nombre')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('titular/aportes/index', [
            'aportes' => $aportes,
            'estadoLabels' => Aporte::estadoLabels(),
        ]);
    }

    public function store(StoreAporteRequest $request): RedirectResponse
    {
        /** @var Titular $titular */
        $titular = auth()->guard('titular')->user();

        $aporte = Aporte::query()->create([
            'titular_id' => $titular->id,
            'valor' => $request->validated('valor'),
            'estado' => Aporte::ESTADO_PENDIENTE,
        ]);

        $file = $request->file('soporte');
        $ext = $file->getClientOriginalExtension() ?: $file->guessExtension();
        $filename = 'soporte_'.now()->format('YmdHis').'.'.$ext;
        $path = $file->storeAs('aportes/'.$aporte->id, $filename, 'local');
        $aporte->update(['soporte_path' => $path]);

        return redirect()->route('titular.aportes.index')->with('success', 'Aporte registrado correctamente. El administrador lo revisará.');
    }
}
