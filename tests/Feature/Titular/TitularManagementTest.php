<?php

namespace Tests\Feature\Titular;

use App\Models\Folder;
use App\Models\Project;
use App\Models\Titular;
use App\Models\User;
use App\Services\TitularAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TitularManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_titulares_index(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $response = $this->actingAs($user)->get(route('titulares.index'));

        $response->assertOk();
    }

    public function test_auxiliar_can_view_titulares_index_for_assigned_projects_only(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_AUXILIAR]);
        $project = Project::query()->create([
            'title' => 'Proyecto Test',
            'description' => null,
            'valor_ingreso' => 0,
            'status' => 'activo',
            'created_by' => $user->id,
        ]);
        $user->assignedProjects()->attach($project->id);

        $response = $this->actingAs($user)->get(route('titulares.index'));

        $response->assertOk();
    }

    public function test_admin_can_create_titular(): void
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
            'fields' => ['version' => '1.0', 'fields' => []],
            'is_default' => false,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->post(route('titulares.store'), [
            'nombre' => 'Titular Test',
            'project_id' => $project->id,
            'folder_id' => $folder->id,
        ]);

        $response->assertRedirect(route('titulares.index'));
        $this->assertDatabaseHas('titulares', [
            'nombre' => 'Titular Test',
            'project_id' => $project->id,
            'folder_id' => $folder->id,
        ]);
    }

    public function test_admin_can_edit_titular_folder_data_and_only_filled_by_admin_fields_are_updated(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $authService = new TitularAuthService;
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
                'version' => '1.0',
                'sections' => [
                    ['name' => 'Datos', 'order' => 0, 'fields' => [
                        ['field_name' => 'nombres', 'label' => 'Nombres', 'type' => 'text', 'required' => true, 'filled_by_admin' => false, 'validation' => ['required', 'string'], 'order' => 0],
                        ['field_name' => 'observaciones', 'label' => 'Observaciones', 'type' => 'textarea', 'required' => false, 'filled_by_admin' => true, 'validation' => ['string'], 'order' => 1],
                    ]],
                ],
            ],
            'is_default' => false,
            'created_by' => $user->id,
        ]);
        $titular = Titular::query()->create([
            'nombre' => 'Titular Data Test',
            'access_code' => $authService->generateAccessCode(),
            'unique_url' => $authService->generateUniqueUrl(),
            'project_id' => $project->id,
            'folder_id' => $folder->id,
            'folder_version' => $folder->version,
            'data' => ['nombres' => 'Juan'],
            'consents_accepted' => [],
            'completion_percentage' => 50,
            'status' => Titular::STATUS_EN_PROCESO,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->get(route('titulares.data.edit', $titular));
        $response->assertOk();

        $response = $this->actingAs($user)->put(route('titulares.data.update', $titular), [
            'data' => [
                'nombres' => 'Intentar cambiar',
                'observaciones' => 'Nota del admin',
            ],
        ]);
        $response->assertRedirect(route('titulares.show', $titular));

        $titular->refresh();
        $this->assertSame('Juan', $titular->data['nombres'] ?? null);
        $this->assertSame('Nota del admin', $titular->data['observaciones'] ?? null);
    }

    public function test_admin_can_regenerate_titular_access_code(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $authService = new TitularAuthService;
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
            'fields' => ['version' => '1.0', 'fields' => []],
            'is_default' => false,
            'created_by' => $user->id,
        ]);
        $titular = Titular::query()->create([
            'nombre' => 'Titular Code Test',
            'access_code' => '111111',
            'unique_url' => $authService->generateUniqueUrl(),
            'project_id' => $project->id,
            'folder_id' => $folder->id,
            'folder_version' => $folder->version,
            'data' => [],
            'consents_accepted' => [],
            'completion_percentage' => 0,
            'status' => Titular::STATUS_EN_PROCESO,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->post(route('titulares.regenerate-code', $titular));

        $response->assertRedirect(route('titulares.show', $titular));
        $response->assertSessionHas('success');
        $titular->refresh();
        $this->assertNotSame('111111', $titular->access_code);
        $this->assertMatchesRegularExpression('/^\d{6}$/', $titular->access_code);
    }

    public function test_admin_can_regenerate_titular_unique_url(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $authService = new TitularAuthService;
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
            'fields' => ['version' => '1.0', 'fields' => []],
            'is_default' => false,
            'created_by' => $user->id,
        ]);
        $oldUrl = 'old-unique-url-token-32-chars!!';
        $titular = Titular::query()->create([
            'nombre' => 'Titular URL Test',
            'access_code' => $authService->generateAccessCode(),
            'unique_url' => $oldUrl,
            'project_id' => $project->id,
            'folder_id' => $folder->id,
            'folder_version' => $folder->version,
            'data' => [],
            'consents_accepted' => [],
            'completion_percentage' => 0,
            'status' => Titular::STATUS_EN_PROCESO,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->post(route('titulares.regenerate-url', $titular));

        $response->assertRedirect(route('titulares.show', $titular));
        $response->assertSessionHas('success');
        $titular->refresh();
        $this->assertNotSame($oldUrl, $titular->unique_url);
        $this->assertSame(32, strlen($titular->unique_url));
    }
}
