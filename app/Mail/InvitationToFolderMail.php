<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvitationToFolderMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     *
     * @param  array{accessUrl: string, accessCode: string, subject: string, recipientName?: string|null}  $data
     */
    public function __construct(
        public array $data
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->data['subject'] ?? 'Invitación a tu carpeta privada',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.invitation-to-folder',
            with: [
                'accessUrl' => $this->data['accessUrl'],
                'accessCode' => $this->data['accessCode'] ?? '',
                'subject' => $this->data['subject'] ?? 'Invitación a tu carpeta privada',
                'recipientName' => $this->data['recipientName'] ?? null,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
