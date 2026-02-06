<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TitularNote extends Model
{
    protected $table = 'titular_notes';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'titular_id',
        'user_id',
        'body',
    ];

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
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
