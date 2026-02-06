<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Folder extends Model
{
    use Auditable, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'description',
        'version',
        'fields',
        'versions_history',
        'is_default',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fields' => 'array',
            'versions_history' => 'array',
            'is_default' => 'boolean',
        ];
    }

    /**
     * @return list<string>
     */
    protected static function auditableAttributes(): array
    {
        return ['name', 'description', 'version', 'fields', 'versions_history', 'is_default', 'created_by'];
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
     * @return BelongsToMany<Consent, $this>
     */
    public function consents(): BelongsToMany
    {
        return $this->belongsToMany(Consent::class, 'folder_consent')->withPivot('order')->withTimestamps();
    }

    /**
     * Return all fields in order (flattened). Supports legacy "fields" and new "sections" structure.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getFieldsArray(): array
    {
        $sections = $this->getSections();
        $all = [];
        foreach ($sections as $section) {
            foreach ($section['fields'] as $field) {
                $all[] = $field;
            }
        }

        return $all;
    }

    /**
     * Return sections with their fields. If folder uses legacy "fields" only, returns one section "Datos".
     *
     * @return array<int, array{name: string, order: int, fields: array<int, array<string, mixed>>}>
     */
    public function getSections(): array
    {
        $fields = $this->fields;
        if (! is_array($fields)) {
            return [];
        }
        if (isset($fields['sections']) && is_array($fields['sections'])) {
            $sections = $fields['sections'];
            usort($sections, fn ($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
            $result = [];
            foreach ($sections as $sec) {
                $secFields = $sec['fields'] ?? [];
                if (! is_array($secFields)) {
                    $secFields = [];
                }
                usort($secFields, fn ($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
                $result[] = [
                    'name' => $sec['name'] ?? 'Sección',
                    'order' => (int) ($sec['order'] ?? 0),
                    'fields' => $secFields,
                ];
            }

            return $result;
        }
        $flat = $fields['fields'] ?? $fields;
        if (! is_array($flat)) {
            return [];
        }
        usort($flat, fn ($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));

        return [
            ['name' => 'Datos', 'order' => 0, 'fields' => $flat],
        ];
    }
}
