<?php

namespace Tests\Feature;

use App\Models\Folder;
use App\Models\Project;
use App\Models\Titular;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class TitularImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_import_page(): void
    {
        $response = $this->get(route('titulares.import.create'));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_import_titulares_from_csv(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $project = Project::query()->create([
            'title' => 'Proyecto Test',
            'description' => null,
            'valor_ingreso' => 0,
            'status' => 'activo',
            'created_by' => $user->id,
        ]);
        $folder = Folder::query()->create([
            'name' => 'Carpeta Test',
            'description' => null,
            'version' => '1.0',
            'fields' => [
                'sections' => [
                    [
                        'name' => 'Datos',
                        'order' => 0,
                        'fields' => [
                            ['field_name' => 'nombres', 'label' => 'Nombres', 'order' => 0, 'type' => 'text'],
                            ['field_name' => 'apellidos', 'label' => 'Apellidos', 'order' => 1, 'type' => 'text'],
                        ],
                    ],
                ],
            ],
            'is_default' => false,
            'created_by' => $user->id,
        ]);

        $csvContent = "nombre,nombres,apellidos\nJuan Pérez,Juan,Pérez\nMaría García,María,García";
        $file = UploadedFile::fake()->createWithContent('titulares.csv', $csvContent);
        $file->mimeType('text/csv');

        $response = $this->actingAs($user)->post(route('titulares.import.store'), [
            'project_id' => $project->id,
            'folder_id' => $folder->id,
            'file' => $file,
        ]);

        $response->assertRedirect(route('titulares.import.create'));
        $response->assertSessionHas('success');

        $this->assertDatabaseCount('titulares', 2);
        $this->assertDatabaseHas('titulares', [
            'nombre' => 'Juan Pérez',
            'project_id' => $project->id,
            'folder_id' => $folder->id,
        ]);
        $this->assertDatabaseHas('titulares', [
            'nombre' => 'María García',
            'project_id' => $project->id,
            'folder_id' => $folder->id,
        ]);

        $titular1 = Titular::query()->where('nombre', 'Juan Pérez')->first();
        $this->assertSame('Juan', $titular1->data['nombres'] ?? null);
        $this->assertSame('Pérez', $titular1->data['apellidos'] ?? null);
    }
}
