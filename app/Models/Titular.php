<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Titular extends Model implements AuthenticatableContract
{
    use Auditable, Authenticatable, SoftDeletes;

    protected $table = 'titulares';

    public const STATUS_EN_PROCESO = 'en_proceso';

    public const STATUS_ACEPTADO = 'aceptado';

    public const STATUS_RECHAZADO = 'rechazado';

    public const STATUS_DEVUELTO = 'devuelto';

    public const STATUS_REVISION = 'revision';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'nombre',
        'access_code',
        'unique_url',
        'project_id',
        'folder_id',
        'folder_version',
        'data',
        'consents_accepted',
        'completion_percentage',
        'status',
        'is_active',
        'last_access',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data' => 'array',
            'consents_accepted' => 'array',
            'is_active' => 'boolean',
            'last_access' => 'datetime',
        ];
    }

    public function getAuthPasswordName(): string
    {
        return 'access_code';
    }

    public function getAuthPassword(): string
    {
        return $this->access_code;
    }

    public function getRememberTokenName(): ?string
    {
        return null;
    }

    /**
     * @return list<string>
     */
    protected static function auditableAttributes(): array
    {
        return ['nombre', 'project_id', 'folder_id', 'folder_version', 'data', 'consents_accepted', 'completion_percentage', 'is_active', 'last_access', 'created_by'];
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return BelongsTo<Folder, $this>
     */
    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<TitularNote, $this>
     */
    public function notes(): HasMany
    {
        return $this->hasMany(TitularNote::class);
    }

    /**
     * @return HasMany<Aporte, $this>
     */
    public function aportes(): HasMany
    {
        return $this->hasMany(Aporte::class);
    }

    /**
     * @return list<string>
     */
    public static function statusLabels(): array
    {
        return [
            self::STATUS_EN_PROCESO => 'En proceso',
            self::STATUS_ACEPTADO => 'Aceptado',
            self::STATUS_RECHAZADO => 'Rechazado',
            self::STATUS_DEVUELTO => 'Devuelto',
            self::STATUS_REVISION => 'En revisión',
        ];
    }
}
