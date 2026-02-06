<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function (Model $model): void {
            static::logAudit($model, 'created', null, $model->getAttributes());
        });

        static::updated(function (Model $model): void {
            $changes = $model->getChanges();
            unset($changes['updated_at']);
            if ($changes !== []) {
                static::logAudit($model, 'updated', $model->getOriginal(), $model->getAttributes());
            }
        });

        static::deleted(function (Model $model): void {
            static::logAudit($model, 'deleted', $model->getAttributes(), null);
        });
    }

    protected static function logAudit(Model $model, string $action, ?array $oldValues, ?array $newValues): void
    {
        $user = auth()->user();
        $userType = $user ? 'User' : 'System';
        $userId = $user?->getAuthIdentifier() ?? 0;

        if (auth()->guard('titular')->check()) {
            $userType = 'Titular';
            $userId = auth()->guard('titular')->id();
        }

        $keys = array_flip(static::auditableAttributes());
        AuditLog::query()->create([
            'user_type' => $userType,
            'user_id' => $userId,
            'action' => $action,
            'auditable_type' => $model->getMorphClass(),
            'auditable_id' => $model->getKey(),
            'old_values' => $oldValues !== null ? array_intersect_key($oldValues, $keys) : null,
            'new_values' => $newValues !== null ? array_intersect_key($newValues, $keys) : null,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    /**
     * Attributes to include in audit log (empty = all fillable except sensitive).
     *
     * @return list<string>
     */
    protected static function auditableAttributes(): array
    {
        $model = new static;
        $fillable = $model->getFillable();
        $hidden = ['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'];

        return array_values(array_diff($fillable, $hidden));
    }
}
