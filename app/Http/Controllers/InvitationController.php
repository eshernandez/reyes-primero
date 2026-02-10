<?php

namespace App\Http\Controllers;

use App\Mail\InvitationToFolderMail;
use App\Models\Communication;
use App\Models\Titular;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class InvitationController extends Controller
{
    /**
     * Drivers like "log" or "array" don't actually send to a mail server;
     * we should only mark communications as "sent" when they really are.
     */
    private static function mailDriverReallySends(): bool
    {
        $driver = config('mail.default');

        return ! in_array($driver, ['log', 'array'], true);
    }

    public function sendInvitation(Titular $titulare): RedirectResponse|JsonResponse
    {
        $this->authorize('update', $titulare);

        $email = $titulare->getEmailFromData();
        if (! $email) {
            if (request()->wantsJson() || request()->header('X-Inertia')) {
                return back()->withErrors(['email' => 'El titular no tiene correo electrónico registrado en su carpeta.']);
            }

            return response()->json(['message' => 'El titular no tiene correo electrónico registrado.'], 422);
        }

        $accessUrl = rtrim(config('app.url'), '/').'/titular/access/'.$titulare->unique_url;
        $recipientName = is_string($titulare->data['nombre'] ?? null) ? $titulare->data['nombre'] : $titulare->nombre;
        $subject = 'Invitación a tu carpeta privada';

        $communication = Communication::query()->create([
            'type' => Communication::TYPE_INVITATION,
            'titular_id' => $titulare->id,
            'user_id' => auth()->id(),
            'to_email' => $email,
            'subject' => $subject,
            'status' => Communication::STATUS_PENDING,
        ]);

        try {
            Mail::to($email)->send(new InvitationToFolderMail([
                'accessUrl' => $accessUrl,
                'accessCode' => $titulare->access_code,
                'subject' => $subject,
                'recipientName' => $recipientName,
            ]));
            if (static::mailDriverReallySends()) {
                $communication->update([
                    'status' => Communication::STATUS_SENT,
                    'sent_at' => now(),
                ]);
                $titulare->update(['invitation_sent_at' => now()]);
            }
        } catch (\Throwable $e) {
            $communication->update([
                'status' => Communication::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);

            return back()->withErrors(['email' => 'No se pudo enviar el correo: '.$e->getMessage()]);
        }

        return back()->with('success', 'Invitación enviada correctamente.');
    }

    /**
     * @return RedirectResponse|JsonResponse
     */
    public function sendBulkInvitations(Request $request)
    {
        $validated = $request->validate([
            'titular_ids' => ['required', 'array'],
            'titular_ids.*' => ['integer', Rule::exists('titulares', 'id')],
            'include_already_invited' => ['sometimes', 'boolean'],
        ]);

        $includeAlreadyInvited = $validated['include_already_invited'] ?? false;
        $ids = array_unique($validated['titular_ids']);
        $titulares = Titular::query()->whereIn('id', $ids)->get();

        $sent = 0;
        $failed = 0;
        $noEmail = 0;
        $unauthorized = 0;

        foreach ($titulares as $titular) {
            if (! Gate::forUser($request->user())->allows('update', $titular)) {
                $unauthorized++;

                continue;
            }
            if (! $includeAlreadyInvited && $titular->invitation_sent_at !== null) {
                continue;
            }
            $email = $titular->getEmailFromData();
            if (! $email) {
                $noEmail++;

                continue;
            }

            $accessUrl = rtrim(config('app.url'), '/').'/titular/access/'.$titular->unique_url;
            $recipientName = is_string($titular->data['nombre'] ?? null) ? $titular->data['nombre'] : $titular->nombre;
            $subject = 'Invitación a tu carpeta privada';

            $communication = Communication::query()->create([
                'type' => Communication::TYPE_INVITATION,
                'titular_id' => $titular->id,
                'user_id' => auth()->id(),
                'to_email' => $email,
                'subject' => $subject,
                'status' => Communication::STATUS_PENDING,
            ]);

            try {
                Mail::to($email)->send(new InvitationToFolderMail([
                    'accessUrl' => $accessUrl,
                    'accessCode' => $titular->access_code,
                    'subject' => $subject,
                    'recipientName' => $recipientName,
                ]));
                if (static::mailDriverReallySends()) {
                    $communication->update([
                        'status' => Communication::STATUS_SENT,
                        'sent_at' => now(),
                    ]);
                    $titular->update(['invitation_sent_at' => now()]);
                }
                $sent++;
            } catch (\Throwable $e) {
                $communication->update([
                    'status' => Communication::STATUS_FAILED,
                    'error_message' => $e->getMessage(),
                ]);
                $failed++;
            }
        }

        $message = "Enviadas: {$sent}. Sin correo: {$noEmail}. Fallos: {$failed}.";
        if ($unauthorized > 0) {
            $message .= " Sin permiso: {$unauthorized}.";
        }

        return back()->with('success', $message);
    }
}
