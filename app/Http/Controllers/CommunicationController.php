<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommunicationRequest;
use App\Mail\CustomCommunicationMail;
use App\Mail\InvitationToFolderMail;
use App\Models\Communication;
use App\Models\Titular;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class CommunicationController extends Controller
{
    /**
     * Drivers like "log" or "array" don't actually send to a mail server;
     * we only mark communications as "sent" when they really are.
     */
    private function mailDriverReallySends(): bool
    {
        $driver = config('mail.default');

        return ! in_array($driver, ['log', 'array'], true);
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Titular::class);

        $query = Communication::query()
            ->with(['user:id,name', 'titular:id,nombre'])
            ->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('to_email', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        $communications = $query->paginate(15)->withQueryString();

        $communicationDetail = null;
        if ($request->filled('communication_id')) {
            $communicationDetail = Communication::query()
                ->with(['user:id,name', 'titular:id,nombre'])
                ->find($request->integer('communication_id'));
        }

        return Inertia::render('communications/index', [
            'communications' => $communications,
            'communicationDetail' => $communicationDetail,
            'filters' => $request->only(['type', 'status', 'search']),
            'typeLabels' => [
                Communication::TYPE_INVITATION => 'Invitación a carpeta',
                Communication::TYPE_CUSTOM => 'Comunicación',
            ],
            'statusLabels' => [
                Communication::STATUS_PENDING => 'Pendiente',
                Communication::STATUS_SENT => 'Enviado',
                Communication::STATUS_FAILED => 'Fallido',
            ],
        ]);
    }

    public function resend(Communication $communication): RedirectResponse
    {
        $this->authorize('viewAny', Titular::class);

        if ($communication->type === Communication::TYPE_INVITATION) {
            $titular = $communication->titular;
            if (! $titular) {
                return back()->withErrors(['resend' => 'El titular asociado ya no existe.']);
            }
            $email = $titular->getEmailFromData();
            if (! $email) {
                return back()->withErrors(['resend' => 'El titular no tiene correo electrónico.']);
            }
            $accessUrl = rtrim(config('app.url'), '/').'/titular/access/'.$titular->unique_url;
            $recipientName = is_string($titular->data['nombre'] ?? null) ? $titular->data['nombre'] : $titular->nombre;
            $subject = $communication->subject ?: 'Invitación a tu carpeta privada';

            $newComm = Communication::query()->create([
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
                if ($this->mailDriverReallySends()) {
                    $newComm->update([
                        'status' => Communication::STATUS_SENT,
                        'sent_at' => now(),
                    ]);
                    $titular->update(['invitation_sent_at' => now()]);
                }
            } catch (\Throwable $e) {
                $newComm->update([
                    'status' => Communication::STATUS_FAILED,
                    'error_message' => $e->getMessage(),
                ]);

                return back()->withErrors(['resend' => 'No se pudo reenviar: '.$e->getMessage()]);
            }
        } else {
            $newComm = Communication::query()->create([
                'type' => Communication::TYPE_CUSTOM,
                'user_id' => auth()->id(),
                'to_email' => $communication->to_email,
                'subject' => $communication->subject,
                'body' => $communication->body ?? '',
                'status' => Communication::STATUS_PENDING,
            ]);

            try {
                Mail::to($communication->to_email)->send(new CustomCommunicationMail([
                    'subject' => $communication->subject,
                    'body' => $communication->body ?? '',
                ]));
                if ($this->mailDriverReallySends()) {
                    $newComm->update([
                        'status' => Communication::STATUS_SENT,
                        'sent_at' => now(),
                    ]);
                }
            } catch (\Throwable $e) {
                $newComm->update([
                    'status' => Communication::STATUS_FAILED,
                    'error_message' => $e->getMessage(),
                ]);

                return back()->withErrors(['resend' => 'No se pudo reenviar: '.$e->getMessage()]);
            }
        }

        return back()->with('success', 'Correo reenviado correctamente.');
    }

    public function store(StoreCommunicationRequest $request): RedirectResponse
    {
        $this->authorize('viewAny', Titular::class);

        $validated = $request->validated();

        $communication = Communication::query()->create([
            'type' => Communication::TYPE_CUSTOM,
            'user_id' => auth()->id(),
            'to_email' => $validated['to_email'],
            'subject' => $validated['subject'],
            'body' => $validated['body'],
            'status' => Communication::STATUS_PENDING,
        ]);

        try {
            Mail::to($validated['to_email'])->send(new CustomCommunicationMail([
                'subject' => $validated['subject'],
                'body' => $validated['body'],
            ]));
            if ($this->mailDriverReallySends()) {
                $communication->update([
                    'status' => Communication::STATUS_SENT,
                    'sent_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            $communication->update([
                'status' => Communication::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);

            return back()->withErrors(['email' => 'No se pudo enviar el correo: '.$e->getMessage()]);
        }

        return back()->with('success', 'Comunicación enviada correctamente.');
    }
}
