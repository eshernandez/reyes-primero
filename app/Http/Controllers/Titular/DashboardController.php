<?php

namespace App\Http\Controllers\Titular;

use App\Http\Controllers\Controller;
use App\Models\Titular;
use App\Services\TitularDataService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Sections with visible_only_for_admin fields removed (for titular view).
     *
     * @param  array<int, array{name: string, order: int, fields: array<int, array<string, mixed>>}>  $sections
     * @return array<int, array{name: string, order: int, fields: array<int, array<string, mixed>>}>
     */
    private static function sectionsForTitular(array $sections): array
    {
        $result = [];
        foreach ($sections as $sec) {
            $fields = array_filter($sec['fields'] ?? [], function ($field) {
                return empty($field['visible_only_for_admin']);
            });
            $result[] = [
                'name' => $sec['name'] ?? 'Sección',
                'order' => (int) ($sec['order'] ?? 0),
                'fields' => array_values($fields),
            ];
        }

        return $result;
    }

    /**
     * Field names that are visible_only_for_admin (to strip from data sent to titular).
     *
     * @param  array<int, array{fields: array<int, array<string, mixed>>}>  $sections
     * @return list<string>
     */
    private static function adminOnlyFieldNames(array $sections): array
    {
        $names = [];
        foreach ($sections as $sec) {
            foreach ($sec['fields'] ?? [] as $field) {
                if (! empty($field['visible_only_for_admin'])) {
                    $name = $field['field_name'] ?? null;
                    if (is_string($name)) {
                        $names[] = $name;
                    }
                }
            }
        }

        return $names;
    }

    public function __invoke(Request $request): Response|RedirectResponse
    {
        /** @var Titular $titular */
        $titular = auth()->guard('titular')->user();
        $titular->load(['folder', 'project', 'notes' => fn ($q) => $q->with('author:id,name')->latest()]);

        $completionPercentage = (new TitularDataService)->calculateCompletionPercentage($titular);
        if ($titular->completion_percentage !== $completionPercentage) {
            $titular->update(['completion_percentage' => $completionPercentage]);
        }

        $folder = $titular->folder;
        $allSections = $folder->getSections();
        $sections = self::sectionsForTitular($allSections);
        $adminOnlyKeys = self::adminOnlyFieldNames($allSections);
        $titularData = $titular->data ?? [];
        foreach (array_keys($titularData) as $key) {
            if (in_array($key, $adminOnlyKeys, true)) {
                unset($titularData[$key]);
            }
        }
        $consentsRequired = $folder->consents()->where('is_active', true)->orderByPivot('order')->get();

        $notes = $titular->notes->map(fn ($n) => [
            'id' => $n->id,
            'body' => $n->body,
            'created_at' => $n->created_at->toIso8601String(),
            'completed_at' => $n->completed_at?->toIso8601String(),
            'author' => $n->author ? ['id' => $n->author->id, 'name' => $n->author->name] : ['id' => 0, 'name' => 'Administrador'],
        ])->all();

        return Inertia::render('titular/dashboard', [
            'titular' => [
                'id' => $titular->id,
                'nombre' => $titular->nombre,
                'data' => $titularData,
                'completion_percentage' => $titular->completion_percentage,
                'folder_version' => $titular->folder_version,
            ],
            'notes' => $notes,
            'folder' => [
                'id' => $folder->id,
                'name' => $folder->name,
                'version' => $folder->version,
                'sections' => $sections,
            ],
            'project' => [
                'id' => $titular->project->id,
                'title' => $titular->project->title,
            ],
            'consentsRequired' => $consentsRequired->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'content' => $c->content,
                'version' => $c->version,
            ]),
            'consentsAccepted' => $titular->consents_accepted ?? [],
        ]);
    }
}
