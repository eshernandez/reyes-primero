<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTitularNoteRequest;
use App\Models\Titular;
use Illuminate\Http\RedirectResponse;

class TitularNoteController extends Controller
{
    public function store(StoreTitularNoteRequest $request, Titular $titulare): RedirectResponse
    {
        $titulare->notes()->create([
            'user_id' => $request->user()->id,
            'body' => $request->input('body'),
        ]);

        if ($request->boolean('mark_as_returned')) {
            $titulare->update(['status' => Titular::STATUS_DEVUELTO]);
        }

        return redirect()->route('titulares.show', $titulare)->with('success', 'Nota agregada correctamente.');
    }
}
