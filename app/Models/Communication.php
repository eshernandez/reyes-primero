<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Communication extends Model
{
    public const TYPE_INVITATION = 'invitation';

    public const TYPE_CUSTOM = 'custom';

    public const STATUS_PENDING = 'pending';

    public const STATUS_SENT = 'sent';

    public const STATUS_FAILED = 'failed';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'type',
        'titular_id',
        'user_id',
        'to_email',
        'subject',
        'body',
        'status',
        'sent_at',
        'error_message',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Titular, $this>
     */
    public function titular(): BelongsTo
    {
        return $this->belongsTo(Titular::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
