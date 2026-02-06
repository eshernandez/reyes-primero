<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use Auditable, SoftDeletes;

    public const STATUS_ACTIVO = 'activo';

    public const STATUS_INACTIVO = 'inactivo';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'description',
        'valor_ingreso',
        'fecha_inicio',
        'fecha_fin',
        'status',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'valor_ingreso' => 'decimal:2',
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return list<string>
     */
    protected static function auditableAttributes(): array
    {
        return ['title', 'description', 'valor_ingreso', 'fecha_inicio', 'fecha_fin', 'status', 'created_by'];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<Titular, $this>
     */
    public function titulares(): HasMany
    {
        return $this->hasMany(Titular::class);
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function auxiliares(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user')->withTimestamps();
    }
}
